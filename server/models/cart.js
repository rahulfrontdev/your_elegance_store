const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
{
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  }
},
{ _id: false }
);

const cartSchema = new mongoose.Schema(
{
  // Keep `user` as primary owner field to match existing unique index in DB.
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  // Backward compatibility with older code paths.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  items: [cartItemSchema]
},
{
  timestamps: true
});

module.exports = mongoose.model("Cart", cartSchema);