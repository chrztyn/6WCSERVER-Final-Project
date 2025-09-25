const mongoose = require('mongoose');

const transactionHistorySchema = new mongoose.Schema({
  transaction_type: { 
    type: String, 
    enum: ['expense', 'payment', 'settlement'], 
    required: true 
},
  payer_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
},
  receiver_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
},
  amount: { 
    type: Number, 
    required: true 
},
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
},
  payment_method: String,
  related_expense_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'Expense' 
}
}, { collection: 'transaction_history' });

module.exports = mongoose.model('TransactionHistory', transactionHistorySchema, 'transaction_history');
