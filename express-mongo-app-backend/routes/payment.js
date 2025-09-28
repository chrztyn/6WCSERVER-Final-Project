const express = require('express');
const authMiddleware = require('../middleware/auth');
const Expense = require('../models/expense');
const Payment = require('../models/payment');
const Groups = require('../models/groups');
const Balance = require('../models/balance')
const { applyPayment } = require('../utils/updateBalance'); 
const router = express.Router();

// CREATE payment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { expense_id, amount, payment_method, confirmation_code } = req.body;
    const payer_id = req.user._id;

    if ((payment_method === 'Gcash' || payment_method === 'Bank') && !confirmation_code) {
      return res.status(400).json({ error: 'Confirmation code is required for Gcash or Bank payments' });
    }

    const expense = await Expense.findById(expense_id).populate('paid_by');
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const newPayment = new Payment({
      expense_id,
      payer_id,
      amount,
      payment_method,
      confirmation_code: confirmation_code || null,
      payment_status: 'confirmed'
    });
    await newPayment.save();

    const { updated, remaining } = await applyPayment(payer_id, expense.group._id || expense.group, amount);

    res.status(201).json({
      message: 'Payment created and balances updated',
      payment: newPayment,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment', details: err.message });
  }
});

// SETTLE debt without specific expense
router.post('/settle-debt', authMiddleware, async (req, res) => {
  try {
    const { group_id, creditor_name, amount, payment_method, confirmation_code } = req.body;
    const payer_id = req.user._id;

    if ((payment_method === 'GCash' || payment_method === 'Bank') && !confirmation_code) {
      return res.status(400).json({ error: 'Confirmation code is required for GCash or Bank payments' });
    }

    const group = await Groups.findById(group_id).populate('members');
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const creditor = group.members.find(member => member.name === creditor_name);
    if (!creditor) return res.status(404).json({ error: 'Creditor not found in group' });

    const newPayment = new Payment({
      payer_id,
      creditor_id: creditor._id,
      group_id,
      amount,
      payment_method,
      confirmation_code: confirmation_code || null,
      payment_status: 'confirmed'
    });
    await newPayment.save();

    await Balance.findOneAndUpdate(
      {
        group_id: group_id,
        user_id: payer_id,
        owed_to: creditor._id
      },
      { $inc: { amount: -amount } },
      { new: true }
    );

    res.status(201).json({
      message: 'Debt settlement processed successfully',
      payment: newPayment
    });
  } catch (err) {
    console.error('Error settling debt:', err);
    res.status(500).json({ error: 'Failed to settle debt', details: err.message });
  }
});

module.exports = router;