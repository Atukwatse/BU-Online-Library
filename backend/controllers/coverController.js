const Book = require('../models/Book');
const coverService = require('../services/coverService');

// @desc    Generate AI cover for book
// @route   POST /api/books/:id/generate-cover
// @access  Private/Admin
exports.generateBookCover = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    // Delete existing cover if there is one
    if (book.coverImagePath) {
      await coverService.deleteCover(book.coverImagePath);
    }

    // Generate new cover
    const coverImagePath = await coverService.generateCover({
      title: book.title,
      author: book.author,
      category: book.category,
    });

    // Update book with new cover path
    book.coverImagePath = coverImagePath;
    await book.save();

    res.status(200).json({
      status: 'success',
      message: 'Book cover generated successfully',
      data: {
        bookId: book._id,
        coverImagePath: coverImagePath,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete book cover
// @route   DELETE /api/books/:id/cover
// @access  Private/Admin
exports.deleteBookCover = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    if (!book.coverImagePath) {
      res.status(404);
      throw new Error('Book has no cover to delete');
    }

    // Delete cover file
    await coverService.deleteCover(book.coverImagePath);

    // Remove cover path from book
    book.coverImagePath = undefined;
    await book.save();

    res.status(200).json({
      status: 'success',
      message: 'Book cover deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
