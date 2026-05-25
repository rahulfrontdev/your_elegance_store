const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      maxlength: [20, 'Mobile number cannot exceed 20 characters'],
    },
    alternateMobileNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Alternate mobile number cannot exceed 20 characters'],
      default: '',
    },
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true,
      maxlength: [200, 'Address line 1 cannot exceed 200 characters'],
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: [200, 'Address line 2 cannot exceed 200 characters'],
      default: '',
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [120, 'Landmark cannot exceed 120 characters'],
      default: '',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [80, 'City cannot exceed 80 characters'],
      index: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [80, 'State cannot exceed 80 characters'],
      index: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [80, 'Country cannot exceed 80 characters'],
      default: 'India',
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
      maxlength: [20, 'Postal code cannot exceed 20 characters'],
    },
    addressType: {
      type: String,
      enum: ['Home', 'Office', 'Other'],
      default: 'Home',
      required: [true, 'Address type is required'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: 'addressmasters',
    timestamps: true,
  }
);

addressSchema.index(
  { userId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
    name: 'unique_default_address_per_user',
  }
);
addressSchema.index({ userId: 1, city: 1, state: 1 });
addressSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Address', addressSchema);
