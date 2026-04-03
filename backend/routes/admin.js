const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Dashboard stats
router.get('/dashboard', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) AS total_users FROM users');
    const [[{ total_dentists }]] = await db.query('SELECT COUNT(*) AS total_dentists FROM dentists');
    const [[{ total_patients }]] = await db.query('SELECT COUNT(*) AS total_patients FROM patients');
    const [[{ total_appointments }]] = await db.query('SELECT COUNT(*) AS total_appointments FROM appointments');
    const [[{ pending }]] = await db.query('SELECT COUNT(*) AS pending FROM appointments WHERE status="pending"');
    const [[{ approved }]] = await db.query('SELECT COUNT(*) AS approved FROM appointments WHERE status="approved"');
    const [[{ cancelled }]] = await db.query('SELECT COUNT(*) AS cancelled FROM appointments WHERE status="cancelled"');

    res.json({ total_users, total_dentists, total_patients, total_appointments, pending, approved, cancelled });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (with patient_id and dentist_id joined)
router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.role, u.created_at,
             p.patient_id, d.dentist_id
      FROM users u
      LEFT JOIN patients p ON p.user_id = u.user_id
      LEFT JOIN dentists d ON d.user_id = u.user_id
      ORDER BY u.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE user_id=?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all appointments
router.get('/appointments', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.status,
              up.name AS patient_name, ud.name AS dentist_name, d.specialization
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN users up ON p.user_id = up.user_id
       JOIN dentists d ON a.dentist_id = d.dentist_id
       JOIN users ud ON d.user_id = ud.user_id
       ORDER BY a.appointment_id ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
