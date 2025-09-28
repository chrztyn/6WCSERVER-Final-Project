const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  expense_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'Expense' 
},
  payer_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
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
  payment_status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'failed'], 
    default: 'pending' }
});

paymentSchema.pre('save', function(next) {
  if ((this.payment_method === 'Gcash' || this.payment_method === 'Bank') && !this.confirmation_code) {
    return next(new Error('Confirmation code is required for Gcash or Bank payments'));
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
