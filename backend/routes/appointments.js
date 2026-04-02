const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendAppointmentBooked } = require('../mailer');
const router = express.Router();

// Book appointment (patient)
router.post('/', verifyToken, requireRole('patient'), async (req, res) => {
  const { dentist_id, appointment_date, appointment_time, notes } = req.body;
  try {
    const [patient] = await db.query('SELECT patient_id FROM patients WHERE user_id=?', [req.user.user_id]);
    if (!patient.length) return res.status(404).json({ message: 'Patient profile not found' });

    const [conflict] = await db.query(
      'SELECT * FROM appointments WHERE dentist_id=? AND appointment_date=? AND appointment_time=? AND status != "cancelled"',
      [dentist_id, appointment_date, appointment_time]
    );
    if (conflict.length) return res.status(409).json({ message: 'Time slot already booked' });

    await db.query(
      'INSERT INTO appointments (patient_id, dentist_id, appointment_date, appointment_time, notes) VALUES (?,?,?,?,?)',
      [patient[0].patient_id, dentist_id, appointment_date, appointment_time, notes || null]
    );

    // Send booking confirmation email
    try {
      const [dentistInfo] = await db.query(
        'SELECT u.name FROM dentists d JOIN users u ON d.user_id = u.user_id WHERE d.dentist_id=?', [dentist_id]
      );
      const [userInfo] = await db.query('SELECT email, name FROM users WHERE user_id=?', [req.user.user_id]);
      if (userInfo.length && dentistInfo.length) {
        const dateStr = new Date(appointment_date).toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' });
        sendAppointmentBooked(userInfo[0].email, userInfo[0].name, dentistInfo[0].name, dateStr, appointment_time).catch(() => {});
      }
    } catch(e) {}

    res.status(201).json({ message: 'Appointment booked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get patient's appointments
router.get('/my', verifyToken, requireRole('patient'), async (req, res) => {
  try {
    const [patient] = await db.query('SELECT patient_id FROM patients WHERE user_id=?', [req.user.user_id]);
    if (!patient.length) return res.status(404).json({ message: 'Patient not found' });

    const [rows] = await db.query(
      `SELECT a.*, u.name AS dentist_name, d.specialization
       FROM appointments a
       JOIN dentists d ON a.dentist_id = d.dentist_id
       JOIN users u ON d.user_id = u.user_id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patient[0].patient_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel/reschedule appointment (patient)
router.patch('/:id', verifyToken, requireRole('patient'), async (req, res) => {
  const { status, appointment_date, appointment_time } = req.body;
  try {
    if (status === 'cancelled') {
      await db.query('UPDATE appointments SET status="cancelled" WHERE appointment_id=?', [req.params.id]);
    } else if (appointment_date && appointment_time) {
      await db.query(
        'UPDATE appointments SET appointment_date=?, appointment_time=?, status="pending" WHERE appointment_id=?',
        [appointment_date, appointment_time, req.params.id]
      );
    }
    res.json({ message: 'Appointment updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
