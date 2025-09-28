const express = require('express');
const authMiddleware = require('../middleware/auth');
const Balance = require('../models/balance');
const Groups = require('../models/groups');
const Expense = require('../models/expense');
const Payment = require('../models/payment');
const Users = require('../models/users');
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
router.get('/detailed', authMiddleware, async (req, res) =>{
    try{
        const userId = req.user._id.toString();

        const balanceDebt = await Balance.find({user_id: userId}).populate([
            {path: 'owed_to', select: 'name email -_id'},
            {path: 'group_id', select: 'name -_id'}
        ]);

        const balanceCredit = await Balance.find({owed_to: userId}).populate([
            {path: 'user_id', select: 'name email -_id'},
            {path: 'group_id', select: 'name -_id'}
        ]);

        const youOwe = balanceDebt.filter(a => a.amount > 0)
        .map(a => ({
            title: a.group_id ? a.group_id.name : 'Unkown',
            to: a.owed_to ? a.owed_to.name : 'Unkown',
            amount: a.amount,
            status: a.status || 'to pay'
        }));

        const owesYou = balanceCredit.filter(a => a.amount > 0)
        .map(a => ({
            title: a.group_id ? a.group_id.name : 'Unkown',
            from: a.user_id ? a.user_id.name : 'Unkown',
            amount: a.amount,
            status: a.status || 'pending'
        }));

        res.json({
            detailed:{
                youOwe,
                owesYou
            }
        });
    } catch (err){
            res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// VIEW recent activities
router.get('/activities', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const limit = parseInt(req.query.limit) || 10; // Default 10 activities
        
        const activities = [];
        
        // 1. Get recent expenses the user was involved in (added expenses)
        const recentExpenses = await Expense.find({
            $or: [
                { paid_by: userId },
                { group: { $in: await Groups.find({ members: userId }).distinct('_id') } }
            ]
        })
        .populate('paid_by', 'name')
        .populate('group', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);

        recentExpenses.forEach(expense => {
            const isPayer = expense.paid_by.some(payer => payer._id.toString() === userId);
            activities.push({
                type: 'expense_added',
                title: isPayer ? 'Added Expense' : 'Expense Added',
                description: expense.description,
                group: expense.group?.name || 'Unknown Group',
                amount: expense.amount,
                timestamp: expense.createdAt || expense.date,
                color: 'red'
            });
        });

        // 2. Get recent payments (settled debts)
        const recentPayments = await Payment.find({ payer_id: userId })
            .populate({
                path: 'expense_id',
                populate: {
                    path: 'group',
                    select: 'name'
                }
            })
            .sort({ createdAt: -1 })
            .limit(limit);

        recentPayments.forEach(payment => {
            activities.push({
                type: 'settlement',
                title: 'Marked Settlement',
                description: `Payment of ${payment.amount}`,
                group: payment.expense_id?.group?.name || 'Unknown Group',
                amount: payment.amount,
                timestamp: payment.createdAt,
                color: 'green'
            });
        });

        // 3. Get recent groups joined (from user's joined_groups array)
        const user = await Users.findById(userId).select('joined_groups');
        if (user && user.joined_groups) {
            user.joined_groups
                .sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at))
                .slice(0, 5) // Limit to 5 recent groups
                .forEach(groupInfo => {
                    activities.push({
                        type: 'group_joined',
                        title: 'Joined Group',
                        description: groupInfo.group_name,
                        group: groupInfo.group_name,
                        timestamp: groupInfo.joined_at,
                        color: 'blue'
                    });
                });
        }

        // 4. Get groups created by user
        const createdGroups = await Groups.find({ created_by: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name createdAt');

        createdGroups.forEach(group => {
            activities.push({
                type: 'group_created',
                title: 'Created Group',
                description: group.name,
                group: group.name,
                timestamp: group.createdAt,
                color: 'purple'
            });
        });

        // Sort all activities by timestamp and limit
        const sortedActivities = activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit)
            .map(activity => ({
                ...activity,
                timeAgo: getTimeAgo(activity.timestamp)
            }));

        res.json({
            activities: sortedActivities
        });

    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

// Helper function for time ago calculation
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now - past;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
        return diffInMinutes <= 1 ? 'just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
        return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else if (diffInDays < 7) {
        return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    } else {
        return past.toLocaleDateString();
    }
};

module.exports = router;