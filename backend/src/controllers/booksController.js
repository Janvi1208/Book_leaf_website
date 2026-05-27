const { getDb } = require('../db/database');

function getMyBooks(req, res) {
  const db = getDb();
  const books = db.prepare(`
    SELECT
      b.*,
      ROUND(b.copies_sold * b.mrp * b.royalty_rate, 2) AS total_royalty_earned,
      ROUND(b.copies_sold * b.mrp * b.royalty_rate - b.royalty_paid, 2) AS royalty_pending
    FROM books b
    WHERE b.author_id = ?
    ORDER BY b.publication_date DESC
  `).all(req.user.id);

  res.json(books);
}

function getAllBooks(req, res) {
  const db = getDb();
  const books = db.prepare(`
    SELECT b.*, u.name AS author_name,
      ROUND(b.copies_sold * b.mrp * b.royalty_rate, 2) AS total_royalty_earned,
      ROUND(b.copies_sold * b.mrp * b.royalty_rate - b.royalty_paid, 2) AS royalty_pending
    FROM books b
    JOIN users u ON b.author_id = u.id
    ORDER BY b.created_at DESC
  `).all();

  res.json(books);
}

module.exports = { getMyBooks, getAllBooks };
