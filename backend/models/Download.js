const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    downloadDate: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
downloadSchema.index({ user: 1, downloadDate: -1 });
downloadSchema.index({ book: 1, downloadDate: -1 });
downloadSchema.index({ downloadDate: -1 });

// Prevent duplicate downloads by the same user for the same book within 24 hours
downloadSchema.index(
  { user: 1, book: 1, downloadDate: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('Download', downloadSchema);
