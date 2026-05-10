const mongoose = require('mongoose');

const libraryResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      enum: ['database', 'ebook', 'journal', 'guide', 'other'],
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      trim: true,
      enum: ['active', 'maintenance', 'archived'],
      default: 'active',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'library_resources',
  }
);

module.exports = mongoose.model('LibraryResource', libraryResourceSchema);
