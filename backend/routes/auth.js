const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendWelcome } = require('../mailer');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role, age, gender, location, specialization, available_days } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ message: 'All fields required' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashed, role]
    );
    const userId = result.insertId;

    if (role === 'patient') {
      await db.query(
        'INSERT INTO patients (user_id, age, gender, location) VALUES (?, ?, ?, ?)',
        [userId, age || null, gender || null, location || null]
      );
    } else if (role === 'dentist') {
      await db.query(
        'INSERT INTO dentists (user_id, specialization, location, available_days) VALUES (?, ?, ?, ?)',
        [userId, specialization || '', location || '', available_days || '']
      );
    }

    res.status(201).json({ message: 'Registered successfully' });
    // Send welcome email (non-blocking)
    sendWelcome(email, name, role).catch((err) => console.error('Email error:', err.message));
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Email already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: user.role, name: user.name, user_id: user.user_id });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
