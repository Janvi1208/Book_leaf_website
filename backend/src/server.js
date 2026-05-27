require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const booksRoutes = require("./routes/books");
const ticketsRoutes = require("./routes/tickets");

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logger (dev)
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/tickets", ticketsRoutes);

// Health check
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const aiKey = process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY;
app.listen(PORT, () => {
  console.log(`\n🍃 BookLeaf API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `   AI: ${aiKey ? "✓ Configured" : "✗ Not configured (manual mode)"}\n`,
  );
});

module.exports = app;
