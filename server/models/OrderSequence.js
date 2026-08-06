const mongoose = require('mongoose');

const orderSequenceSchema = new mongoose.Schema(
  {
    /** YYYYMMDD in Asia/Kolkata */
    dateKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    seq: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrderSequence', orderSequenceSchema);
