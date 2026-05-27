require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const booksRoutes = require("./routes/books");
const ticketsRoutes = require("./routes/tickets");

const app = express();

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────

function normalizeOrigin(url) {
  if (!url) return url;

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(url)) {
    return `http://${url}`;
  }

  return `https://${url}`;
}

const frontendOrigin =
  normalizeOrigin(process.env.FRONTEND_URL) || "http://localhost:3000";

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Dev request logger
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ─────────────────────────────────────────────────────────────
// Root Route
// ─────────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "🍃 BookLeaf Backend Running",
    environment: process.env.NODE_ENV || "development",
    health: "/api/health",
  });
});

// ─────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/tickets", ticketsRoutes);

// Health Check

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

// ─────────────────────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error("Unhandled Error:", err);

  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ─────────────────────────────────────────────────────────────
// Server Start
// ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const aiKey = process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY;

app.listen(PORT, () => {
  console.log(`\n🍃 BookLeaf API running on http://localhost:${PORT}`);

  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

  console.log(
    `AI: ${aiKey ? "✓ Configured" : "✗ Not configured (manual mode)"}\n`,
  );
});

module.exports = app;
