const mongoose = require('mongoose');

const discountUsageSchema = new mongoose.Schema(
  {
    discount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discount',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    codeUsed: {
      type: String,
      default: '',
      trim: true,
    },
    amountSaved: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

discountUsageSchema.index({ discount: 1, user: 1 });
discountUsageSchema.index({ order: 1, discount: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('DiscountUsage', discountUsageSchema);
