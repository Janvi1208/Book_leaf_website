const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { getDb } = require("./database");

async function importSample(filePath) {
  const full = path.resolve(
    filePath || path.join(__dirname, "..", "..", "data", "sample_data.json"),
  );
  if (!fs.existsSync(full)) {
    console.error("Sample data file not found:", full);
    process.exit(1);
  }

  const raw = fs.readFileSync(full, "utf8");
  const data = JSON.parse(raw);
  const db = getDb();

  const authors = data.authors || [];
  const authorIds = authors.map((a) => a.author_id);

  const pwHash = await bcrypt.hash("author123", 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, created_at)
    VALUES (?, ?, ?, ?, 'author', ?)
  `);

  const insertBook = db.prepare(`
    INSERT INTO books (id, author_id, title, isbn, genre, publication_date, status, mrp, copies_sold, royalty_rate, royalty_paid, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    db.exec("BEGIN");

    // Remove existing books and tickets/messages for these authors (idempotent)
    if (authorIds.length) {
      const idsPlaceholders = authorIds.map(() => "?").join(",");
      db.prepare(
        `DELETE FROM ticket_messages WHERE ticket_id IN (SELECT id FROM tickets WHERE author_id IN (${idsPlaceholders}))`,
      ).run(...authorIds);
      db.prepare(
        `DELETE FROM tickets WHERE author_id IN (${idsPlaceholders})`,
      ).run(...authorIds);
      db.prepare(
        `DELETE FROM books WHERE author_id IN (${idsPlaceholders})`,
      ).run(...authorIds);
      db.prepare(`DELETE FROM users WHERE id IN (${idsPlaceholders})`).run(
        ...authorIds,
      );
    }

    for (const a of authors) {
      const createdAt = a.joined_date || null;
      insertUser.run(a.author_id, a.email, pwHash, a.name, createdAt);

      for (const b of a.books || []) {
        const royaltyRate =
          b.author_royalty_per_copy && b.mrp
            ? b.author_royalty_per_copy / b.mrp
            : 0.1;
        const publicationDate =
          b.publication_date || new Date().toISOString().slice(0, 10);
        insertBook.run(
          b.book_id,
          a.author_id,
          b.title,
          b.isbn || "",
          b.genre || "General",
          publicationDate,
          b.status ? b.status.split(" ")[0] : "Published",
          b.mrp || 0,
          b.total_copies_sold || 0,
          royaltyRate,
          b.royalty_paid || 0,
          publicationDate,
        );
      }
    }

    db.exec("COMMIT");
    console.log("✅ Sample data imported successfully");
    console.log(`Inserted ${authors.length} authors`);
  } catch (err) {
    db.exec("ROLLBACK");
    console.error("Import failed:", err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  const arg = process.argv[2];
  importSample(arg).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { importSample };
