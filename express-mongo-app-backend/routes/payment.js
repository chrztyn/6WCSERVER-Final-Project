const express = require('express');
const authMiddleware = require('../middleware/auth');
const Expense = require('../models/expense');
const Payment = require('../models/payment');
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

module.exports = router;