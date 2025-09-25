// IMPORTS & INSTALLATION 
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');

const Users = require('./models/users');
const Groups = require('./models/groups');
const Expense = require('./models/expense');
const Balance = require('./models/balance');
const Payment = require('./models/payment');
const Budget = require('./models/budget');
const ActivityCollection = require('./models/act_collection');
const DebtTracking = require('./models/debt_tracking');
const TransactionHistory = require('./models/transaction_history')
const Notification = require('./models/notifications');

const PORT = process.env.PORT || 3001;
const app = express();

// MIDDLEWARE 
app.use(cors());
app.use(express.json());

// VUE.JS INTEGRATION
app.use(express.static(path.join(__dirname, 'dist')));

// DATABASE CONNECTION
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI)
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('Error connecting to MongoDB:',err));

const apiRouter = express.Router();

// ================== USERS ===================
// VIEW the user infos using JWT so that its secured
apiRouter.get('/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = await Users.findById(req.user).select('-password_hash');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

//EDIT user infos


// ================== GROUPS ===================
// CREATE a group 
apiRouter.post('/groups', authMiddleware, async (req, res) => {
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
      { path: 'created_by', select: 'name email' },
      { path: 'members', select: 'name email' }
    ]);
    res.status(201).json(populatedGroup);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.use('/api', apiRouter);
app.use('/api/auth', authRoutes);
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));

