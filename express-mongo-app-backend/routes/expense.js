const express = require('express');
const authMiddleware = require('../middleware/auth');
const Users = require('../models/users'); 
const Groups = require('../models/groups');
const Expense = require('../models/expense');
const router = express.Router();

// ADD expense to a group
router.post('/:groupId', authMiddleware, async (req, res) => {
    try{
        const {groupId} = req.params;
        const {description, amount, paid_by, date, status } = req.body;
        const group = await Groups.findById(groupId);
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
            status : status || 'pending'
        });

        await expense.save();
        const populatedExpense = await expense.populate([
            { path: 'paid_by', select: 'name email -_id' },
            { path: 'group', select: 'name description -_id' }
        ]);

        res.status(201).json({
            message: 'Expense added successfully',
            expense: populatedExpense
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
});

module.exports = router;