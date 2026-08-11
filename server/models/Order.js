const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    sku: { type: String, default: '', trim: true },
    image: { type: String, default: '', trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    unitOriginalPrice: { type: Number, min: 0 },
    lineDiscountAmount: { type: Number, default: 0, min: 0 },
    lineFinalTotal: { type: Number, min: 0 },
    appliedDiscountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discount',
      default: null,
    },
    appliedDiscountName: { type: String, default: '' },
  },
  { _id: false }
);

const appliedDiscountSnapshotSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    finalTotal: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: '' },
    appliedDiscountIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Discount' }],
      default: [],
    },
    lines: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        sku: { type: String, default: '', trim: true },
        quantity: Number,
        unitOriginalPrice: Number,
        lineSubtotal: Number,
        discountAmount: Number,
        finalLineTotal: Number,
        appliedDiscountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount', default: null },
        appliedDiscountName: { type: String, default: '' },
        discountType: { type: String, default: '' },
      },
    ],
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(arr) => arr.length > 0, 'At least one item is required'],
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'ONLINE'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    cancellation: {
      cancelledAt: { type: Date, default: null },
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      reason: { type: String, default: '', trim: true, maxlength: 300 },
    },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    appliedDiscountSnapshot: {
      type: appliedDiscountSnapshotSchema,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

