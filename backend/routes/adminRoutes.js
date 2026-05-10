const express = require('express');
const {
  getDashboardData,
  createBook,
  updateBook,
  deleteBook,
  createResource,
  updateResource,
  deleteResource,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/staffAuth');

const router = express.Router();

router.use(protect, adminOnly);

router.get('/dashboard', getDashboardData);
router.post('/books', createBook);
router.put('/books/:id', updateBook);
router.delete('/books/:id', deleteBook);
router.post('/resources', createResource);
router.put('/resources/:id', updateResource);
router.delete('/resources/:id', deleteResource);

module.exports = router;
