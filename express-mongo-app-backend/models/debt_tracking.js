const mongoose = require('mongoose');

const debtTrackingSchema = new mongoose.Schema({
  group_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'Group' 
},
  debtor_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
},
  creditor_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
},
  amount: { 
    type: Number, required: true 
},
  status: { 
    type: String, 
    enum: ['unpaid', 'paid'], 
    default: 'unpaid' }
}, { collection: 'debt_tracking' });

module.exports = mongoose.model('DebtTracking', debtTrackingSchema, 'debt_tracking');
