Clinic appointment system 
const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Database(
  path.join(__dirname, "data", "clinic.db")
);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    doctor TEXT NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Booked',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/appointments", (req, res) => {
  const appointments = db.prepare(`
    SELECT * FROM appointments
    ORDER BY appointment_date ASC, appointment_time ASC
  `).all();

  res.json(appointments);
});

app.post("/api/appointments", (req, res) => {
  const {
    patient_name,
    phone,
    email,
    doctor,
    appointment_date,
    appointment_time,
    reason
  } = req.body;

  if (
    !patient_name ||
    !phone ||
    !email ||
    !doctor ||
    !appointment_date ||
    !appointment_time ||
    !reason
  ) {
    return res.status(400).json({
      error: "Please complete all fields."
    });
  }

  const existing = db.prepare(`
    SELECT id FROM appointments
    WHERE doctor = ?
    AND appointment_date = ?
    AND appointment_time = ?
    AND status = 'Booked'
  `).get(
    doctor,
    appointment_date,
    appointment_time
  );

  if (existing) {
    return res.status(409).json({
      error: "That appointment slot is already booked."
    });
  }

  const result = db.prepare(`
    INSERT INTO appointments
    (
      patient_name,
      phone,
      email,
      doctor,
      appointment_date,
      appointment_time,
      reason
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    patient_name,
    phone,
    email,
    doctor,
    appointment_date,
    appointment_time,
    reason
  );

  res.status(201).json({
    message: "Appointment booked successfully.",
    id: result.lastInsertRowid
  });
});

app.delete("/api/appointments/:id", (req, res) => {
  const result = db.prepare(
    "DELETE FROM appointments WHERE id = ?"
  ).run(req.params.id);

  if (!result.changes) {
    return res.status(404).json({
      error: "Appointment not found."
    });
  }

  res.json({
    message: "Appointment cancelled."
  });
});

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

app.listen(PORT, () => {
  console.log(
    `Clinic Appointment System running on port ${PORT}`
  );
});
