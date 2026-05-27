const Database = require("better-sqlite3");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const DB_PATH = process.env.DB_PATH || "./bookleaf.db";

let db;

function getDb() {
  if (!db) {
    db = new Database(path.resolve(DB_PATH));
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('author', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      title TEXT NOT NULL,
      isbn TEXT UNIQUE NOT NULL,
      genre TEXT NOT NULL,
      publication_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'Published',
      mrp REAL NOT NULL,
      copies_sold INTEGER DEFAULT 0,
      royalty_rate REAL DEFAULT 0.10,
      royalty_paid REAL DEFAULT 0.0,
      cover_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      book_id TEXT,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','In Progress','Resolved','Closed')),
      category TEXT DEFAULT 'General Inquiry',
      priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Critical','High','Medium','Low')),
      ai_category TEXT,
      ai_priority TEXT,
      assigned_to TEXT,
      attachment_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_role TEXT NOT NULL CHECK(sender_role IN ('author', 'admin')),
      message TEXT NOT NULL,
      is_internal_note INTEGER DEFAULT 0,
      ai_drafted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_author ON tickets(author_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_messages_ticket ON ticket_messages(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_id);
  `);

  const userColumns = db
    .prepare("PRAGMA table_info(users);")
    .all()
    .map((col) => col.name);
  if (!userColumns.includes("created_at")) {
    db.exec(
      "ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
    );
  }
}

module.exports = { getDb };
