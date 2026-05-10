const mongoose = require('mongoose');

const adminBookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    status: {
      type: String,
      enum: ['available', 'limited', 'archived'],
      default: 'available',
    },
    createdBy: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'admin_books',
  }
);

module.exports = mongoose.model('AdminBook', adminBookSchema);
