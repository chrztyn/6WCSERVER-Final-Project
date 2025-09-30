const express = require('express');
const authMiddleware = require('../middleware/auth');
const Users = require('../models/users'); 
const Groups = require('../models/groups');
const Balance = require('../models/balance');
const router = express.Router();
const Expense = require('../models/expense');

//  CREATE a group 
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, members, description } = req.body;

    const creator = await Users.findById(req.user);
    if (!creator) return res.status(404).json({ error: "Creator not found" });

    const groupMembers = await Users.find({ email: { $in: members } });

    const memberIds = [...new Set([
      creator._id.toString(),
      ...groupMembers.map(u => u._id.toString())
    ])];

    const group = new Groups({
      name,
      created_by: creator._id,
      members: memberIds,
      description
    });

    const savedGroup = await group.save(); 

    // Update each user's joined_groups array with the new structure
    await Users.updateMany(
      { _id: { $in: memberIds } },
      { $addToSet: { 
          joined_groups: {
            group_id: savedGroup._id,
            group_name: savedGroup.name,
            joined_at: new Date()
          }
        }}
    );

    const populatedGroup = await savedGroup.populate([
      { path: 'created_by', select: 'name email -_id' },
      { path: 'members', select: 'name email -_id' }
    ]);
    res.status(201).json(populatedGroup);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VIEW the group the user joined
router.get('/my', authMiddleware, async (req, res) => {
  try{
    const groups = await Groups.find({members: req.user._id})
      .populate([
        {path: 'members', select: 'name email -_id'},
        {path: 'created_by',select: 'name email -_id'}
      ]);

      res.json(groups);
  }catch (err) {
    res.status(500).send('Server error' + err.message);
  }
});

// CHECK if user can leave group (validation endpoint)
router.get('/:id/can-leave', authMiddleware, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    // Check if group exists
    const group = await Groups.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(
      memberId => memberId.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Check user's balances in this group
    const userBalances = await Balance.find({
      group_id: groupId,
      $or: [
        { user_id: userId },
        { owed_to: userId }
      ],
      status: 'unpaid'
    });

    // Calculate total debt (what user owes)
    let totalDebt = 0;
    let totalOwed = 0;
    const debtsDetails = [];
    const owedDetails = [];

    for (const balance of userBalances) {
      // Skip balances less than 0.01 (treat as paid)
      if (balance.amount < 0.01) {
        continue;
      }

      if (balance.user_id.toString() === userId.toString()) {
        // User owes this amount
        totalDebt += balance.amount;
        const owedToUser = await Users.findById(balance.owed_to).select('name email');
        debtsDetails.push({
          amount: balance.amount,
          owedTo: owedToUser ? owedToUser.name : 'Unknown',
          owedToEmail: owedToUser ? owedToUser.email : 'Unknown'
        });
      } else if (balance.owed_to.toString() === userId.toString()) {
        // Someone owes user this amount
        totalOwed += balance.amount;
        const debtor = await Users.findById(balance.user_id).select('name email');
        owedDetails.push({
          amount: balance.amount,
          from: debtor ? debtor.name : 'Unknown',
          fromEmail: debtor ? debtor.email : 'Unknown'
        });
      }
    }

    const canLeave = totalDebt < 0.01;
    const hasOutstandingOwed = totalOwed >= 0.01;

    res.json({
      canLeave,
      totalDebt,
      totalOwed,
      debtsDetails,
      owedDetails,
      message: canLeave 
        ? (hasOutstandingOwed 
            ? 'You can leave, but others still owe you money. Consider settling first.'
            : 'You can leave this group.')
        : 'You cannot leave this group until you settle your debts.'
    });

  } catch (err) {
    console.error('Error checking leave eligibility:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET group balances for all members
router.get('/:id/balances', authMiddleware, async (req, res) => {
  try {
    const groupId = req.params.id;

    // Check if group exists and user is a member
    const group = await Groups.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const isMember = group.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all unpaid balances for this group
    const balances = await Balance.find({
      group_id: groupId,
      status: 'unpaid'
    }).populate('user_id owed_to', 'name email');

    // Calculate net balance for each member
    const memberBalances = {};
    
    // Initialize all members with 0 balance
    group.members.forEach(memberId => {
      memberBalances[memberId.toString()] = 0;
    });

    // Calculate balances
    balances.forEach(balance => {
      const userId = balance.user_id._id.toString();
      const owedToId = balance.owed_to._id.toString();
      
      // User owes money (negative balance)
      memberBalances[userId] -= balance.amount;
      // OwedTo is owed money (positive balance)
      memberBalances[owedToId] += balance.amount;
    });

    // Format response
    const result = Object.entries(memberBalances).map(([userId, balance]) => ({
      user_id: userId,
      balance: balance,
      status: balance < 0 ? 'owes' : balance > 0 ? 'owed' : 'settled'
    }));

    res.json(result);

  } catch (err) {
    console.error('Error fetching group balances:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// DELETE / LEAVE group
router.delete('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id;

    const group = await Groups.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user has any unpaid debts in this group (over 0.01)
    const unpaidDebts = await Balance.find({
      group_id: groupId,
      user_id: userId,
      status: 'unpaid',
      amount: { $gte: 0.01 } // Only consider debts >= 0.01
    });

    if (unpaidDebts.length > 0) {
      const totalDebt = unpaidDebts.reduce((sum, debt) => sum + debt.amount, 0);
      return res.status(400).json({ 
        error: 'Cannot leave group with outstanding debts',
        totalDebt: totalDebt,
        message: `You owe ₱${totalDebt.toFixed(2)} in this group. Please settle your debts before leaving.`
      });
    }

    // Check if others owe this user (optional warning)
    const unpaidOwed = await Balance.find({
      group_id: groupId,
      owed_to: userId,
      status: 'unpaid',
      amount: { $gte: 0.01 } // Only consider amounts >= 0.01
    });

    // Remove user from group's members array
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userId.toString()
    );
    await group.save();

    // Remove group from user's joined_groups array by group_id
    await Users.findByIdAndUpdate(userId, {
      $pull: { joined_groups: { group_id: group._id } }
    });

    const response = { 
      message: 'Left group successfully'
    };

    if (unpaidOwed.length > 0) {
      const totalOwed = unpaidOwed.reduce((sum, owed) => sum + owed.amount, 0);
      response.warning = `Note: Group members still owe you ₱${totalOwed.toFixed(2)}`;
    }

    res.json(response);

  } catch (err) {
    console.error('Error leaving group:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// ADD MEMBER
router.post('/:id/add-members', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { members } = req.body;

        const group = await Groups.findById(id);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Find the users to be added from the provided emails
        const usersToAdd = await Users.find({ email: { $in: members } });
        const newMemberIds = usersToAdd.map(u => u._id.toString());
        const existingMemberIds = group.members.map(m => m.toString());

        const addedMemberIds = [];
        const notFoundEmails = [];

        // Add valid, new users to the group
        for (const user of usersToAdd) {
            if (!existingMemberIds.includes(user._id.toString())) {
                group.members.push(user._id);
                addedMemberIds.push(user._id);
            }
        }

        // Update each added user's joined_groups array
        if (addedMemberIds.length > 0) {
            await Users.updateMany(
                { _id: { $in: addedMemberIds } },
                {
                    $addToSet: {
                        joined_groups: {
                            group_id: group._id,
                            group_name: group.name,
                            joined_at: new Date()
                        }
                    }
                }
            );
        }

        // Save the updated group document
        await group.save();

        const addedUsers = await Users.find({ _id: { $in: addedMemberIds } }).select('name email');
        
        res.status(200).json({
            message: 'Members added successfully',
            addedUsers: addedUsers,
            membersNotFound: notFoundEmails
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// GET single group by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Groups.findById(req.params.id)
      .populate([
        { path: 'members', select: 'name email -_id' },
        { path: 'created_by', select: 'name email -_id' }
      ]);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is a member of this group
    const isMember = group.members.some(member => 
      member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET groups with expense summary
router.get('/my/summary', authMiddleware, async (req, res) => {
  try {
    const groups = await Groups.find({ members: req.user._id })
      .populate([
        { path: 'members', select: 'name email -_id' },
        { path: 'created_by', select: 'name email -_id' }
      ]);

    const groupsWithSummary = await Promise.all(
      groups.map(async (group) => {
        const totalExpensesResult = await Expense.aggregate([
          { $match: { group: group._id } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        
        // Check if a result was returned and extract the total
        const total = totalExpensesResult.length > 0 ? totalExpensesResult[0].total : 0;
        
        return {
          ...group.toObject(),
          totalExpenses: total
        };
      })
    );

    res.json(groupsWithSummary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET groups notifcation
router.get('/notification/:groupId', authMiddleware, async (req, res) => {
  try {
    const group = await Groups.findById(req.params.groupId)
      .populate([
        { path: 'members', select: 'name email -_id' },
        { path: 'created_by', select: 'name email -_id' }
      ]);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Ensure user belongs to the group
    const isMember = group.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Access denied. Not a member of this group.' });
    }

    res.json({ message: 'Notification resolved', group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;