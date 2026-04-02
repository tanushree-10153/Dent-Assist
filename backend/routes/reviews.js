const express = require('express');
const db = require('../db');
const router = express.Router();

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 20');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit a review (anyone)
router.post('/', async (req, res) => {
  const { name, rating, message } = req.body;
  if (!name || !rating || !message)
    return res.status(400).json({ message: 'All fields required' });
  try {
    await db.query('INSERT INTO reviews (name, rating, message) VALUES (?, ?, ?)', [name, rating, message]);
    res.status(201).json({ message: 'Review submitted!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
