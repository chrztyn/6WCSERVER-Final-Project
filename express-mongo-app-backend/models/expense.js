const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  paid_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be positive']
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  }
}, { 
  collection: 'expenses',
  timestamps: true 
});

expenseSchema.index({ group: 1, date: -1 });
expenseSchema.index({ 'paid_by': 1 });

module.exports = mongoose.model('Expense', expenseSchema);