const express = require('express');
const authMiddleware = require('../middleware/auth');
const Balance = require('../models/balance');
const Groups = require('../models/groups');
const Expense = require('../models/expense');
const Payment = require('../models/payment');
const Users = require('../models/users');
const TransactionHistory = require('../models/transaction');
const router = express.Router();

// VIEW overview
router.get('/overview', authMiddleware, async (req, res) => {
    try{
        const userId = req.user._id.toString();
        const balanceDebt = await Balance.find({user_id: userId}).populate('owed_to','name email');
        const youOwe = balanceDebt.filter(a => a.amount > 0)
        .map(a => ({
            name: a.owed_to ? a.owed_to.name : 'Unknown',
            amount: a.amount,
            status: a.status || 'to pay'
        }));

        res.json({
            overView:{
                youOwe
            }
        });
    } catch (err){
            res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// VIEW detailed report
router.get('/detailed', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const balanceDebt = await Balance.find({ user_id: userId }).populate([
            { path: 'owed_to', select: 'name email -_id' },
            { path: 'group_id', select: 'name -_id' }
        ]);

        const balanceCredit = await Balance.find({ owed_to: userId }).populate([
            { path: 'user_id', select: 'name email -_id' },
            { path: 'group_id', select: 'name -_id' }
        ]);

        const getStatus = (amount, currentStatus) => {
            return amount <= 0.01 ? 'paid' : (currentStatus || 'pending');
        };

        const youOwe = balanceDebt
            .filter(a => a.amount > 0)
            .map(a => ({
                title: a.group_id ? a.group_id.name : 'Unknown',
                to: a.owed_to ? a.owed_to.name : 'Unknown',
                amount: a.amount,
                status: getStatus(a.amount, 'to pay')
            }));

        const owesYou = balanceCredit
            .filter(a => a.amount > 0)
            .map(a => ({
                title: a.group_id ? a.group_id.name : 'Unknown',
                from: a.user_id ? a.user_id.name : 'Unknown',
                amount: a.amount,
                status: getStatus(a.amount, 'pending')
            }));

        res.json({
            detailed: {
                youOwe,
                owesYou
            }
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;