const express = require('express');
const authMiddleware = require('../middleware/auth');
const Users = require('../models/users'); 
const Groups = require('../models/groups');
const Expense = require('../models/expense');
const Balance = require('../models/balance');
const TransactionHistory = require('../models/transaction');
const { updateBalancesAfterExpense } = require('../utils/updateBalance'); 

const router = express.Router();

const revertBalancesAfterExpenseDelete = async (groupId, memberShare, payorUsers) => {
  try {
    const group = await Groups.findById(groupId).populate('members');
    
    for (let memberId in memberShare) {
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

const revertAndApplyNewBalances = async (expense, originalAmount, updatedAmount, originalSplitBetween, newSplitBetween) => {
  try {
    const group = await Groups.findById(expense.group._id).populate('members');
    const payorUsers = await Users.find({ _id: { $in: expense.paid_by } });
    
    // Revert the old balances using original split members
    const originalShare = originalAmount / originalSplitBetween.length;
    let originalMemberShare = {};
    for (let memberId of originalSplitBetween) {
        originalMemberShare[memberId.toString()] = originalShare;
    }
    const originalContribution = originalAmount / payorUsers.length;
    for (let payor of payorUsers) {
        if (originalMemberShare[payor._id.toString()]) {
          originalMemberShare[payor._id.toString()] -= originalContribution;
        }
    }
    await revertBalancesAfterExpenseDelete(group._id, originalMemberShare, payorUsers);

    const newShare = updatedAmount / newSplitBetween.length;
    let newMemberShare = {};
    for (let memberId of newSplitBetween) {
        newMemberShare[memberId.toString()] = newShare;
    }
    const newContribution = updatedAmount / payorUsers.length;
    for (let payor of payorUsers) {
        if (newMemberShare[payor._id.toString()]) {
          newMemberShare[payor._id.toString()] -= newContribution;
        }
    }
    await updateBalancesAfterExpense(group._id, newMemberShare, payorUsers);
    
    console.log('Balances updated successfully after expense edit.');

  } catch (error) {
    console.error('Error during balance recalculation:', error);
    throw new Error('Failed to update balances after expense edit.');
  }
};

// ADD expense to a group
router.post('/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { description, amount, paid_by, split_between, date, status, category } = req.body;

    const group = await Groups.findById(groupId);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    // Validate payors
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

    // Validate split_between members
    let splitBetweenIds;
    if (!split_between || split_between.length === 0) {
      splitBetweenIds = group.members;
    } else {
      const splitBetweenUsers = await Users.find({ email: { $in: split_between } });
      const invalidSplitMembers = splitBetweenUsers.filter(
        user => !memberIds.includes(user._id.toString())
      );

      if (invalidSplitMembers.length > 0) {
        return res.status(400).json({
          msg: 'Some split members are not part of the group',
          invalid: invalidSplitMembers.map(u => u.email)
        });
      }

      splitBetweenIds = splitBetweenUsers.map(u => u._id);
    }

    const expense = new Expense({
      group: groupId,
      paid_by: payorUsers.map(u => u._id),
      split_between: splitBetweenIds,
      description,
      amount,
      date: date || Date.now(),
      status: status || 'pending',
    });
    await expense.save();

    const share = amount / splitBetweenIds.length;
    let memberShare = {};
    for (let memberId of splitBetweenIds) {
      memberShare[memberId.toString()] = share;
    }

    const contribution = amount / payorUsers.length;
    for (let payor of payorUsers) {
      if (memberShare[payor._id.toString()]) {
        memberShare[payor._id.toString()] -= contribution;
      }
    }

    // Update balances
    await updateBalancesAfterExpense(groupId, memberShare, payorUsers);

    // Create transaction history for the expense
    try {
      const splitDetails = splitBetweenIds.map(memberId => ({
        user_id: memberId,
        amount: share,
        percentage: (share / amount) * 100
      }));

      for (let payor of payorUsers) {
        const transactionData = {
          transaction_type: 'expense',
          related_expense_id: expense._id,
          group_id: groupId,
          amount: contribution,
          payer_id: payor._id,
          description: description || 'Expense',
          category: category || 'General',
          status: 'confirmed',
          transaction_date: new Date(),
          created_by: req.user._id,
          metadata: {
            expense_split_details: splitDetails,
            total_expense_amount: amount,
            number_of_payors: payorUsers.length,
            payor_contribution: contribution,
            split_between_count: splitBetweenIds.length
          }
        };

        const transaction = new TransactionHistory(transactionData);
        await transaction.save();
      }
      
      console.log('Transaction history created for expense:', expense._id);
    } catch (historyError) {
      console.error('Failed to create transaction history for expense:', historyError.message);
    }

    const populatedExpense = await expense.populate([
      { path: 'paid_by', select: 'name email' },
      { path: 'split_between', select: 'name email' },
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

    const group = await Groups.findById(groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    const isMember = group.members.map(m => m._id.toString()).includes(req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ msg: 'You are not authorized to view this group\'s expenses' });
    }

    const expenses = await Expense.find({ group: groupId })
      .populate('paid_by', 'name email')
      .populate('split_between', 'name email')
      .populate('group', 'name description')
      .sort({ date: -1 });

    const formattedExpenses = expenses.map(expense => ({
      _id: expense._id,
      description: expense.description,
      payor: expense.paid_by,
      split_between: expense.split_between,
      amount: expense.amount,
      date: expense.date,
      status: expense.status,
    }));

    res.json({
      group: {
        _id: group._id,
        name: group.name,
        description: group.description,
        members: group.members
      },
      expenses: formattedExpenses
    });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// DELETE expense
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const expenseId = req.params.id;

    const expense = await Expense.findById(expenseId)
      .populate('group')
      .populate('paid_by')
      .populate('split_between');
    
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

    // Calculate member shares for balance reversion (only for split_between members)
    const share = expense.amount / expense.split_between.length;
    let memberShare = {};
    for (let member of expense.split_between) {
      memberShare[member._id.toString()] = share;
    }

    const contribution = expense.amount / expense.paid_by.length;
    for (let payor of expense.paid_by) {
      if (memberShare[payor._id.toString()]) {
        memberShare[payor._id.toString()] -= contribution;
      }
    }

    // Revert balances
    await revertBalancesAfterExpenseDelete(expense.group._id, memberShare, expense.paid_by);

    // Update related transaction history to cancelled status
    try {
      await TransactionHistory.updateMany(
        { source_id: expenseId, source_model: 'Expense' },
        { 
          status: 'cancelled',
          updated_at: new Date(),
          updated_by: req.user._id,
          description: `[CANCELLED] ${expense.description || 'Expense'}`
        }
      );
      console.log('Transaction history updated to cancelled for expense:', expenseId);
    } catch (historyError) {
      console.error('Failed to update transaction history for deleted expense:', historyError.message);
    }

    await Expense.findByIdAndDelete(expenseId);

    res.json({ msg: 'Expense deleted successfully and balances updated' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// UPDATE expense
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const expenseId = req.params.id;
    const { description, amount, split_between, category, status } = req.body;

    const expense = await Expense.findById(expenseId)
      .populate('group')
      .populate('paid_by')
      .populate('split_between');
    
    if (!expense) return res.status(404).json({ msg: 'Expense not found' });

    const group = await Groups.findById(expense.group._id);
    if (!group) return res.status(404).json({ msg: 'Group not found' });

    const isMember = group.members.map(m => m.toString()).includes(req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ msg: 'You are not authorized to update this expense' });
    }

    const isPayor = expense.paid_by.some(payor => payor._id.toString() === req.user._id.toString());
    if (!isPayor) {
      return res.status(403).json({ msg: 'Only the payor(s) of this expense can update it' });
    }

    // Store original values
    const originalAmount = expense.amount;
    const originalDescription = expense.description;
    const originalSplitBetween = expense.split_between.map(m => m._id);

    // Validate new split_between members if provided
    let newSplitBetweenIds = originalSplitBetween;
    if (split_between !== undefined) {
      if (!split_between || split_between.length === 0) {
        newSplitBetweenIds = group.members;
      } else {
        const memberIds = group.members.map(id => id.toString());
        const splitBetweenUsers = await Users.find({ email: { $in: split_between } });
        const invalidSplitMembers = splitBetweenUsers.filter(
          user => !memberIds.includes(user._id.toString())
        );

        if (invalidSplitMembers.length > 0) {
          return res.status(400).json({
            msg: 'Some split members are not part of the group',
            invalid: invalidSplitMembers.map(u => u.email)
          });
        }

        newSplitBetweenIds = splitBetweenUsers.map(u => u._id);
      }
    }

    // Check if amount or split_between changed
    const amountChanged = amount !== undefined && amount !== originalAmount;
    const splitChanged = JSON.stringify(newSplitBetweenIds.map(id => id.toString()).sort()) !== 
                        JSON.stringify(originalSplitBetween.map(id => id.toString()).sort());
    
    // Update expense fields
    if (description !== undefined) expense.description = description;
    if (amount !== undefined) expense.amount = amount;
    if (split_between !== undefined) expense.split_between = newSplitBetweenIds;
    if (status !== undefined) expense.status = status;

    await expense.save();

    // Recalculate balances if amount or split members changed
    if (amountChanged || splitChanged) {
        await revertAndApplyNewBalances(
          expense, 
          originalAmount, 
          expense.amount, 
          originalSplitBetween, 
          newSplitBetweenIds
        );
    }

    // Create transaction history for the update
    try {
      const transactionData = {
        transaction_type: 'expense',
        source_id: expense._id,
        source_model: 'Expense',
        group_id: expense.group._id,
        amount: expense.amount,
        currency: 'PHP',
        payer_id: expense.paid_by[0]._id,
        description: `[UPDATED] ${expense.description}`,
        category: expense.category || 'General',
        status: 'confirmed',
        transaction_date: new Date(),
        created_by: req.user._id,
        metadata: {
          update_details: {
            original_amount: originalAmount,
            new_amount: expense.amount,
            original_description: originalDescription,
            new_description: expense.description,
            original_split_count: originalSplitBetween.length,
            new_split_count: newSplitBetweenIds.length,
            updated_fields: Object.keys(req.body)
          }
        }
      };

      const transaction = new TransactionHistory(transactionData);
      await transaction.save();
      
      console.log('Transaction history created for expense update:', expense._id);
    } catch (historyError) {
      console.error('Failed to create transaction history for expense update:', historyError.message);
    }

    const updatedExpense = await expense.populate([
      { path: 'paid_by', select: 'name email' },
      { path: 'split_between', select: 'name email' },
      { path: 'group', select: 'name description' }
    ]);

    res.json({
      message: 'Expense updated successfully',
      expense: updatedExpense
    });
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;