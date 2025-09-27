// ========= IMPORTS & INSTALLATION ==========
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 3001;
const app = express();

// ========= MIDDLEWARE ===========
app.use(cors());
app.use(express.json());

// ========= VUE.JS INTEGRATION =========
app.use(express.static(path.join(__dirname, 'dist')));

// ========= DATABASE CONNECTION ========
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI)
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('Error connecting to MongoDB:',err));

// ================== ROUTES ===================
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users')
const groupRoutes = require('./routes/groups')
const expenseRoutes = require('./routes/expense')
const balanceRoutes = require('./routes/balance');
const paymentRoutes = require('./routes/payment')

// ================== MOUNT ROUTERS ===================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/payments', paymentRoutes);

app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));