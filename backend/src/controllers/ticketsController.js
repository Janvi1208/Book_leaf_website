const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../db/database");
const {
  classifyTicket,
  generateDraftResponse,
} = require("../services/aiService");
const { validationResult } = require("express-validator");

// ─── Author: Create ticket ───────────────────────────────────────────────────
async function createTicket(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { book_id, subject, description } = req.body;
  const db = getDb();

  // If book_id provided, verify it belongs to this author
  if (book_id) {
    const book = db
      .prepare("SELECT id FROM books WHERE id = ? AND author_id = ?")
      .get(book_id, req.user.id);
    if (!book)
      return res.status(403).json({ error: "Book not found or not yours" });
  }

  const ticketId = uuidv4();

  // Insert ticket first (so author doesn't wait for AI)
  db.prepare(
    `
    INSERT INTO tickets (id, author_id, book_id, subject, description, ai_category, ai_priority)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    ticketId,
    req.user.id,
    book_id || null,
    subject,
    description,
    "General Inquiry",
    "Medium",
  );

  // AI classification async (don't block response)
  classifyTicket(subject, description)
    .then(({ category, priority, ai_used }) => {
      db.prepare(
        `
      UPDATE tickets SET category = ?, priority = ?, ai_category = ?, ai_priority = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      ).run(category, priority, category, priority, ticketId);
    })
    .catch((err) =>
      console.error("Background classification failed:", err.message),
    );

  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
  res.status(201).json(ticket);
}

// ─── Author: Get my tickets ──────────────────────────────────────────────────
function getMyTickets(req, res) {
  const db = getDb();
  const tickets = db
    .prepare(
      `
    SELECT t.*, b.title AS book_title
    FROM tickets t
    LEFT JOIN books b ON t.book_id = b.id
    WHERE t.author_id = ?
    ORDER BY t.created_at DESC
  `,
    )
    .all(req.user.id);

  res.json(tickets);
}

// ─── Author: Get single ticket with messages ─────────────────────────────────
function getTicket(req, res) {
  const db = getDb();
  const { id } = req.params;

  const ticket = db
    .prepare(
      `
    SELECT t.*, b.title AS book_title, u.name AS author_name
    FROM tickets t
    LEFT JOIN books b ON t.book_id = b.id
    JOIN users u ON t.author_id = u.id
    WHERE t.id = ?
  `,
    )
    .get(id);

  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  // Authors can only see their own tickets
  if (req.user.role === "author" && ticket.author_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Messages: authors don't see internal notes
  const isAdmin = req.user.role === "admin";
  const messages = db
    .prepare(
      `
    SELECT m.*, u.name AS sender_name
    FROM ticket_messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.ticket_id = ?
    ${isAdmin ? "" : "AND m.is_internal_note = 0"}
    ORDER BY m.created_at ASC
  `,
    )
    .all(id);

  res.json({ ...ticket, messages });
}

// ─── Admin: Get all tickets ──────────────────────────────────────────────────
function getAllTickets(req, res) {
  const db = getDb();
  const {
    status,
    category,
    priority,
    author_id,
    sort = "created_at",
    order = "DESC",
  } = req.query;

  let where = [];
  let params = [];

  if (status) {
    where.push("t.status = ?");
    params.push(status);
  }
  if (category) {
    where.push("t.category = ?");
    params.push(category);
  }
  if (priority) {
    where.push("t.priority = ?");
    params.push(priority);
  }
  if (author_id) {
    where.push("t.author_id = ?");
    params.push(author_id);
  }

  const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

  // Whitelist sort columns
  const safeSorts = {
    created_at: "t.created_at",
    updated_at: "t.updated_at",
    priority:
      "CASE t.priority WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END",
  };
  const sortExpr = safeSorts[sort] || "t.created_at";
  const safeOrder =
    typeof order === "string" && order.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const tickets = db
    .prepare(
      `
    SELECT t.*, u.name AS author_name, b.title AS book_title,
      a.name AS assigned_to_name
    FROM tickets t
    JOIN users u ON t.author_id = u.id
    LEFT JOIN books b ON t.book_id = b.id
    LEFT JOIN users a ON t.assigned_to = a.id
    ${whereClause}
    ORDER BY ${sortExpr} ${safeOrder}
  `,
    )
    .all(...params);

  res.json(tickets);
}

// ─── Admin: Update ticket (status, priority, category, assign) ───────────────
function updateTicket(req, res) {
  const db = getDb();
  const { id } = req.params;
  const { status, priority, category, assigned_to } = req.body;

  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const updates = [];
  const params = [];

  if (status) {
    updates.push("status = ?");
    params.push(status);
  }
  if (priority) {
    updates.push("priority = ?");
    params.push(priority);
  }
  if (category) {
    updates.push("category = ?");
    params.push(category);
  }
  if (assigned_to !== undefined) {
    updates.push("assigned_to = ?");
    params.push(assigned_to || null);
  }

  if (updates.length === 0)
    return res.status(400).json({ error: "No valid fields to update" });

  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  db.prepare(`UPDATE tickets SET ${updates.join(", ")} WHERE id = ?`).run(
    ...params,
  );
  const updated = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  res.json(updated);
}

// ─── Send a message on a ticket ──────────────────────────────────────────────
function sendMessage(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const db = getDb();
  const { id } = req.params;
  const { message, is_internal_note = false } = req.body;

  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  // Authors can only message their own tickets, and cannot post internal notes
  if (req.user.role === "author") {
    if (ticket.author_id !== req.user.id)
      return res.status(403).json({ error: "Access denied" });
    if (is_internal_note)
      return res
        .status(403)
        .json({ error: "Authors cannot post internal notes" });
  }

  const msgId = uuidv4();
  db.prepare(
    `
    INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, message, is_internal_note)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(
    msgId,
    id,
    req.user.id,
    req.user.role,
    message,
    is_internal_note ? 1 : 0,
  );

  // Auto-update status when admin responds
  if (
    req.user.role === "admin" &&
    !is_internal_note &&
    ticket.status === "Open"
  ) {
    db.prepare(
      `UPDATE tickets SET status = 'In Progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    ).run(id);
  }

  const msg = db
    .prepare(
      `
    SELECT m.*, u.name AS sender_name FROM ticket_messages m
    JOIN users u ON m.sender_id = u.id WHERE m.id = ?
  `,
    )
    .get(msgId);

  res.status(201).json(msg);
}

// ─── Admin: Get AI draft response ────────────────────────────────────────────
async function getDraftResponse(req, res) {
  const db = getDb();
  const { id } = req.params;

  const ticket = db
    .prepare(
      `
    SELECT t.*, u.name AS author_name FROM tickets t
    JOIN users u ON t.author_id = u.id WHERE t.id = ?
  `,
    )
    .get(id);

  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const book = ticket.book_id
    ? db.prepare("SELECT * FROM books WHERE id = ?").get(ticket.book_id)
    : null;

  const result = await generateDraftResponse(
    ticket,
    { name: ticket.author_name },
    book,
  );
  res.json(result);
}

// ─── Admin: Get ticket stats ──────────────────────────────────────────────────
function getStats(req, res) {
  const db = getDb();

  const statusCounts = db
    .prepare(
      `
    SELECT status, COUNT(*) as count FROM tickets GROUP BY status
  `,
    )
    .all();

  const categoryCounts = db
    .prepare(
      `
    SELECT category, COUNT(*) as count FROM tickets GROUP BY category ORDER BY count DESC
  `,
    )
    .all();

  const priorityCounts = db
    .prepare(
      `
    SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority
  `,
    )
    .all();

  const totalTickets = db
    .prepare("SELECT COUNT(*) as count FROM tickets")
    .get();
  const openTickets = db
    .prepare(
      "SELECT COUNT(*) as count FROM tickets WHERE status NOT IN ('Resolved', 'Closed')",
    )
    .get();

  res.json({
    statusCounts,
    categoryCounts,
    priorityCounts,
    totalTickets: totalTickets.count,
    openTickets: openTickets.count,
  });
}

module.exports = {
  createTicket,
  getMyTickets,
  getTicket,
  getAllTickets,
  updateTicket,
  sendMessage,
  getDraftResponse,
  getStats,
};
