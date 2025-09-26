const express = require('express');
const authMiddleware = require('../middleware/auth');
const Users = require('../models/users'); 
const router = express.Router();


// ================== USERS ===================
// VIEW the user infos using JWT so that its secured
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await Users.findById(req.user._id).select('-password_hash -_id');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

//EDIT user infos
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await Users.findById(req.user._id);
    if (!user) return res.status(404).json({msg: "User not found"});

    const{name, phone_number,payment_methods} = req.body;

    if (name) user.name = name;
    if (phone_number) user.phone_number = phone_number;
    if (payment_methods) user.payment_methods = payment_methods;

    await user.save();

    res.json({
      message: 'Information updated successfully',
      user: {
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        joined_groups: user.joined_groups,
        payment_methods: user.payment_methods
      }
    });
  } catch (err) {
    res.status(500).send('Server error: ' + err.message);
  }
});

module.exports = router;