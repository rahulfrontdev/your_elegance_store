const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 20,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    image: {
      type: String,
      default: '',
    },
    path: {
      type: String,
      default: "",
      index: true,
    },

    level: {
      type: Number,
      default: 0,
      min: 0,
    },

  },
  { timestamps: true }
);

categorySchema.index({ parentId: 1 });

module.exports = mongoose.model("Category", categorySchema);