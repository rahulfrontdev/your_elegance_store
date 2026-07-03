const mongoose = require('mongoose');

const APPLICABLE_ON = ['catalog', 'category', 'product'];
const DISCOUNT_TYPES = ['percentage', 'fixed'];
const DISCOUNT_STATUSES = ['draft', 'scheduled', 'active', 'inactive', 'expired'];

const discountSchema = new mongoose.Schema(
  {
    discountName: { type: String, required: true, trim: true, maxlength: 200 },
    discountCode: {
      type: String,
      default: undefined,
      trim: true,
      uppercase: true,
      maxlength: 40,
    },
    discountType: { type: String, enum: DISCOUNT_TYPES, required: true },
    discountValue: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    maximumDiscountAmount: { type: Number, default: null, min: 0 },
    applicableOn: {
      type: String,
      enum: APPLICABLE_ON,
      required: true,
    },
    catalogIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Catalog' }],
      default: [],
    },
    categoryIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
      default: [],
    },
    productIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
    },
    usageLimit: { type: Number, default: null, min: 1 },
    usagePerUser: { type: Number, default: null, min: 1 },
    priority: { type: Number, default: 0, index: true },
    festivalTag: { type: String, default: '', trim: true, maxlength: 80 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: DISCOUNT_STATUSES,
      default: 'draft',
      index: true,
    },
    totalRedemptions: { type: Number, default: 0, min: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

discountSchema.index({ discountCode: 1 }, { unique: true, sparse: true });
discountSchema.index({ status: 1, startDate: 1, endDate: 1 });
discountSchema.index({ applicableOn: 1, status: 1 });
discountSchema.index({ festivalTag: 1 });

discountSchema.pre('save', function normalizeCode(next) {
  if (this.discountCode != null && String(this.discountCode).trim() === '') {
    this.discountCode = undefined;
  } else if (this.discountCode) {
    this.discountCode = String(this.discountCode).trim().toUpperCase();
  }
  next();
});

const Discount = mongoose.model('Discount', discountSchema);
Discount.APPLICABLE_ON = APPLICABLE_ON;
Discount.DISCOUNT_TYPES = DISCOUNT_TYPES;
Discount.DISCOUNT_STATUSES = DISCOUNT_STATUSES;
module.exports = Discount;
