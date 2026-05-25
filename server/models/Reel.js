const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    reelUrl: {
      type: String,
      required: [true, 'Reel URL is required'],
      trim: true,
    },
    shortcode: {
      type: String,
      trim: true,
    },
    embedUrl: {
      type: String,
      required: [true, 'Embed URL is required'],
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    collection: 'reelmasters',
    timestamps: true,
  }
);

reelSchema.index({ isActive: 1, displayOrder: 1, createdAt: -1 });
reelSchema.index({ shortcode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Reel', reelSchema);
