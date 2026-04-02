const express = require('express');
const router = express.Router();

const SYSTEM_PROMPT = `You are DentBot, an AI assistant exclusively for DentAssist — a dental appointment booking platform.
You ONLY answer questions related to: dental health, dental treatments, booking appointments, using the DentAssist platform, dentists, patients, registration, login, and contact info.
If the user asks anything unrelated to dentistry or this platform, politely decline and redirect them.
Platform info: users register as patient/dentist, search dentists by location, book appointments from dashboard.
Contact: +91 8928099534 | tanushree09910@gmail.com | Dental Appointment Centre | Mon-Sun 7AM-10PM.
Keep responses concise and friendly. Use emojis occasionally.`;

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: 'No message provided.' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        max_tokens: 512
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ reply: 'AI error: ' + data.error.message });
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ reply: "Sorry, I'm having trouble right now. Please try again!" });
  }
});

module.exports = router;
