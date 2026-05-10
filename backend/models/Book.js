const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      maxlength: 20,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    filePath: {
      type: String,
      required: true,
    },
    coverImagePath: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Available', 'Restricted', 'Archived'],
      default: 'Available',
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
    fileSize: {
      type: Number,
    },
    description: {
      type: String,
      maxlength: 2000,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ status: 1 });
bookSchema.index({ year: 1 });
bookSchema.index({ dateAdded: -1 });

module.exports = mongoose.model('Book', bookSchema);
