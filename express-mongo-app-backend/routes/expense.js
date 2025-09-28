const express = require('express');
const authMiddleware = require('../middleware/auth');
const Users = require('../models/users'); 
const Groups = require('../models/groups');
const Expense = require('../models/expense');
const Balance = require('../models/balance');
const { updateBalancesAfterExpense } = require('../utils/updateBalance'); 

const router = express.Router();


const revertBalancesAfterExpenseDelete = async (groupId, memberShare, payorUsers) => {
  try {
    const group = await Groups.findById(groupId).populate('members');
    
    for (let member of group.members) {
      const memberId = member._id.toString();
      const memberShareAmount = memberShare[memberId];
      
      if (Math.abs(memberShareAmount) < 0.01) continue; 
      
      for (let payor of payorUsers) {
        const payorId = payor._id.toString();
        
        if (memberId === payorId) continue;
        
        const sharePerPayor = memberShareAmount / payorUsers.length;
        
        if (memberShareAmount > 0) {
          const balance = await Balance.findOne({
            group_id: groupId,
            user_id: memberId,
            owed_to: payorId
          });
          
          if (balance) {
            balance.amount -= sharePerPayor;
            if (balance.amount <= 0.01) {
              await Balance.findByIdAndDelete(balance._id);
            } else {
              await balance.save();
            }
          }
        } else {
          const balance = await Balance.findOne({
            group_id: groupId,
            user_id: payorId,
            owed_to: memberId
          });
          
          if (balance) {
            balance.amount += sharePerPayor;
            if (balance.amount <= 0.01) {
              await Balance.findByIdAndDelete(balance._id);
            } else {
              await balance.save();
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reverting balances:', error);
    throw error;
  }
};

// ADD expense to a group
router.post('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { description, amount, paid_by, date, status } = req.body;

    const group = await Groups.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    const payorUsers = await Users.find({ email: { $in: paid_by } });
    if (payorUsers.length !== paid_by.length) {
      return res.status(404).json({ msg: 'Some payors are not members of the group' });
    }

    const memberIds = group.members.map(id => id.toString());
    const invalidPayors = payorUsers.filter(
      user => !memberIds.includes(user._id.toString())
    );

    if (invalidPayors.length > 0) {
      return res.status(400).json({
        msg: 'Some payors are not members of the group',
        invalid: invalidPayors.map(u => u.email)
      });
    }

    const expense = new Expense({
      group: groupId,
      paid_by: payorUsers.map(u => u._id),
      description,
      amount,
      date: date || Date.now(),
      status: status || 'pending'
    });
    await expense.save();

    const share = amount / group.members.length;
    let memberShare = {};
    for (let member of group.members) {
      memberShare[member.toString()] = share;
    }

    const contribution = amount / payorUsers.length;
    for (let payor of payorUsers) {
      memberShare[payor._id.toString()] -= contribution;
    }

    await updateBalancesAfterExpense(groupId, memberShare, payorUsers);

    const populatedExpense = await expense.populate([
      { path: 'paid_by', select: 'name email' },
      { path: 'group', select: 'name description' }
    ]);

    res.status(201).json({
      message: 'Expense added successfully',
      expense: populatedExpense
    });
  } catch (err) {
    console.error('Error adding expense:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// VIEW expenses 
router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Groups.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    const isMember = group.members.map(m => m.toString()).includes(req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ msg: 'You are not authorized to view this group\'s expenses' });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate('paid_by', 'name email')
      .populate('group', 'name description')
      .sort({ date: -1 });

    const formattedExpenses = expenses.map(expense => ({
      _id: expense._id,
      description: expense.description,
      payor: expense.paid_by,
      amount: expense.amount,
      date: expense.date,
      status: expense.status
    }));

    res.json({
      group: {
        name: group.name,
        description: group.description
      },
      expenses: formattedExpenses
    });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

//DELETE expense
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const expenseId = req.params.id;

    const expense = await Expense.findById(expenseId)
      .populate('group')
      .populate('paid_by');
    
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    const group = await Groups.findById(expense.group._id);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    const isMember = group.members.map(m => m.toString()).includes(req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ msg: 'You are not authorized to delete this expense' });
    }

    const isPayor = expense.paid_by.some(payor => payor._id.toString() === req.user._id.toString());
    if (!isPayor) {
      return res.status(403).json({ msg: 'Only the payor(s) of this expense can delete it' });
    }

    const share = expense.amount / group.members.length;
    let memberShare = {};
    for (let member of group.members) {
      memberShare[member.toString()] = share;
    }

    const contribution = expense.amount / expense.paid_by.length;
    for (let payor of expense.paid_by) {
      memberShare[payor._id.toString()] -= contribution;
    }

    await revertBalancesAfterExpenseDelete(expense.group._id, memberShare, expense.paid_by);

    await Expense.findByIdAndDelete(expenseId);

    res.json({ msg: 'Expense deleted successfully and balances updated' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;