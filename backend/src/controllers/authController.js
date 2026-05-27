const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../db/database");
const { validationResult } = require("express-validator");

function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const db = getDb();

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}

function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;
  const db = getDb();
  const normalizedEmail = email.toLowerCase().trim();
  const trimmedName = name.trim();

  const existingUser = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalizedEmail);
  if (existingUser) {
    return res.status(409).json({ error: "Email is already registered" });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  const role = "author";

  try {
    db.prepare(
      "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)",
    ).run(id, normalizedEmail, passwordHash, trimmedName, role);
  } catch (err) {
    console.error("Register error:", err);
    if (err.message.includes("UNIQUE constraint failed: users.email")) {
      return res.status(409).json({ error: "Email is already registered" });
    }
    return res.status(500).json({ error: "Could not create user" });
  }

  const token = jwt.sign(
    { id, email: normalizedEmail, name: trimmedName, role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  res.status(201).json({
    token,
    user: { id, email: normalizedEmail, name: trimmedName, role },
  });
}

function getMe(req, res) {
  const db = getDb();
  const user = db
    .prepare("SELECT id, email, name, role, created_at FROM users WHERE id = ?")
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
}

module.exports = { login, register, getMe };
