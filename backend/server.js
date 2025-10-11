// ========= IMPORTS & INSTALLATION ==========
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3001;
const app = express();

// ========= MIDDLEWARE ===========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========= CREATE UPLOAD DIRECTORIES =========
const uploadsDir = path.join(__dirname, 'uploads');
const paymentProofsDir = path.join(__dirname, 'uploads', 'payment_proofs');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(paymentProofsDir)) {
  fs.mkdirSync(paymentProofsDir, { recursive: true });
}

// ========= STATIC FILE SERVING =========
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========= VUE.JS INTEGRATION =========
app.use(express.static(path.join(__dirname, 'dist')));

// ========= DATABASE CONNECTION ========
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI)
  .then(() => console.log('MongoDB successfully connected'))
  .catch(err => console.error('Error connecting to MongoDB:',err));

// ================== ROUTES ===================
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expense');
const balanceRoutes = require('./routes/balance');
const paymentRoutes = require('./routes/payment');
const reportRoutes = require('./routes/report');
const transactionRoutes = require('./routes/transaction');
const searchRoutes = require('./routes/search');

// ================== MOUNT ROUTERS ===================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/search', searchRoutes);

// ================== ERROR HANDLING MIDDLEWARE ===================
app.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'File size must be less than 5MB'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file',
      message: 'Only one file is allowed'
    });
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'Only JPG, PNG, PDF, and DOC files are allowed'
    });
  }
  
  next(error);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));