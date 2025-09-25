const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }, 
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password_hash: {
        type: String,
        required: true,
    },
    phone_number: {
        type: String 
    },
    joined_groups: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Group' 
    }],
    payment_methods: [{
        method_type: {type: String, required: true},
        account_name: String,
        account_number: String,
        qr_code_url: String
    }]
});

userSchema.pre('save', async function(next){
    if (!this.isModified('password_hash')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
})
module.exports = mongoose.model('User', userSchema);