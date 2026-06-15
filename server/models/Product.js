const mongoose = require("mongoose");

const ALLOWED_GST_RATES = [3, 12, 18];

const variationSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      trim: true,
      default: "",
      maxlength: 64,
    },
    name: {
      type: String,
      trim: true,
      default: "",
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    colour: {
      type: String,
      trim: true,
      required: [true, "Variation colour is required"],
      maxlength: 40,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  { _id: true }
);

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      trim: true,
      default: "",
      maxlength: 64,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    colour: {
      type: String,
      trim: true,
      default: "",
      maxlength: 40,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    qty: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstRate: {
      type: Number,
      enum: ALLOWED_GST_RATES,
      required: [true, "GST rate is required"],
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    hasVariations: {
      type: Boolean,
      default: false,
    },
    variations: {
      type: [variationSchema],
      default: [],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
