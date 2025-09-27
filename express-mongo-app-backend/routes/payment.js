const express = require('express');
const authMiddleware = require('../middleware/auth');
const Expense = require('../models/expense');
const Payment = require('../models/payment');
const Balance = require('../models/balance');
const router = express.Router();

// CREATE payment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { expense_id, amount, payment_method, confirmation_code } = req.body;
    const payer_id = req.user._id; 

    if ((payment_method === 'Gcash' || payment_method === 'Bank') && !confirmation_code) {
      return res.status(400).json({ error: 'Confirmation code is required for Gcash or Bank payments' });
    }

    const newPayment = new Payment({
      expense_id,
      payer_id,
      amount,
      payment_method,
      confirmation_code: confirmation_code || null,
      payment_status: 'confirmed' 
    });

    await newPayment.save();

    const expense = await Expense.findById(expense_id).populate('paid_by');
    let balances = await Balance.find({
      group_id: expense.group,
      user_id: payer_id
    });

    let amountLeft = amount;
    for (let bal of balances) {
      if (amountLeft <= 0) break;

      if (bal.amount > 0) {
        const reduction = Math.min(bal.amount, amountLeft);
        bal.amount -= reduction;
        amountLeft -= reduction;
        bal.status = bal.amount === 0 ? 'paid' : 'partial';
        await bal.save();
      }
    }
    res.status(201).json({
      message: 'Payment created and balances updated',
      payment: newPayment
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create payment', details: err.message });
  }
});

module.exports = router;