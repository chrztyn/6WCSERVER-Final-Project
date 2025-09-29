const express = require('express');
const authMiddleware = require('../middleware/auth');
const TransactionHistory = require('../models/transaction');
const router = express.Router();

// GET recent transactions (for notifications)
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.user._id;

    const transactions = await TransactionHistory.find({
      $or: [
        { payer_id: userId },
        { receiver_id: userId },
        { created_by: userId }
      ],
      status: { $ne: 'cancelled' }
    })
      .populate('payer_id', 'name email')
      .populate('receiver_id', 'name email')
      .populate('group_id', 'name')
      .sort({ transaction_date: -1, created_at: -1 })
      .limit(limit);

    res.json({ transactions });
  } catch (err) {
    console.error('Error fetching recent transactions:', err);
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

// GET all transactions with pagination and filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = {
      $or: [
        { payer_id: req.user._id },
        { receiver_id: req.user._id },
        { created_by: req.user._id }
      ]
    };

    if (req.query.group_id) {
      filter.group_id = req.query.group_id;
    }

    if (req.query.transaction_type) {
      filter.transaction_type = req.query.transaction_type;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.start_date || req.query.end_date) {
      filter.transaction_date = {};
      if (req.query.start_date) {
        filter.transaction_date.$gte = new Date(req.query.start_date);
      }
      if (req.query.end_date) {
        filter.transaction_date.$lte = new Date(req.query.end_date);
      }
    }

    const transactions = await TransactionHistory.find(filter)
      .populate('payer_id', 'name email')
      .populate('receiver_id', 'name email')
      .populate('group_id', 'name')
      .populate('created_by', 'name email')
      .sort({ transaction_date: -1, created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TransactionHistory.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
  }
});

// GET transaction by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const transaction = await TransactionHistory.findById(req.params.id)
      .populate('payer_id', 'name email')
      .populate('receiver_id', 'name email')
      .populate('group_id', 'name description')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user has access to this transaction
    const userId = req.user._id.toString();
    const hasAccess = 
      transaction.payer_id?._id.toString() === userId ||
      transaction.receiver_id?._id.toString() === userId ||
      transaction.created_by?._id.toString() === userId;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(transaction);
  } catch (err) {
    console.error('Error fetching transaction:', err);
    res.status(500).json({ error: 'Failed to fetch transaction', details: err.message });
  }
});

// GET transaction statistics/summary
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const filter = {
      $or: [
        { payer_id: userId },
        { receiver_id: userId }
      ],
      status: 'confirmed'
    };

    // Add date range if provided
    if (req.query.start_date || req.query.end_date) {
      filter.transaction_date = {};
      if (req.query.start_date) {
        filter.transaction_date.$gte = new Date(req.query.start_date);
      }
      if (req.query.end_date) {
        filter.transaction_date.$lte = new Date(req.query.end_date);
      }
    }

    // Total spent (expenses you paid)
    const totalSpent = await TransactionHistory.aggregate([
      {
        $match: {
          payer_id: userId,
          transaction_type: 'expense',
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Total received (payments to you)
    const totalReceived = await TransactionHistory.aggregate([
      {
        $match: {
          receiver_id: userId,
          transaction_type: { $in: ['payment', 'settlement'] },
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Total paid (payments you made)
    const totalPaid = await TransactionHistory.aggregate([
      {
        $match: {
          payer_id: userId,
          transaction_type: { $in: ['payment', 'settlement'] },
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Transactions by type
    const byType = await TransactionHistory.aggregate([
      {
        $match: filter
      },
      {
        $group: {
          _id: '$transaction_type',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      summary: {
        total_spent: totalSpent[0]?.total || 0,
        total_received: totalReceived[0]?.total || 0,
        total_paid: totalPaid[0]?.total || 0,
        net_balance: (totalReceived[0]?.total || 0) - (totalPaid[0]?.total || 0)
      },
      by_type: byType
    });
  } catch (err) {
    console.error('Error fetching transaction stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics', details: err.message });
  }
});

// GET transactions by group
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = await TransactionHistory.find({
      group_id: groupId,
      $or: [
        { payer_id: req.user._id },
        { receiver_id: req.user._id },
        { created_by: req.user._id }
      ]
    })
      .populate('payer_id', 'name email')
      .populate('receiver_id', 'name email')
      .populate('created_by', 'name email')
      .sort({ transaction_date: -1, created_at: -1 })
      .skip(skip)
      .limit(limit);

    const total = await TransactionHistory.countDocuments({
      group_id: groupId,
      $or: [
        { payer_id: req.user._id },
        { receiver_id: req.user._id },
        { created_by: req.user._id }
      ]
    });

    res.json({
      transactions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (err) {
    console.error('Error fetching group transactions:', err);
    res.status(500).json({ error: 'Failed to fetch group transactions', details: err.message });
  }
});

module.exports = router;