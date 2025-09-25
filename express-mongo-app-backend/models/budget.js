const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  group_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'Group' 
},
  total_budget: { 
    type: Number, 
    required: true 
},
  contributors: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number
  }],
  treasurer_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
},
  budget_status: { 
    type: String, 
    enum: ['open', 'closed'], 
    default: 'open' }
});

module.exports = mongoose.model('Budget', budgetSchema);
