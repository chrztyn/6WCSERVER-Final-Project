const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
       name: {
        type: String,
        required: true,
        trim: true
    }, 
    created_by:{
        type: mongoose.Schema.Types.ObjectId, ref: 'User' 
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    description: String
})

module.exports = mongoose.model('Group', groupSchema);
