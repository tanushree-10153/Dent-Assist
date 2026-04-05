const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

function sendMail(to, subject, html) {
  return transporter.sendMail({
    from: `"DentAssist" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

// Welcome email on registration
function sendWelcome(to, name, role) {
  const html = `
  <div style="font-family:Poppins,sans-serif;max-width:560px;margin:0 auto;background:#f8faff;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:2rem;text-align:center;">
      <h1 style="color:white;margin:0;font-size:1.6rem;">🦷 DentAssist</h1>
    </div>
    <div style="padding:2rem;">
      <h2 style="color:#0f172a;">Welcome, ${name}! 👋</h2>
      <p style="color:#475569;line-height:1.7;">Your account has been created successfully as a <strong>${role}</strong>.</p>
      <p style="color:#475569;line-height:1.7;">You can now log in and ${role === 'patient' ? 'book appointments with verified dentists near you.' : 'manage your appointments and profile.'}</p>
      <div style="margin:1.5rem 0;padding:1rem;background:#eff6ff;border-radius:10px;border-left:4px solid #2563eb;">
        <p style="margin:0;color:#1e40af;font-size:0.9rem;"><strong>📍 Dental Appointment Centre</strong><br/>Mon-Sun: 7AM – 10PM<br/>+91 8928099534</p>
      </div>
      <p style="color:#94a3b8;font-size:0.8rem;">If you didn't create this account, please ignore this email.</p>
    </div>
    <div style="background:#1e293b;padding:1rem;text-align:center;">
      <p style="color:rgba(255,255,255,0.5);font-size:0.75rem;margin:0;">© 2026 DentAssist. All rights reserved.</p>
    </div>
  </div>`;
  return sendMail(to, 'Welcome to DentAssist! 🦷', html);
}

// Appointment booked confirmation
function sendAppointmentBooked(to, patientName, dentistName, date, time) {
  const html = `
  <div style="font-family:Poppins,sans-serif;max-width:560px;margin:0 auto;background:#f8faff;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:2rem;text-align:center;">
      <h1 style="color:white;margin:0;font-size:1.6rem;">🦷 DentAssist</h1>
    </div>
    <div style="padding:2rem;">
      <h2 style="color:#0f172a;">Appointment Booked! 📅</h2>
      <p style="color:#475569;">Hi <strong>${patientName}</strong>, your appointment has been booked successfully.</p>
      <div style="background:white;border-radius:12px;padding:1.2rem;border:1px solid #e2e8f0;margin:1.2rem 0;">
        <p style="margin:0 0 8px;color:#64748b;font-size:0.85rem;"><strong style="color:#0f172a;">👨‍⚕️ Dentist:</strong> Dr. ${dentistName}</p>
        <p style="margin:0 0 8px;color:#64748b;font-size:0.85rem;"><strong style="color:#0f172a;">📅 Date:</strong> ${date}</p>
        <p style="margin:0;color:#64748b;font-size:0.85rem;"><strong style="color:#0f172a;">⏰ Time:</strong> ${time}</p>
      </div>
      <p style="color:#475569;font-size:0.9rem;">Your appointment is currently <strong style="color:#f59e0b;">Pending</strong> — the dentist will confirm it shortly.</p>
    </div>
    <div style="background:#1e293b;padding:1rem;text-align:center;">
      <p style="color:rgba(255,255,255,0.5);font-size:0.75rem;margin:0;">© 2026 DentAssist. All rights reserved.</p>
    </div>
  </div>`;
  return sendMail(to, 'Appointment Booked – DentAssist 📅', html);
}

// Appointment approved
function sendAppointmentApproved(to, patientName, dentistName, date, time) {
  const html = `
  <div style="font-family:Poppins,sans-serif;max-width:560px;margin:0 auto;background:#f8faff;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#059669,#10b981);padding:2rem;text-align:center;">
      <h1 style="color:white;margin:0;font-size:1.6rem;">🦷 DentAssist</h1>
    </div>
    <div style="padding:2rem;">
      <h2 style="color:#0f172a;">Appointment Confirmed! ✅</h2>
      <p style="color:#475569;">Hi <strong>${patientName}</strong>, your appointment has been <strong style="color:#10b981;">approved</strong>!</p>
      <div style="background:white;border-radius:12px;padding:1.2rem;border:1px solid #e2e8f0;margin:1.2rem 0;">
        <p style="margin:0 0 8px;color:#64748b;font-size:0.85rem;"><strong style="color:#0f172a;">👨‍⚕️ Dentist:</strong> Dr. ${dentistName}</p>
        <p style="margin:0 0 8px;color:#64748b;font-size:0.85rem;"><strong style="color:#0f172a;">📅 Date:</strong> ${date}</p>
        <p style="margin:0;color:#64748b;font-size:0.85rem;"><strong style="color:#0f172a;">⏰ Time:</strong> ${time}</p>
      </div>
      <p style="color:#475569;font-size:0.9rem;">Please arrive 10 minutes early. See you soon! 😊</p>
      <div style="margin-top:1rem;padding:1rem;background:#ecfdf5;border-radius:10px;border-left:4px solid #10b981;">
        <p style="margin:0;color:#065f46;font-size:0.85rem;">📍 Dental Appointment Centre &nbsp;|&nbsp; +91 8928099534</p>
      </div>
    </div>
    <div style="background:#1e293b;padding:1rem;text-align:center;">
      <p style="color:rgba(255,255,255,0.5);font-size:0.75rem;margin:0;">© 2026 DentAssist. All rights reserved.</p>
    </div>
  </div>`;
  return sendMail(to, 'Appointment Confirmed – DentAssist ✅', html);
}

module.exports = { sendMail, sendWelcome, sendAppointmentBooked, sendAppointmentApproved };
