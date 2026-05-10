const express = require('express');
const router = express.Router();

let db;
try {
  db = require('../config/mysql_database');
} catch (error) {
  db = require('../config/mock_database');
}

// GET all reviews (public – no auth needed)
router.get('/', async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM Reviews ORDER BY CreatedAt DESC');
    // mysql2 wrapper often returns an array, and mock_database returns [[]] or data
    // Let's normalize it if it's an array of arrays
    const data = Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] : (rows || []);
    res.json({ status: 'success', data });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// POST a new review (anyone can submit – name taken from body or token)
router.post('/', async (req, res) => {
  try {
    const { rating, comment, service, userName, userEmail } = req.body;

    const name = userName || 'Anonymous';
    const email = userEmail || '';

    if (!rating || rating < 1 || rating > 5 || !service) {
      return res.status(400).json({ message: 'Rating (1-5) and service name are required' });
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

    await db.query(
      `INSERT INTO Reviews (UserName, UserEmail, Rating, Comment, Service, CreatedAt) VALUES (?,?,?,?,?,?)`,
      [name, email, rating, comment || '', service, timestamp]
    );
    res.status(201).json({ status: 'success', message: 'Review saved. Thank you!' });
  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).json({ message: 'Failed to save review' });
  }
});

// DELETE a review (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query('DELETE FROM Reviews WHERE ReviewID = ?', [req.params.id]);
    
    // Normalize affectedRows between mysql2 and mock_database
    const affectedRows = Array.isArray(result) && result[0] ? result[0].affectedRows : (result ? result.affectedRows : 0);
    
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json({ status: 'success', message: 'Review deleted' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

module.exports = router;
