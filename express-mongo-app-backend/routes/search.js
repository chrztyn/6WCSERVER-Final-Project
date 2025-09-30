const express = require('express');
const authMiddleware = require('../middleware/auth');
const Users = require('../models/users');
const Groups = require('../models/groups');
const Expense = require('../models/expense');
const TransactionHistory = require('../models/transaction');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.json([]);
    }

    const searchRegex = new RegExp(q, 'i'); 

    // Find groups the user is a member of that match the search
    const groups = await Groups.find({
      name: searchRegex,
      members: req.user._id
    }).select('_id name description');

    const groupIds = groups.map(g => g._id);

    // Find expenses in those groups
    const expenses = await Expense.find({
      description: searchRegex,
      group: { $in: groupIds } 
    }).select('_id description amount group');

    // Find users in the same groups
    const users = await Users.find({
      name: searchRegex,
      _id: { $ne: req.user._id },
      'joined_groups.group_id': { $in: groupIds }
    }).select('_id name email');

    // Find transactions
    const transactions = await TransactionHistory.find({
      description: searchRegex,
      $or: [
        { payer_id: req.user._id },
        { receiver_id: req.user._id }
      ]
    })
    .select('_id description amount transaction_type group_id')
    .populate('group_id', 'name')
    .limit(10);

    const results = [
      ...groups.map(g => ({
        type: 'group',
        _id: g._id,
        name: g.name,
        description: g.description
      })),
      ...expenses.map(e => ({
        type: 'expense',
        _id: e._id,
        name: e.description,
        amount: e.amount,
        group: e.group
      })),
      ...users.map(u => ({
        type: 'user',
        _id: u._id,
        name: u.name,
        email: u.email
      })),
      ...transactions.map(t => ({
        type: 'transaction',
        _id: t._id,
        name: t.description,
        amount: t.amount,
        transaction_type: t.transaction_type,
        group_name: t.group_id?.name
      }))
    ];

    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

module.exports = router;