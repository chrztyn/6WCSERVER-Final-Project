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
  payment_method: String,
  confirmation_code: String,
  payment_status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'failed'], 
    default: 'pending' }
});

module.exports = mongoose.model('Payment', paymentSchema);
