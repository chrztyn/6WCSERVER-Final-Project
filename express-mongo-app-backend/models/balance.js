const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
  group_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'Group' 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
  },
  owed_to: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required: false
  },
  amount: { 
    type: Number, 
    required: true,
    default: 0
  },
  status: { 
    type: String, 
    enum: ['unpaid', 'paid'], default: 'unpaid' 
  }
});

module.exports = mongoose.model('Balance', balanceSchema);

