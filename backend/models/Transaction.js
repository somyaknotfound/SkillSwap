const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['enroll', 'purchase', 'cashout', 'onboarding', 'bonus', 'refund', 'earn'],
      message: 'Invalid transaction type'
    }
  },
  amount_credits: {
    type: Number,
    required: [true, 'Amount in credits is required'],
    min: [0, 'Amount cannot be negative']
  },
  fee_credits: {
    type: Number,
    default: 0,
    min: [0, 'Fee cannot be negative']
  },
  net_credits: {
    type: Number,
    required: [true, 'Net credits is required']
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for effective amount (net credits)
transactionSchema.virtual('effectiveAmount').get(function() {
  return this.net_credits;
});

// Indexes for better query performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

// Pre-save middleware to calculate net credits
transactionSchema.pre('save', function(next) {
  if (this.isModified('amount_credits') || this.isModified('fee_credits')) {
    this.net_credits = this.amount_credits - this.fee_credits;
  }
  next();
});

// Static method to create enrollment transaction
transactionSchema.statics.createEnrollmentTransaction = function(userId, courseId, amount, fee = 0, meta = {}) {
  return this.create({
    user: userId,
    type: 'enroll',
    amount_credits: amount,
    fee_credits: fee,
    net_credits: amount - fee,
    meta: {
      ...meta,
      courseId: courseId
    },
    description: `Enrolled in course`,
    relatedCourse: courseId
  });
};

// Static method to create earning transaction
transactionSchema.statics.createEarningTransaction = function(userId, courseId, amount, fee = 0, meta = {}) {
  return this.create({
    user: userId,
    type: 'earn',
    amount_credits: amount,
    fee_credits: fee,
    net_credits: amount - fee,
    meta: {
      ...meta,
      courseId: courseId
    },
    description: `Earned from course`,
    relatedCourse: courseId
  });
};

// Static method to create cashout transaction
transactionSchema.statics.createCashoutTransaction = function(userId, amount, fee, meta = {}) {
  return this.create({
    user: userId,
    type: 'cashout',
    amount_credits: amount,
    fee_credits: fee,
    net_credits: amount - fee,
    meta: {
      ...meta,
      cashoutAmount: amount - fee
    },
    description: `Cashout request`,
    status: 'pending'
  });
};

// Static method to create bonus transaction
transactionSchema.statics.createBonusTransaction = function(userId, amount, reason, meta = {}) {
  return this.create({
    user: userId,
    type: 'bonus',
    amount_credits: amount,
    fee_credits: 0,
    net_credits: amount,
    meta: {
      ...meta,
      reason: reason
    },
    description: `Bonus: ${reason}`
  });
};

// Instance method to mark as completed
transactionSchema.methods.markCompleted = function() {
  this.status = 'completed';
  return this.save();
};

// Instance method to mark as failed
transactionSchema.methods.markFailed = function() {
  this.status = 'failed';
  return this.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);
