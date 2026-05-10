const Borrow = require('../models/Borrow');
const Book = require('../models/Book');

// Borrow a book
// POST /api/borrow
// Private
exports.borrowBook = async (req, res, next) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      res.status(400);
      throw new Error('bookId is required');
    }

    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    const existingBorrow = await Borrow.findOne({ user: req.user.id, book: bookId, returnDate: { $exists: false } });
    if (existingBorrow) {
      res.status(400);
      throw new Error('This book is already borrowed by this user and not yet returned');
    }

    const borrow = await Borrow.create({
      user: req.user.id,
      book: bookId,
    });

    res.status(201).json({
      status: 'success',
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
};

// Get user borrow records
// GET /api/borrow/my
// Private
exports.getMyBorrowedBooks = async (req, res, next) => {
  try {
    const borrows = await Borrow.find({ user: req.user.id }).populate('book', 'title author category fileUrl');

    res.status(200).json({
      status: 'success',
      count: borrows.length,
      data: borrows,
    });
  } catch (error) {
    next(error);
  }
};

// Return a borrowed book
// PUT /api/borrow/return/:id
// Private
exports.returnBook = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);

    if (!borrow) {
      res.status(404);
      throw new Error('Borrow record not found');
    }

    if (borrow.user.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to return this borrow record');
    }

    if (borrow.returnDate) {
      res.status(400);
      throw new Error('Book already returned');
    }

    borrow.returnDate = new Date();
    await borrow.save();

    res.status(200).json({
      status: 'success',
      message: 'Book returned successfully',
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
};
