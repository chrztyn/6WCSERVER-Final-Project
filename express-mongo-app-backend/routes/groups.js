const express = require('express');
const authMiddleware = require('../middleware/auth');
const Users = require('../models/users'); 
const Groups = require('../models/groups');
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

// DELETE / LEAVE group
router.delete('/:id/leave', authMiddleware, async (req, res) => {
  try{
    const group = await Groups.findById(req.params.id);
    if (!group) return res.status(404).json({msg: 'Group not found'});

    // Remove user from group's members array
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );
    await group.save();

    // Remove group from user's joined_groups array by group_id
    await Users.findByIdAndUpdate(req.user._id, {
      $pull: { joined_groups: { group_id: group._id } }
    });

    res.json({ message: 'Left group successfully' });
  }catch (err) {
    res.status(500).send('Server error: ' + err.message);
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

module.exports = router;