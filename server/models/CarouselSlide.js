const mongoose = require('mongoose');

const carouselSlideSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, 'Carousel image is required'],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    linkUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

carouselSlideSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('CarouselSlide', carouselSlideSchema);
