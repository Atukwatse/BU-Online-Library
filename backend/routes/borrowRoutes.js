const express = require('express');
const borrowController = require('../controllers/borrowController');
const asyncHandler = require('../middleware/asyncHandler');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, asyncHandler(borrowController.borrowBook));
router.get('/my', protect, asyncHandler(borrowController.getMyBorrowedBooks));
router.put('/return/:id', protect, asyncHandler(borrowController.returnBook));

module.exports = router;
