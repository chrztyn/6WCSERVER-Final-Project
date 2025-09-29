const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  expense_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Expense',
    required: false
  },
  group_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Group',
    required: true
  },
  payer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  creditor_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  payment_method: {
    type: String,
    enum: ['Cash','GCash','Bank'],
    required: true
  },
  confirmation_code: String,
  proof_file: {
    filename: String,
    originalname: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  payment_status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'failed'], 
    default: 'pending' 
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.pre('save', function(next) {
  if ((this.payment_method === 'GCash' || this.payment_method === 'Bank') && !this.confirmation_code) {
    return next(new Error('Confirmation code is required for GCash or Bank payments'));
  }
  
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);