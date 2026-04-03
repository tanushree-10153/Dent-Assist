const API = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://your-backend.onrender.com/api';
let token = localStorage.getItem('token');
let userRole = localStorage.getItem('role');
let userName = localStorage.getItem('name');

window.onload = function() {
  updateNav();
  if (token) {
    if (userRole === 'patient') { showSection('patient-dashboard'); loadPatientDashboard(); }
    else if (userRole === 'dentist') { showSection('dentist-dashboard'); loadDentistDashboard(); }
    else if (userRole === 'admin') { showSection('admin-dashboard'); loadAdminDashboard(); }
  } else { showSection('home'); }
};

function updateNav() {
  var lb = document.getElementById('logoutBtn');
  var li = document.getElementById('loginNavBtn');
  var rb = document.getElementById('registerNavBtn');
  var db = document.getElementById('dashboardBtn');
  var nu = document.getElementById('navUser');
  if (token) {
    if (lb) lb.style.display = 'inline-block';
    if (db) db.style.display = 'inline-block';
    if (li) li.style.display = 'none';
    if (rb) rb.style.display = 'none';
    if (nu) nu.textContent = 'Hi, ' + userName;
  } else {
    if (lb) lb.style.display = 'none';
    if (db) db.style.display = 'none';
    if (li) li.style.display = 'inline-block';
    if (rb) rb.style.display = 'inline-block';
    if (nu) nu.textContent = '';
  }
}

function goToDashboard() {
  if (userRole === 'patient') { showSection('patient-dashboard'); loadPatientDashboard(); }
  else if (userRole === 'dentist') { showSection('dentist-dashboard'); loadDentistDashboard(); }
  else if (userRole === 'admin') { showSection('admin-dashboard'); loadAdminDashboard(); }
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
  var footer = document.getElementById('mainFooter');
  if (footer) {
    var pub = ['home','about','services','contact','dentists-list'];
    footer.style.display = pub.indexOf(id) >= 0 ? 'block' : 'none';
  }
  if (id === 'dentists-list') loadDentists();
  if (id === 'about') loadAboutDentists();
  window.scrollTo(0,0);
}

function switchDash(panelId, btn) {
  var section = btn.closest('.section');
  if (!section) return;
  section.querySelectorAll('.dash-panel').forEach(function(p) { p.classList.remove('active'); });
  section.querySelectorAll('.snav').forEach(function(a) {
    a.classList.remove('active','bg-gradient-to-r','from-blue-600','to-cyan-500','text-white');
    a.classList.add('text-slate-600');
  });
  var panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
  btn.classList.add('active');
  btn.classList.remove('text-slate-600');
}

function toggleRoleFields() {
  var role = document.getElementById('regRole').value;
  document.getElementById('patientFields').style.display = role === 'patient' ? 'block' : 'none';
  document.getElementById('dentistFields').style.display = role === 'dentist' ? 'block' : 'none';
}

function showMsg(id, text, type) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'msg ' + type;
}

function toggleMenu() {
  var nav = document.getElementById('navLinks');
  if (nav) nav.classList.toggle('open');
}

function handleContact(e) {
  e.preventDefault();
  showMsg('contactMsg', 'Message sent! We will get back to you soon.', 'success');
  e.target.reset();
}

function logout() {
  token = null; userRole = null; userName = null;
  localStorage.clear();
  updateNav();
  showSection('home');
}

async function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('loginEmail').value;
  var password = document.getElementById('loginPassword').value;
  try {
    var res = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: password }) });
    var data = await res.json();
    if (!res.ok) return showMsg('loginMsg', data.message, 'error');
    token = data.token; userRole = data.role; userName = data.name;
    localStorage.setItem('token', token); localStorage.setItem('role', userRole); localStorage.setItem('name', userName);
    updateNav(); goToDashboard();
  } catch(err) { showMsg('loginMsg', 'Connection error. Is the server running?', 'error'); }
}

async function handleRegister(e) {
  e.preventDefault();
  var role = document.getElementById('regRole').value;
  var location = role === 'dentist'
    ? (document.getElementById('regDentistLocation') ? document.getElementById('regDentistLocation').value : null)
    : (document.getElementById('regPatientLocation') ? document.getElementById('regPatientLocation').value : null);
  var body = {
    name: document.getElementById('regName').value,
    email: document.getElementById('regEmail').value,
    password: document.getElementById('regPassword').value,
    role: role,
    age: document.getElementById('regAge') ? document.getElementById('regAge').value : null,
    gender: document.getElementById('regGender') ? document.getElementById('regGender').value : null,
    location: location,
    specialization: document.getElementById('regSpec') ? document.getElementById('regSpec').value : null,
    available_days: document.getElementById('regDays') ? document.getElementById('regDays').value : null
  };
  try {
    var res = await fetch(API + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    var data = await res.json();
    if (!res.ok) return showMsg('registerMsg', data.message, 'error');
    showMsg('registerMsg', 'Account created! Please login.', 'success');
    setTimeout(function() { showSection('login'); }, 1500);
  } catch(err) { showMsg('registerMsg', 'Connection error.', 'error'); }
}

var gradients = [
  'linear-gradient(135deg,#1e3a8a,#2563eb)',
  'linear-gradient(135deg,#7c3aed,#a855f7)',
  'linear-gradient(135deg,#0f766e,#06b6d4)',
  'linear-gradient(135deg,#b45309,#f59e0b)',
  'linear-gradient(135deg,#be123c,#f43f5e)',
  'linear-gradient(135deg,#065f46,#10b981)'
];

async function loadAboutDentists() {
  var grid = document.getElementById('aboutDentistGrid');
  if (!grid) return;
  try {
    var res = await fetch(API + '/dentists');
    var dentists = await res.json();
    if (!dentists.length) {
      grid.innerHTML = '<div class="about-dentist-loading">No specialists registered yet. <a href="#" onclick="showSection(\'register\')" style="color:var(--primary);font-weight:600;">Be the first to join!</a></div>';
      return;
    }
    grid.innerHTML = dentists.map(function(d, i) {
      var grad = gradients[i % gradients.length];
      var timeStr = d.available_from ? formatTime(d.available_from) + ' – ' + formatTime(d.available_to) : null;
      return '<div class="about-dcard">'
        + '<div class="about-dcard-banner" style="background:' + grad + '"></div>'
        + '<div class="about-dcard-avatar" style="background:' + grad + '">'
        + '<i class="fas fa-user-md" style="color:white;font-size:2rem;"></i></div>'
        + '<div class="about-dcard-body">'
        + '<h3>Dr. ' + d.name + '</h3>'
        + '<span class="about-dcard-spec">' + (d.specialization || 'General Dentistry') + '</span>'
        + '<div class="about-dcard-info">'
        + (d.location ? '<span><i class="fas fa-map-marker-alt"></i>' + d.location + '</span>' : '')
        + (d.available_days ? '<span><i class="fas fa-calendar-alt"></i>' + d.available_days + '</span>' : '')
        + (timeStr ? '<span><i class="fas fa-clock"></i>' + timeStr + '</span>' : '')
        + '</div>'
        + '<div class="about-dcard-verified"><i class="fas fa-shield-check"></i> Verified Professional</div>'
        + '<div class="dcard-stars">★★★★★</div>'
        + '<button class="about-dcard-book" onclick="showSection(\'dentists-list\')">'
        + '<i class="fas fa-calendar-plus"></i> Book Appointment</button>'
        + '</div></div>';
    }).join('');
  } catch(err) {
    grid.innerHTML = '<div class="about-dentist-loading">Could not load specialists.</div>';
  }
}

async function loadDentists() {
  try {
    var res = await fetch(API + '/dentists');
    renderDentistCards(await res.json());
  } catch(err) {
    var c = document.getElementById('dentistCards');
    if (c) c.innerHTML = '<p class="text-red-500 p-8">Server not running.</p>';
  }
}

async function searchDentists() {
  var loc = document.getElementById('searchLocation').value.trim();
  if (!loc) { loadDentists(); return; }
  var res = await fetch(API + '/dentists/search?location=' + encodeURIComponent(loc));
  renderDentistCards(await res.json());
}

function formatTime(t) {
  if (!t) return null;
  var parts = t.split(':');
  var h = parseInt(parts[0]), m = parts[1];
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + m + ' ' + ampm;
}

function renderDentistCards(dentists) {
  var container = document.getElementById('dentistCards');
  if (!dentists.length) { container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:4rem;grid-column:1/-1;">No dentists found.</p>'; return; }
  var html = '';
  for (var i = 0; i < dentists.length; i++) {
    var d = dentists[i];
    var grad = gradients[i % gradients.length];
    var timeStr = d.available_from ? formatTime(d.available_from) + ' – ' + formatTime(d.available_to) : 'Flexible hours';
    var bookBtn = (token && userRole === 'patient')
      ? '<button onclick="prefillBooking(' + d.dentist_id + ')" class="dcard-book-btn"><i class="fas fa-calendar-plus"></i> Book Appointment</button>'
      : '<button onclick="showSection(\'register\')" class="dcard-book-btn"><i class="fas fa-calendar-plus"></i> Book Appointment</button>';
    html += '<div class="dcard">'
      + '<div class="dcard-header" style="background:' + grad + '">'
      + '<div class="dcard-tooth">🦷</div>'
      + '<div class="dcard-avatar"><i class="fas fa-user-md"></i></div>'
      + '<h3 class="dcard-name">Dr. ' + d.name + '</h3>'
      + '<span class="dcard-spec">' + (d.specialization || 'General Dentistry') + '</span>'
      + '</div>'
      + '<div class="dcard-body">'
      + '<div class="dcard-row"><i class="fas fa-calendar-alt"></i><span>' + (d.available_days || 'Contact for availability') + '</span></div>'
      + '<div class="dcard-row"><i class="fas fa-clock"></i><span>' + timeStr + '</span></div>'
      + (d.location ? '<div class="dcard-row"><i class="fas fa-map-marker-alt"></i><span>' + d.location + '</span></div>' : '')
      + '<div class="dcard-row verified"><i class="fas fa-shield-check"></i><span>Verified Professional</span></div>'
      + '<div class="dcard-stars">★★★★★</div>'
      + bookBtn
      + '</div></div>';
  }
  container.innerHTML = html;
}

function prefillBooking(dentistId) {
  showSection('patient-dashboard'); loadPatientDashboard();
  setTimeout(function() { var s = document.getElementById('bookDentist'); if (s) s.value = dentistId; }, 400);
}

async function loadPatientDashboard() {
  var n = document.getElementById('sidebarName'); if (n) n.textContent = userName || 'Patient';
  try {
    var res = await fetch(API + '/dentists');
    var dentists = await res.json();
    var sel = document.getElementById('bookDentist');
    if (sel) sel.innerHTML = dentists.map(function(d) { return '<option value="' + d.dentist_id + '">Dr. ' + d.name + ' - ' + (d.specialization || 'General') + '</option>'; }).join('');
  } catch(err) {}
  loadAppointmentHistory();
}

async function bookAppointment(e) {
  e.preventDefault();
  var time = pickerTo24h('bookHour', 'bookMin', 'bookAmPm');
  if (!time) return showMsg('bookMsg', 'Please select a valid time.', 'error');
  var body = { dentist_id: document.getElementById('bookDentist').value, appointment_date: document.getElementById('bookDate').value, appointment_time: time, notes: document.getElementById('bookNotes').value };
  try {
    var res = await fetch(API + '/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(body) });
    var data = await res.json();
    showMsg('bookMsg', data.message, res.ok ? 'success' : 'error');
    if (res.ok) loadAppointmentHistory();
  } catch(err) { showMsg('bookMsg', 'Connection error.', 'error'); }
}

function formatApptDate(raw) {
  if (!raw) return '—';
  var d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
}

async function loadAppointmentHistory() {
  try {
    var res = await fetch(API + '/appointments/my', { headers: { 'Authorization': 'Bearer ' + token } });
    var appts = await res.json();
    var container = document.getElementById('appointmentHistory'); if (!container) return;
    if (!appts.length) {
      container.innerHTML = '<div class="appt-empty"><div style="font-size:3.5rem;margin-bottom:1rem;">📅</div><p>No appointments yet.</p><span>Book your first appointment to get started!</span></div>';
      return;
    }
    var statusMeta = {
      approved:  { color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', icon: 'fa-check-circle',  label: 'Approved'  },
      pending:   { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', icon: 'fa-hourglass-half', label: 'Pending'   },
      cancelled: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', icon: 'fa-times-circle',  label: 'Cancelled' }
    };
    var html = '';
    for (var i = 0; i < appts.length; i++) {
      var a = appts[i];
      var m = statusMeta[a.status] || statusMeta.pending;
      var timeStr = formatTime(a.appointment_time);
      var dateStr = formatApptDate(a.appointment_date);
      var cancelBtn = a.status !== 'cancelled'
        ? '<button onclick="cancelAppointment(' + a.appointment_id + ')" class="appt-cancel-btn"><i class="fas fa-times"></i> Cancel</button>'
        : '';
      html += '<div class="appt-card-new" style="border-left:4px solid ' + m.color + '">'
        + '<div class="appt-card-left">'
        + '<div class="appt-avatar" style="background:linear-gradient(135deg,' + m.color + '22,' + m.color + '44)">'
        + '<i class="fas fa-user-md" style="color:' + m.color + ';font-size:1.4rem;"></i></div>'
        + '<div class="appt-info">'
        + '<h4>Dr. ' + a.dentist_name + '</h4>'
        + '<span class="appt-spec">' + (a.specialization || 'General Dentistry') + '</span>'
        + '<div class="appt-meta">'
        + '<span><i class="fas fa-calendar-alt"></i> ' + dateStr + '</span>'
        + '<span><i class="fas fa-clock"></i> ' + (timeStr || a.appointment_time) + '</span>'
        + '</div>'
        + (a.notes ? '<div class="appt-notes"><i class="fas fa-sticky-note"></i> ' + a.notes + '</div>' : '')
        + '</div></div>'
        + '<div class="appt-card-right">'
        + '<span class="appt-status-badge" style="background:' + m.bg + ';color:' + m.color + ';border:1px solid ' + m.border + '">'
        + '<i class="fas ' + m.icon + '"></i> ' + m.label + '</span>'
        + cancelBtn
        + '</div></div>';
    }
    container.innerHTML = html;
  } catch(err) {}
}

async function cancelAppointment(id) {
  if (!confirm('Cancel this appointment?')) return;
  await fetch(API + '/appointments/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ status: 'cancelled' }) });
  loadAppointmentHistory();
}

function loadDentistDashboard() {
  var n = document.getElementById('dentSidebarName'); if (n) n.textContent = userName || 'Dentist';
  loadDentistAppointments();
  // Pre-fill profile form with current data
  fetch(API + '/dentists', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(function(r) { return r.json(); })
    .then(function(list) {
      // match by name since we have userName
      var me = list.find(function(d) { return d.name === userName; });
      if (!me) return;
      if (document.getElementById('dSpecialization')) document.getElementById('dSpecialization').value = me.specialization || '';
      if (document.getElementById('dLocation')) document.getElementById('dLocation').value = me.location || '';
      if (document.getElementById('dAvailDays')) document.getElementById('dAvailDays').value = me.available_days || '';
      fillTimePicker(me.available_from, 'dFromHour', 'dFromMin', 'dFromAmPm');
      fillTimePicker(me.available_to,   'dToHour',   'dToMin',   'dToAmPm');
    }).catch(function() {});
}

async function loadDentistAppointments() {
  try {
    var res = await fetch(API + '/dentists/appointments', { headers: { 'Authorization': 'Bearer ' + token } });
    var appts = await res.json();
    var container = document.getElementById('dentistAppointments'); if (!container) return;
    if (!appts.length) {
      container.innerHTML = '<div class="appt-empty"><div style="font-size:3.5rem;margin-bottom:1rem;">📋</div><p>No appointments yet.</p><span>Patient bookings will appear here once received.</span></div>';
      return;
    }
    var statusMeta = {
      approved:  { color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', icon: 'fa-check-circle',  label: 'Approved'  },
      pending:   { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', icon: 'fa-hourglass-half', label: 'Pending'   },
      cancelled: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', icon: 'fa-times-circle',  label: 'Cancelled' }
    };
    var html = '';
    for (var i = 0; i < appts.length; i++) {
      var a = appts[i];
      var m = statusMeta[a.status] || statusMeta.pending;
      var dateStr = formatApptDate(a.appointment_date);
      var timeStr = formatTime(a.appointment_time);
      var patientInfo = [a.gender ? a.gender.charAt(0).toUpperCase() + a.gender.slice(1) : '', a.age ? a.age + ' yrs' : ''].filter(Boolean).join(', ');
      var actions = a.status === 'pending'
        ? '<button onclick="updateApptStatus(' + a.appointment_id + ',\'approved\')" class="dent-appt-approve"><i class="fas fa-check"></i> Approve</button>'
        + '<button onclick="updateApptStatus(' + a.appointment_id + ',\'cancelled\')" class="dent-appt-reject"><i class="fas fa-times"></i> Reject</button>'
        : '';
      html += '<div class="appt-card-new" style="border-left:4px solid ' + m.color + '">'
        + '<div class="appt-card-left">'
        + '<div class="appt-avatar" style="background:linear-gradient(135deg,' + m.color + '22,' + m.color + '44)">'
        + '<i class="fas fa-user" style="color:' + m.color + ';font-size:1.3rem;"></i></div>'
        + '<div class="appt-info">'
        + '<h4>' + a.patient_name + '</h4>'
        + (patientInfo ? '<span class="appt-spec">' + patientInfo + '</span>' : '')
        + '<div class="appt-meta">'
        + '<span><i class="fas fa-calendar-alt"></i> ' + dateStr + '</span>'
        + '<span><i class="fas fa-clock"></i> ' + (timeStr || a.appointment_time) + '</span>'
        + '</div>'
        + (a.notes ? '<div class="appt-notes"><i class="fas fa-sticky-note"></i> ' + a.notes + '</div>' : '')
        + '</div></div>'
        + '<div class="appt-card-right">'
        + '<span class="appt-status-badge" style="background:' + m.bg + ';color:' + m.color + ';border:1px solid ' + m.border + '">'
        + '<i class="fas ' + m.icon + '"></i> ' + m.label + '</span>'
        + (actions ? '<div class="dent-appt-actions">' + actions + '</div>' : '')
        + '</div></div>';
    }
    container.innerHTML = html;
  } catch(err) {}
}

async function updateApptStatus(id, status) {
  await fetch(API + '/dentists/appointments/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ status: status }) });
  loadDentistAppointments();
}

// Convert 12h picker values → "HH:MM:00" for backend
function pickerTo24h(hourId, minId, ampmId) {
  var h = parseInt(document.getElementById(hourId).value);
  var m = document.getElementById(minId).value;
  var ampm = document.getElementById(ampmId).value;
  if (!h || !m) return null;
  if (ampm === 'AM') { h = h === 12 ? 0 : h; }
  else { h = h === 12 ? 12 : h + 12; }
  return (h < 10 ? '0' + h : h) + ':' + m + ':00';
}

// Pre-fill 12h picker from "HH:MM:SS" string
function fillTimePicker(timeStr, hourId, minId, ampmId) {
  if (!timeStr) return;
  var parts = timeStr.split(':');
  var h = parseInt(parts[0]), m = parts[1];
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  document.getElementById(hourId).value = String(h);
  document.getElementById(minId).value = m;
  document.getElementById(ampmId).value = ampm;
}

async function updateDentistProfile(e) {
  e.preventDefault();
  var from = pickerTo24h('dFromHour', 'dFromMin', 'dFromAmPm');
  var to   = pickerTo24h('dToHour',   'dToMin',   'dToAmPm');
  if (!from || !to) return showMsg('profileMsg', 'Please set both From and To times.', 'error');
  var body = {
    specialization: document.getElementById('dSpecialization').value,
    location: document.getElementById('dLocation').value,
    available_days: document.getElementById('dAvailDays').value,
    available_from: from,
    available_to: to
  };
  var res = await fetch(API + '/dentists/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(body) });
  var data = await res.json();
  showMsg('profileMsg', data.message, res.ok ? 'success' : 'error');
}

async function loadAdminDashboard() {
  try {
    var res = await fetch(API + '/admin/dashboard', { headers: { 'Authorization': 'Bearer ' + token } });
    var s = await res.json();
    var el = document.getElementById('adminStats');
    if (el) el.innerHTML =
      statCard(s.total_dentists, 'Dentists',     'fas fa-user-md',      '#7c3aed', '#ede9fe', '#6d28d9') +
      statCard(s.total_patients,'Patients',      'fas fa-user',         '#0ea5e9', '#e0f2fe', '#0284c7') +
      statCard(s.total_appointments,'Appointments','fas fa-calendar-alt','#10b981', '#d1fae5', '#059669') +
      statCard(s.pending,       'Pending',       'fas fa-hourglass-half','#f59e0b', '#fef3c7', '#d97706') +
      statCard(s.approved,      'Approved',      'fas fa-check-circle', '#22c55e', '#dcfce7', '#16a34a') +
      statCard(s.cancelled,     'Cancelled',     'fas fa-times-circle', '#ef4444', '#fee2e2', '#dc2626');
  } catch(err) {}
}

function statCard(num, label, icon, color, bg, dark) {
  return '<div class="admin-stat-card" style="--sc:' + color + ';--sbg:' + bg + ';--sdk:' + dark + '">'
    + '<div class="admin-stat-icon"><i class="' + icon + '"></i></div>'
    + '<div class="admin-stat-info">'
    + '<div class="admin-stat-num">' + num + '</div>'
    + '<div class="admin-stat-label">' + label + '</div>'
    + '</div>'
    + '<div class="admin-stat-bar"></div>'
    + '</div>';
}

async function loadAdminDoctors() {
  try {
    var res = await fetch(API + '/admin/users', { headers: { 'Authorization': 'Bearer ' + token } });
    var users = await res.json();
    var doctors = users.filter(function(u) { return u.role === 'dentist'; });
    var el = document.getElementById('doctorsList'); if (!el) return;
    if (!doctors.length) { el.innerHTML = '<p style="color:#64748b;padding:2rem">No doctors registered yet.</p>'; return; }
    var rows = doctors.map(function(u, i) {
      var displayId = '#' + (i + 1);
      var del = '<button onclick="deleteUser(' + u.user_id + ')" class="btn-danger">Delete</button>';
      return '<tr><td>' + displayId + '</td><td>' + u.name + '</td><td>' + u.email + '</td><td>' + new Date(u.created_at).toLocaleDateString() + '</td><td>' + del + '</td></tr>';
    }).join('');
    el.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Doctor ID</th><th>Name</th><th>Email</th><th>Joined</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  } catch(err) {}
}

async function loadAdminPatients() {
  try {
    var res = await fetch(API + '/admin/users', { headers: { 'Authorization': 'Bearer ' + token } });
    var users = await res.json();
    var patients = users.filter(function(u) { return u.role === 'patient'; });
    var el = document.getElementById('patientsList'); if (!el) return;
    if (!patients.length) { el.innerHTML = '<p style="color:#64748b;padding:2rem">No patients registered yet.</p>'; return; }
    var rows = patients.map(function(u, i) {
      var del = '<button onclick="deletePatient(' + u.user_id + ',\'' + u.name + '\')" class="btn-danger"><i class="fas fa-trash-alt"></i> Delete</button>';
      return '<tr><td>#' + (i + 1) + '</td><td>' + u.name + '</td><td>' + u.email + '</td><td>' + new Date(u.created_at).toLocaleDateString() + '</td><td>' + del + '</td></tr>';
    }).join('');
    el.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Joined</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  } catch(err) {}
}

async function deletePatient(id, name) {
  if (!confirm('Delete patient "' + name + '" (ID #' + id + ')?\nThis will also remove their appointments.')) return;
  try {
    var res = await fetch(API + '/admin/users/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    var data = await res.json();
    if (res.ok) { loadAdminPatients(); loadAdminDashboard(); }
    else alert(data.message || 'Delete failed.');
  } catch(err) { alert('Connection error.'); }
}

async function loadAdminUsers() {
  try {
    var res = await fetch(API + '/admin/users', { headers: { 'Authorization': 'Bearer ' + token } });
    var users = await res.json();
    var el = document.getElementById('usersList'); if (!el) return;
    var rows = users.filter(function(u) { return u.role !== 'admin'; }).map(function(u) { var del = '<button onclick="deleteUser(' + u.user_id + ')" class="btn-danger">Delete</button>'; return '<tr><td>' + u.user_id + '</td><td>' + u.name + '</td><td>' + u.email + '</td><td><span class="badge badge-' + u.role + '">' + u.role + '</span></td><td>' + new Date(u.created_at).toLocaleDateString() + '</td><td>' + del + '</td></tr>'; }).join('');
    el.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  } catch(err) {}
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  await fetch(API + '/admin/users/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
  loadAdminUsers(); loadAdminDashboard();
}

async function loadAdminAppointments() {
  try {
    var res = await fetch(API + '/admin/appointments', { headers: { 'Authorization': 'Bearer ' + token } });
    var appts = await res.json();
    var el = document.getElementById('allAppointments'); if (!el) return;
    var rows = appts.map(function(a) {
      var dateStr = formatApptDate(a.appointment_date);
      var timeStr = formatTime(a.appointment_time) || a.appointment_time;
      return '<tr><td>' + a.appointment_id + '</td><td>' + a.patient_name + '</td><td>' + a.dentist_name + '</td><td>' + (a.specialization || '-') + '</td><td>' + dateStr + '</td><td>' + timeStr + '</td><td><span class="badge badge-' + a.status + '">' + a.status + '</span></td></tr>';
    }).join('');
    el.innerHTML = '<div class="table-wrap"><table><thead><tr><th>ID</th><th>Patient</th><th>Dentist</th><th>Specialization</th><th>Date</th><th>Time</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  } catch(err) {}
}


// REVIEWS
var selectedRating = 0;

function setRating(val) {
  selectedRating = val;
  document.getElementById('reviewRating').value = val;
  var stars = document.querySelectorAll('#starRating .star');
  stars.forEach(function(s, i) {
    s.style.color = i < val ? '#f59e0b' : '#d1d5db';
  });
}

async function submitReview(e) {
  e.preventDefault();
  var name = document.getElementById('reviewName').value;
  var rating = document.getElementById('reviewRating').value;
  var message = document.getElementById('reviewMessage').value;
  if (rating == 0) return showMsg('reviewMsg', 'Please select a star rating.', 'error');
  try {
    var res = await fetch(API + '/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, rating: parseInt(rating), message: message })
    });
    var data = await res.json();
    if (!res.ok) return showMsg('reviewMsg', data.message, 'error');
    showMsg('reviewMsg', 'Thank you for your review!', 'success');
    e.target.reset();
    selectedRating = 0;
    setRating(0);
    loadReviews();
  } catch(err) { showMsg('reviewMsg', 'Connection error.', 'error'); }
}

async function loadReviews() {
  try {
    var res = await fetch(API + '/reviews');
    var reviews = await res.json();
    var container = document.getElementById('reviewsList');
    if (!container) return;
    if (!reviews.length) {
      container.innerHTML = '<div class="review-empty"><i class="fas fa-star" style="font-size:2rem;color:#fbbf24;margin-bottom:0.75rem;display:block;"></i><p>No reviews yet. Be the first!</p></div>';
      return;
    }
    container.innerHTML = reviews.map(function(r) {
      var stars = '';
      for (var i = 1; i <= 5; i++) stars += '<span style="color:' + (i <= r.rating ? '#f59e0b' : '#e2e8f0') + ';font-size:1.1rem;">★</span>';
      var date = new Date(r.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
      var initials = r.name.split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
      var colors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
      var color = colors[r.name.charCodeAt(0) % colors.length];
      return '<div class="review-card">'
        + '<div class="review-card-top">'
        + '<div class="review-avatar" style="background:' + color + '">' + initials + '</div>'
        + '<div class="review-meta">'
        + '<strong>' + r.name + '</strong>'
        + '<div class="review-stars">' + stars + '</div>'
        + '</div>'
        + '<span class="review-date">' + date + '</span>'
        + '</div>'
        + '<p class="review-msg">"' + r.message + '"</p>'
        + '</div>';
    }).join('');
  } catch(err) {}
}

// Load reviews on page load if section is visible
document.addEventListener('DOMContentLoaded', function() {
  loadReviews();
});

// ══ CHATBOT ══
var chatOpen = false;

var chatKB = [
  { k: ['hello','hi','hey','good morning','good evening','good afternoon'], r: "Hi there! 👋 I'm DentBot, your dental assistant. How can I help you today?" },
  { k: ['book','appointment','schedule','reserve'], r: "To book an appointment:\n1. Register or Login\n2. Go to your dashboard\n3. Select a dentist & pick a date/time\n4. Confirm your booking! 📅" },
  { k: ['register','sign up','create account','new account'], r: "Click the Register button in the top navbar. Fill in your name, email, password, and choose your role (Patient or Dentist). It only takes a minute! 😊" },
  { k: ['login','sign in','log in'], r: "Click the Login button in the navbar, enter your email and password, and you're in! 🔐" },
  { k: ['dentist','doctor','specialist','find dentist','search dentist'], r: "Head to the Dentists page from the navbar. You can search by location to find verified dental professionals near you! 🔍" },
  { k: ['location','near me','city','area'], r: "Use the Search by Location box on the Dentists page. Type your city or area and matching dentists will appear instantly! 📍" },
  { k: ['cancel','cancellation','cancel appointment'], r: "You can cancel an appointment from your Patient Dashboard → My Appointments. Click the Cancel button next to the appointment. ❌" },
  { k: ['status','approved','pending','appointment status'], r: "Your appointment status can be Pending (waiting for dentist approval), Approved ✅, or Cancelled ❌. Check your dashboard for updates." },
  { k: ['cost','price','fee','charge','free'], r: "DentAssist is free to use for booking appointments! Consultation fees depend on the individual dentist. 💰" },
  { k: ['time','hours','working hours','available','timing'], r: "Our platform is available 24/7 for bookings. Dentists are available Mon–Sun: 7AM – 10PM. ⏰" },
  { k: ['contact','phone','email','address','reach'], r: "📞 +91 8928099534\n📧 tanushree09910@gmail.com\n📍 Dental Appointment Centre\n⏰ Mon–Sun: 7AM – 10PM" },
  { k: ['service','treatment','specialization','orthodontics','cosmetic','implant','whitening'], r: "We connect you with dentists across all specializations:\n• General Dentistry\n• Cosmetic Dentistry\n• Orthodontics\n• Dental Implants\n• Pediatric Dentistry\n• Oral Surgery 🦷" },
  { k: ['pain','toothache','emergency','urgent'], r: "For dental emergencies, please call us at +91 8928099534 immediately. For non-urgent issues, book an appointment through the platform. 🚨" },
  { k: ['password','forgot password','reset'], r: "Currently, please contact us at tanushree09910@gmail.com to reset your password. We're working on a self-service reset feature! 🔑" },
  { k: ['review','rating','feedback','testimonial'], r: "You can leave a review on our Home page! Scroll down to the Reviews section, rate your experience, and share your feedback. ⭐" },
  { k: ['about','who are you','what is dent assist','dentassist'], r: "DentAssist is a premium dental appointment platform connecting patients with verified dental professionals. We make dental care accessible, fast, and stress-free! 😁" },
  { k: ['thank','thanks','thank you','great','awesome','perfect'], r: "You're welcome! 😊 Is there anything else I can help you with?" },
  { k: ['bye','goodbye','see you','exit'], r: "Goodbye! Take care of your smile! 🦷✨ Feel free to chat anytime." },
];

var suggestions = ['Book Appointment', 'Find Dentist', 'Contact Info', 'Our Services', 'Cancel Appointment'];

function toggleChat() {
  chatOpen = !chatOpen;
  var box = document.getElementById('chatbot-box');
  var icon = document.getElementById('chatBubbleIcon');
  if (chatOpen) {
    box.classList.add('open');
    icon.className = 'fas fa-times';
    if (!document.getElementById('chatMessages').children.length) {
      appendMsg('bot', "👋 Hi! I'm DentBot. Ask me anything about dental care or booking appointments!");
      renderSuggestions();
    }
    setTimeout(function() { document.getElementById('chatInput').focus(); }, 100);
  } else {
    box.classList.remove('open');
    icon.className = 'fas fa-comment-dots';
  }
}

function appendMsg(type, text) {
  var msgs = document.getElementById('chatMessages');
  var div = document.createElement('div');
  div.className = 'chat-msg ' + type;
  div.innerHTML = text.replace(/\n/g, '<br/>');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function renderSuggestions() {
  var el = document.getElementById('chatSuggestions');
  el.innerHTML = suggestions.map(function(s) {
    return '<button class="chat-chip" onclick="chipClick(\'' + s + '\')">' + s + '</button>';
  }).join('');
}

function chipClick(text) {
  document.getElementById('chatInput').value = text;
  sendChat();
}

function getBotReply(msg) {
  var lower = msg.toLowerCase();
  for (var i = 0; i < chatKB.length; i++) {
    for (var j = 0; j < chatKB[i].k.length; j++) {
      if (lower.indexOf(chatKB[i].k[j]) !== -1) return chatKB[i].r;
    }
  }
  return "I'm not sure about that, but I'm here to help with dental appointments! 😊 Try asking about booking, dentists, services, or contact info. Or reach us at tanushree09910@gmail.com.";
}

function sendChat() {
  var input = document.getElementById('chatInput');
  var msg = input.value.trim();
  if (!msg) return;
  appendMsg('user', msg);
  input.value = '';
  document.getElementById('chatSuggestions').innerHTML = '';

  var msgs = document.getElementById('chatMessages');
  var typing = document.createElement('div');
  typing.className = 'chat-msg bot typing';
  typing.id = 'typingIndicator';
  typing.textContent = 'DentBot is typing...';
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  fetch(API + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    var t = document.getElementById('typingIndicator');
    if (t) t.remove();
    var reply = data.reply || "Sorry, couldn't get a response.";
    appendMsg('bot', reply);
    renderSuggestions();
  })
  .catch(function() {
    var t = document.getElementById('typingIndicator');
    if (t) t.remove();
    appendMsg('bot', "Sorry, I'm having trouble connecting. Please try again!");
    renderSuggestions();
  });
}
