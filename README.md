# Dent Assist – Online Dental Appointment System

## Setup

### 1. Database
- Open MySQL (XAMPP or any MySQL client)
- Run `database.sql` to create the database and tables
- Default admin login: `admin@dentassist.com` / `admin123`

### 2. Backend
```bash
cd backend
npm install
# Edit .env with your MySQL credentials
npm start
```
Server runs on http://localhost:5000

### 3. Frontend
Open `frontend/index.html` in a browser.
(Or use Live Server extension in VS Code)

## Tech Stack
- Frontend: HTML, CSS, JavaScript (Vanilla)
- Backend: Node.js + Express
- Database: MySQL

## Roles
- **Patient** – Register, book/cancel appointments, view history
- **Dentist** – View appointments, approve/reject, update profile
- **Admin** – Dashboard stats, manage users, view all appointments
