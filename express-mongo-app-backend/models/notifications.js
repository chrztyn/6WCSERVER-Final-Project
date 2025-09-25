const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
},
  message: { 
    type: String, 
    required: true 
},
  notification_type: { 
    type: String, 
    enum: ['info', 'warning', 'payment', 'reminder'], 
    default: 'info' 
}
});

module.exports = mongoose.model('Notification', notificationSchema);
