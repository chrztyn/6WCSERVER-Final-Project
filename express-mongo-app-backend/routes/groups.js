const express = require('express');
const authMiddleware = require('../middleware/auth');
const Users = require('../models/users'); 
const Groups = require('../models/groups');
const router = express.Router();

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

    group.members = group.members.filter(
      (memberId) => memberId.toString() !== req.user._id
    );
    await group.save();

        await Users.findByIdAndUpdate(req.user._id, {
      $pull: { joined_groups: group._id }
    });

    res.json({ message: 'Left group successfully' });
  }catch (err) {
    res.status(500).send('Server error: ' + err.message);
  }
});

module.exports = router;