const express = require('express');
const authMiddleware = require('../middleware/auth');
const Users = require('../models/users'); 
const Groups = require('../models/groups');
const Expense = require('../models/expense');
const router = express.Router();

// ADD expense to a group
router.post('/:groupId', authMiddleware, async (req, res) => {
    try{
        const {groupId} = req.params;
        const {description, amount, paid_by, date, status } = req.body;
        const group = await Groups.findById(groupId);
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
            status : status || 'pending'
        });

        await expense.save();
        const populatedExpense = await expense.populate([
            { path: 'paid_by', select: 'name email -_id' },
            { path: 'group', select: 'name description -_id' }
        ]);

        res.status(201).json({
            message: 'Expense added successfully',
            expense: populatedExpense
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// VIEW expenses
router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Groups.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    const expenses = await Expense.find({ group: groupId })
      .populate('paid_by', 'name email -_id')
      .populate('group', 'name description -_id');

    const formattedExpenses = expenses.map(expense => ({
      description: expense.description,
      payor: expense.paid_by.map(user => ({ name: user.name, email: user.email })), 
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
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

//DELETE expense
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const expenseId = req.params.id;

    const expense = await Expense.findById(expenseId).populate('group');
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    
    const group = await Groups.findById(expense.group._id);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    const isMember = group.members.map(m => m.toString()).includes(req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ msg: 'You are not authorized to delete this expense' });
    }

    await Expense.findByIdAndDelete(expenseId);

    res.json({ msg: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;