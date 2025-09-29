const mongoose = require('mongoose');

const transactionHistorySchema = new mongoose.Schema({
  transaction_type: {
    type: String,
    enum: ['expense', 'payment', 'settlement', 'expense_completion', 'expense_deletion'],
    required: true,
    index: true
  },

  payer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  group_id: { // <-- Add this field
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'cancelled'],
    default: 'confirmed',
    index: true
  },
  
  payment_method: {
    type: String,
    enum: ['Cash', 'GCash', 'Bank', 'N/A'],
    default: 'N/A'
  },
  
  related_expense_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  },

  metadata: {
    confirmation_code: String,
    proof_file: {
      filename: String,
      originalname: String,
      mimetype: String,
      size: Number,
      path: String
    },
    settlement_details: {
      original_debt: Number,
      remaining_debt: Number,
      settlement_percentage: Number
    }
  },

  transaction_date: {
    type: Date,
    required: true,
    index: true
  },
  
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updated_at: {
    type: Date,
    default: Date.now
  },

  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
}, {
  collection: 'transaction_history'
  });

transactionHistorySchema.index({ group_id: 1, transaction_date: -1 });
transactionHistorySchema.index({ payer_id: 1, transaction_date: -1 });
transactionHistorySchema.index({ receiver_id: 1, transaction_date: -1 });
transactionHistorySchema.index({ transaction_type: 1, status: 1 });
transactionHistorySchema.index({ group_id: 1, transaction_type: 1, status: 1 });

transactionHistorySchema.pre('save', function(next) {
  this.updated_at = new Date();

  if (!this.transaction_id) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    this.transaction_id = `TXN-${timestamp}-${random}`.toUpperCase();
  }
  
  next();
});

transactionHistorySchema.statics.createFromExpense = async function(expense, createdBy) {
  try {
    const transaction_history = new this({
      transaction_type: 'expense',
      related_expense_id: expense._id,
      payer_id: expense.paid_by[0],
      group_id: expense.group,
      amount: expense.amount,
      description: expense.description,
      category: expense.category || 'General',
      transaction_date: expense.date || new Date(),
      created_by: createdBy
    });
    
    return await transaction_history.save();
  } catch (error) {
    throw new Error(`Failed to create transaction from expense: ${error.message}`);
  }
};

transactionHistorySchema.statics.createFromPayment = async function(payment, createdBy) {
  try {
    const transactionData = {
      transaction_type: payment.expense_id ? 'payment' : 'settlement',
      related_expense_id: payment.expense_id || null,
      group_id: payment.group_id,
      amount: payment.amount,
      payer_id: payment.payer_id,
      receiver_id: payment.creditor_id,
      description: payment.expense_id ? 'Expense payment' : 'Debt settlement',
      payment_method: payment.payment_method,
      status: payment.payment_status,
      transaction_date: payment.created_at || new Date(),
      created_by: createdBy,
      metadata: {}
    };

    if (payment.confirmation_code) {
      transactionData.metadata.confirmation_code = payment.confirmation_code;
    }
    
    if (payment.proof_file) {
      transactionData.metadata.proof_file = payment.proof_file;
    }
    
    const transaction_history = new this(transactionData);
    return await transaction_history.save();
  } catch (error) {
    throw new Error(`Failed to create transaction from payment: ${error.message}`);
  }
};

transactionHistorySchema.methods.getRelatedTransactions = async function() {
  return await this.constructor.find({
    $or: [
      { related_expense_id: this.related_expense_id },
      { 
        group_id: this.group_id,
        $or: [
          { payer_id: this.payer_id },
          { receiver_id: this.payer_id },
          { payer_id: this.receiver_id },
          { receiver_id: this.receiver_id }
        ]
      }
    ],
    _id: { $ne: this._id }
  }).sort({ transaction_date: -1 });
};

// Virtual for formatted amount
transactionHistorySchema.virtual('formatted_amount').get(function() {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Virtual for transaction age
transactionHistorySchema.virtual('age_in_days').get(function() {
  return Math.floor((new Date() - this.transaction_date) / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included in JSON output
transactionHistorySchema.set('toJSON', { virtuals: true });
transactionHistorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TransactionHistory', transactionHistorySchema);