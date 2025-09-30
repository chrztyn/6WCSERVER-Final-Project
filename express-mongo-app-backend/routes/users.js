const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const Users = require('../models/users'); 
const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profiles';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ================== USERS ===================
// VIEW the user infos using JWT so that its secured
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await Users.findById(req.user._id).select('-password_hash');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// EDIT user infos (including profile picture)
router.put('/profile', authMiddleware, upload.single('profile_picture'), async (req, res) => {
  try {
    const user = await Users.findById(req.user._id);
    if (!user) return res.status(404).json({msg: "User not found"});

    const { name, phone_number, payment_methods } = req.body;

    if (name) user.name = name;
    if (phone_number) user.phone_number = phone_number;
    if (payment_methods) {
      try {
        user.payment_methods = JSON.parse(payment_methods);
      } catch (e) {
        user.payment_methods = payment_methods;
      }
    }

    // Handle profile picture upload
    if (req.file) {
      // Delete old profile picture if it exists
      if (user.profile_picture) {
        const oldPath = path.join(__dirname, '..', user.profile_picture);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      user.profile_picture = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();

    res.json({
      message: 'Information updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        profile_picture: user.profile_picture,
        joined_groups: user.joined_groups,
        payment_methods: user.payment_methods
      }
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// DELETE profile picture
router.delete('/profile/picture', authMiddleware, async (req, res) => {
  try {
    const user = await Users.findById(req.user._id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Delete the file from server
    if (user.profile_picture) {
      const filePath = path.join(__dirname, '..', user.profile_picture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      user.profile_picture = null;
      await user.save();
    }

    res.json({ 
      message: 'Profile picture removed successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        profile_picture: user.profile_picture
      }
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// UPLOAD QR Code for payment methods
router.post('/upload-qr', authMiddleware, upload.single('qr_code'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const qrCodeUrl = `/uploads/profiles/${req.file.filename}`;
    
    res.json({ 
      message: 'QR code uploaded successfully',
      qr_code_url: qrCodeUrl
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET UPLOADED QR Code for payment methods
router.get('/:userId/payment-methods', authMiddleware, async (req, res) => {
  try {
    const user = await Users.findById(req.params.userId).select('payment_methods');
    res.json({ payment_methods: user.payment_methods || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;