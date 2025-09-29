const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const Expense = require('../models/expense');
const Payment = require('../models/payment');
const Groups = require('../models/groups');
const Balance = require('../models/balance');
const TransactionHistory = require('../models/transaction');
const { applyPayment } = require('../utils/updateBalance'); 
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/payment_proofs');
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'proof-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 
                       'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, PDF, and DOC files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

// CREATE payment
router.post('/', authMiddleware, upload.single('proof'), async (req, res) => {
  try {
    const { expense_id, amount, payment_method, confirmation_code } = req.body;
    const payer_id = req.user._id;

    if ((payment_method === 'GCash' || payment_method === 'Bank') && !confirmation_code) {
      return res.status(400).json({ error: 'Confirmation code is required for GCash or Bank payments' });
    }

    const expense = await Expense.findById(expense_id).populate('paid_by');
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    const paymentData = {
      expense_id,
      payer_id,
      group_id: expense.group,
      creditor_id: expense.paid_by[0]._id, // Assuming first payor as creditor
      amount,
      payment_method,
      confirmation_code: confirmation_code || null,
      payment_status: 'confirmed'
    };

    if (req.file) {
      paymentData.proof_file = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
    }

    const newPayment = new Payment(paymentData);
    await newPayment.save();

    // Create transaction history for the payment
    try {
      await TransactionHistory.createFromPayment(newPayment, req.user._id);
      console.log('Transaction history created for payment:', newPayment._id);
    } catch (historyError) {
      console.error('Failed to create transaction history for payment:', historyError.message);
    }

    const { updated, remaining } = await applyPayment(payer_id, expense.group._id || expense.group, amount);

    res.status(201).json({
      message: 'Payment created and balances updated',
      payment: newPayment,
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to create payment', details: err.message });
  }
});

// SETTLE debt without specific expense
router.post('/settle-debt', authMiddleware, upload.single('proof'), async (req, res) => {
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

    // Get original debt amount for settlement tracking
    const originalBalance = await Balance.findOne({
      group_id: group_id,
      user_id: payer_id,
      owed_to: creditor._id
    });

    const originalDebt = originalBalance ? originalBalance.amount : 0;

    const paymentData = {
      payer_id,
      creditor_id: creditor._id,
      group_id,
      amount: parseFloat(amount),
      payment_method,
      confirmation_code: confirmation_code || null,
      payment_status: 'confirmed'
    };

    if (req.file) {
      paymentData.proof_file = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      };
    }

    const newPayment = new Payment(paymentData);
    await newPayment.save();

    // Update balance
    await Balance.findOneAndUpdate(
      {
        group_id: group_id,
        user_id: payer_id,
        owed_to: creditor._id
      },
      { $inc: { amount: -parseFloat(amount) } },
      { new: true }
    );

    // Create transaction history for the settlement
    try {
      // Create a custom transaction with settlement details
      const transactionData = {
        transaction_type: 'settlement',
        source_id: newPayment._id,
        source_model: 'Payment',
        group_id: group_id,
        amount: parseFloat(amount),
        currency: 'PHP',
        payer_id: payer_id,
        recipient_id: creditor._id,
        description: `Debt settlement to ${creditor.name}`,
        payment_method: payment_method,
        status: 'confirmed',
        transaction_date: new Date(),
        created_by: req.user._id,
        metadata: {
          settlement_details: {
            original_debt: originalDebt,
            remaining_debt: Math.max(0, originalDebt - parseFloat(amount)),
            settlement_percentage: originalDebt > 0 ? (parseFloat(amount) / originalDebt * 100) : 100
          }
        }
      };

      // Add payment-specific metadata
      if (confirmation_code) {
        transactionData.metadata.confirmation_code = confirmation_code;
      }
      
      if (newPayment.proof_file) {
        transactionData.metadata.proof_file = newPayment.proof_file;
      }

      const transaction = new TransactionHistory(transactionData);
      await transaction.save();
      
      console.log('Transaction history created for settlement:', newPayment._id);
    } catch (historyError) {
      console.error('Failed to create transaction history for settlement:', historyError.message);
      // Continue with settlement processing even if history fails
    }

    res.status(201).json({
      message: 'Debt settlement processed successfully',
      payment: newPayment
    });
  } catch (err) {
    console.error('Error settling debt:', err);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to settle debt', details: err.message });
  }
});

// GET payment proof file
router.get('/proof/:paymentId', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.payer_id.toString() !== req.user._id.toString() && 
        payment.creditor_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!payment.proof_file || !payment.proof_file.path) {
      return res.status(404).json({ error: 'No proof file found' });
    }

    const filePath = payment.proof_file.path;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.setHeader('Content-Type', payment.proof_file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${payment.proof_file.originalname}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (err) {
    console.error('Error retrieving proof file:', err);
    res.status(500).json({ error: 'Failed to retrieve proof file', details: err.message });
  }
});

// GET all payments (with pagination)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({
      $or: [
        { payer_id: req.user._id },
        { creditor_id: req.user._id }
      ]
    })
    .populate('payer_id', 'name email')
    .populate('creditor_id', 'name email')
    .populate('group_id', 'name')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Payment.countDocuments({
      $or: [
        { payer_id: req.user._id },
        { creditor_id: req.user._id }
      ]
    });

    res.json({
      payments,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments', details: err.message });
  }
});

// DELETE payment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.payer_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (payment.payment_status !== 'pending') {
      return res.status(400).json({ error: 'Can only delete pending payments' });
    }

    // Update related transaction history to cancelled status
    try {
      await TransactionHistory.updateMany(
        { source_id: req.params.id, source_model: 'Payment' },
        { 
          status: 'cancelled',
          updated_at: new Date(),
          updated_by: req.user._id
        }
      );
      console.log('Transaction history updated to cancelled for payment:', req.params.id);
    } catch (historyError) {
      console.error('Failed to update transaction history for deleted payment:', historyError.message);
    }

    if (payment.proof_file && payment.proof_file.path && fs.existsSync(payment.proof_file.path)) {
      fs.unlinkSync(payment.proof_file.path);
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Payment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payment', details: err.message });
  }
});

module.exports = router;