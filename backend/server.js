const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/dentists', require('./routes/dentists'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/chat', require('./routes/chat'));

// Email test route (remove after testing)
app.get('/api/test-email', async (req, res) => {
  const { sendWelcome } = require('./mailer');
  try {
    await sendWelcome(process.env.EMAIL_USER, 'Test User', 'patient');
    res.json({ message: 'Test email sent! Check your inbox.' });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Dent Assist running at http://localhost:${PORT}`));
