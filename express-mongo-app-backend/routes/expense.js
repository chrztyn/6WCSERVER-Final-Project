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

const revertAndApplyNewBalances = async (expense, originalAmount, updatedAmount) => {
  try {
    const group = await Groups.findById(expense.group._id).populate('members');
    const payorUsers = await Users.find({ _id: { $in: expense.paid_by } });
    
    //Revert the old balances
    const originalShare = originalAmount / group.members.length;
    let originalMemberShare = {};
    for (let member of group.members) {
        originalMemberShare[member._id.toString()] = originalShare;
    }
    const originalContribution = originalAmount / payorUsers.length;
    for (let payor of payorUsers) {
        originalMemberShare[payor._id.toString()] -= originalContribution;
    }
    await revertBalancesAfterExpenseDelete(group._id, originalMemberShare, payorUsers);

    //Calculate and apply the new balances
    const newShare = updatedAmount / group.members.length;
    let newMemberShare = {};
    for (let member of group.members) {
        newMemberShare[member._id.toString()] = newShare;
    }
    const newContribution = updatedAmount / payorUsers.length;
    for (let payor of payorUsers) {
        newMemberShare[payor._id.toString()] -= newContribution;
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
    const { description, amount, paid_by, date, status, category } = req.body;

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
      status: status || 'pending',
    });
    await expense.save();

    // Calculate member shares for balance updates
    const share = amount / group.members.length;
    let memberShare = {};
    for (let member of group.members) {
      memberShare[member.toString()] = share;
    }

    const contribution = amount / payorUsers.length;
    for (let payor of payorUsers) {
      memberShare[payor._id.toString()] -= contribution;
    }

    // Update balances
    await updateBalancesAfterExpense(groupId, memberShare, payorUsers);

    // Create transaction history for the expense
    try {
      // Create split details for transaction history
      const splitDetails = group.members.map(memberId => ({
        user_id: memberId,
        amount: share,
        percentage: (share / amount) * 100
      }));

      // Create transaction for each payor (if multiple payors)
      for (let payor of payorUsers) {
        const transactionData = {
          transaction_type: 'expense',
          source_id: expense._id,
          source_model: 'Expense',
          group_id: groupId,
          amount: contribution, // Amount this specific payor paid
          currency: 'PHP',
          payer_id: payor._id,
          description: description || 'Expense',
          category: category || 'General',
          status: 'confirmed',
          transaction_date: expense.date || new Date(),
          created_by: req.user._id,
          metadata: {
            expense_split_details: splitDetails,
            total_expense_amount: amount,
            number_of_payors: payorUsers.length,
            payor_contribution: contribution
          }
        };

        const transaction = new TransactionHistory(transactionData);
        await transaction.save();
      }
      
      console.log('Transaction history created for expense:', expense._id);
    } catch (historyError) {
      console.error('Failed to create transaction history for expense:', historyError.message);
      // Continue with expense processing even if history fails
    }

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
      status: expense.status,
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

// DELETE expense
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

    // Calculate member shares for balance reversion
    const share = expense.amount / group.members.length;
    let memberShare = {};
    for (let member of group.members) {
      memberShare[member.toString()] = share;
    }

    const contribution = expense.amount / expense.paid_by.length;
    for (let payor of expense.paid_by) {
      memberShare[payor._id.toString()] -= contribution;
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
    const { description, amount, category, status } = req.body;

    const expense = await Expense.findById(expenseId)
      .populate('group')
      .populate('paid_by');
    
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

    // Check if the amount is changing
    const amountChanged = amount !== undefined && amount !== originalAmount;
    
    // Update expense fields
    if (description !== undefined) expense.description = description;
    if (amount !== undefined) expense.amount = amount;
    if (status !== undefined) expense.status = status;

    await expense.save();

    // Call the new function if the amount changed
    if (amountChanged) {
        await revertAndApplyNewBalances(expense, originalAmount, expense.amount);
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
        payer_id: expense.paid_by[0]._id, // First payor for reference
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

    // Note: If amount changed, you might want to recalculate balances
    // This would require more complex logic to revert old balances and apply new ones

    const updatedExpense = await expense.populate([
      { path: 'paid_by', select: 'name email' },
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