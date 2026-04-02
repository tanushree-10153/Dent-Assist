const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendAppointmentApproved } = require('../mailer');
const router = express.Router();

// Get all dentists (public)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT d.dentist_id, u.name, u.email, d.specialization, d.location, d.available_days, d.available_from, d.available_to
       FROM dentists d JOIN users u ON d.user_id = u.user_id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search dentists by location
router.get('/search', async (req, res) => {
  const { location } = req.query;
  try {
    const [rows] = await db.query(
      `SELECT d.dentist_id, u.name, d.specialization, d.location, d.available_days, d.available_from, d.available_to
       FROM dentists d JOIN users u ON d.user_id = u.user_id
       WHERE d.location LIKE ?`,
      [`%${location}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update dentist profile
router.put('/profile', verifyToken, requireRole('dentist'), async (req, res) => {
  const { specialization, location, available_days, available_from, available_to } = req.body;
  try {
    await db.query(
      'UPDATE dentists SET specialization=?, location=?, available_days=?, available_from=?, available_to=? WHERE user_id=?',
      [specialization, location, available_days, available_from, available_to, req.user.user_id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dentist's appointments
router.get('/appointments', verifyToken, requireRole('dentist'), async (req, res) => {
  try {
    const [dentist] = await db.query('SELECT dentist_id FROM dentists WHERE user_id=?', [req.user.user_id]);
    if (!dentist.length) return res.status(404).json({ message: 'Dentist not found' });

    const [rows] = await db.query(
      `SELECT a.*, u.name AS patient_name, p.age, p.gender
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN users u ON p.user_id = u.user_id
       WHERE a.dentist_id = ?
       ORDER BY a.appointment_date, a.appointment_time`,
      [dentist[0].dentist_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept or reject appointment
router.patch('/appointments/:id', verifyToken, requireRole('dentist'), async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'cancelled'].includes(status))
    return res.status(400).json({ message: 'Invalid status' });
  try {
    await db.query('UPDATE appointments SET status=? WHERE appointment_id=?', [status, req.params.id]);

    // Send approval email to patient
    if (status === 'approved') {
      try {
        const [appt] = await db.query(
          `SELECT a.appointment_date, a.appointment_time,
                  up.email AS patient_email, up.name AS patient_name,
                  ud.name AS dentist_name
           FROM appointments a
           JOIN patients p ON a.patient_id = p.patient_id
           JOIN users up ON p.user_id = up.user_id
           JOIN dentists d ON a.dentist_id = d.dentist_id
           JOIN users ud ON d.user_id = ud.user_id
           WHERE a.appointment_id=?`, [req.params.id]
        );
        if (appt.length) {
          const a = appt[0];
          const dateStr = new Date(a.appointment_date).toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' });
          sendAppointmentApproved(a.patient_email, a.patient_name, a.dentist_name, dateStr, a.appointment_time).catch(() => {});
        }
      } catch(e) {}
    }

    res.json({ message: `Appointment ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
