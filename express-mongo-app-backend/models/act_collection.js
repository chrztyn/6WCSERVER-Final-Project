const mongoose = require('mongoose');

const actCollectionSchema = new mongoose.Schema({
  group_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'Group' 
},
  activity_name: { 
    type: String,
    required: true }
    ,
  total_amount: { 
    type: Number, 
    required: true 
},
  contributors: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number
  }],
  paid_amount: { 
    type: Number, 
    default: 0 
},
  status: { 
    type: String, 
    enum: ['open', 'closed'], 
    default: 'open' }
});

module.exports = mongoose.model('ActivityCollection', actCollectionSchema);
