const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    group_id: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Group' 
    },
    total_amount : {
        type: Number,
        required: true
    },
    payer_id: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now
    },
    category: String,
    description: String,
    shared_by: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }],
    paid: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Expense', expenseSchema);

