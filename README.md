# 🍃 BookLeaf Author Support & Communication Portal

Updated / maintained by Janvi — May 2026

A full-stack web application for managing author support queries with AI-powered classification, prioritization, and response drafting.

---

## Tech Stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Backend  | Node.js + Express                           |
| Database | SQLite (via better-sqlite3)                 |
| Frontend | React 18 + React Router v6                  |
| AI       | Anthropic Claude (claude-sonnet-4-20250514) |
| Auth     | JWT (jsonwebtoken + bcryptjs)               |

**Why Anthropic Claude?** Claude's long context window handles the full knowledge base in one prompt without chunking. The claude-sonnet-4-20250514 model provides excellent instruction-following for structured JSON outputs (classification) and natural, empathetic response drafting — key for a support product.

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set ANTHROPIC_API_KEY and JWT_SECRET
npm run seed    # Creates DB and seeds demo data
npm run dev     # Starts on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start       # Starts on http://localhost:3000
```

### Demo Credentials

| Role     | Email              | Password  |
| -------- | ------------------ | --------- |
| Admin    | admin@bookleaf.com | admin123  |
| Author 1 | arjun@example.com  | author123 |
| Author 2 | kavya@example.com  | author123 |

---

## Environment Variables

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_strong_secret_here
ANTHROPIC_API_KEY=sk-ant-...       # From https://console.anthropic.com
DB_PATH=./bookleaf.db
FRONTEND_URL=http://localhost:3000
```

⚠️ **Never commit `.env`**. The `.env.example` file is safe to commit.

---

## Project Structure

```
bookleaf/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express entry point
│   │   ├── config/
│   │   │   └── knowledgeBase.js   # BookLeaf KB for AI context
│   │   ├── db/
│   │   │   ├── database.js        # SQLite init + schema
│   │   │   └── seed.js            # Demo data seeder
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT + role middleware
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── booksController.js
│   │   │   └── ticketsController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── books.js
│   │   │   └── tickets.js
│   │   └── services/
│   │       └── aiService.js       # Anthropic integration
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── App.js                 # Routes + role guards
    │   ├── index.js
    │   ├── index.css              # Global styles
    │   ├── context/AuthContext.js
    │   ├── services/api.js        # Axios API layer
    │   ├── components/Sidebar.js
    │   └── pages/
    │       ├── LoginPage.js
    │       ├── author/
    │       │   ├── AuthorBooks.js
    │       │   ├── AuthorTickets.js
    │       │   ├── SubmitTicket.js
    │       │   └── TicketDetail.js
    │       └── admin/
    │           ├── AdminDashboard.js
    │           ├── AdminTickets.js
    │           ├── AdminBooks.js
    │           └── (uses TicketDetail.js)
    └── package.json
```

---

## API Documentation

**Base URL:** `http://localhost:5000/api`

All protected endpoints require: `Authorization: Bearer <token>`

---

### Authentication

#### `POST /auth/login`

Login with email and password.

**Body:**

```json
{ "email": "arjun@example.com", "password": "author123" }
```

**Response:**

```json
{
  "token": "eyJ...",
  "user": {
    "id": "...",
    "email": "...",
    "name": "Arjun Mehta",
    "role": "author"
  }
}
```

#### `GET /auth/me`

🔒 Returns current user from token.

---

### Books

#### `GET /books/my`

🔒 Author only. Returns the authenticated author's books with royalty calculations.

**Response:** Array of book objects including:

- `total_royalty_earned` — copies_sold × mrp × royalty_rate
- `royalty_pending` — total_earned − royalty_paid

#### `GET /books`

🔒 Admin only. Returns all books across all authors.

---

### Tickets

#### `POST /tickets`

🔒 Author only. Create a new ticket.

**Body:**

```json
{
  "subject": "Royalty payment missing for Q3",
  "description": "I have not received...",
  "book_id": "optional-book-uuid"
}
```

**Notes:** AI classification runs asynchronously in the background — it does not block ticket creation.

#### `GET /tickets/my`

🔒 Author only. Returns all tickets for the authenticated author.

#### `GET /tickets`

🔒 Admin only. Returns all tickets with optional filters.

**Query params:**

- `status` — Open | In Progress | Resolved | Closed
- `category` — e.g. "Royalty & Payments"
- `priority` — Critical | High | Medium | Low
- `sort` — created_at | updated_at | priority (default: created_at)
- `order` — ASC | DESC

#### `GET /tickets/stats`

🔒 Admin only. Returns count breakdowns by status, category, and priority.

#### `GET /tickets/:id`

🔒 Authors can only access their own tickets. Admins access all.

Returns ticket object + `messages` array. Authors do not see internal notes.

#### `PATCH /tickets/:id`

🔒 Admin only. Update ticket fields.

**Body (all optional):**

```json
{
  "status": "In Progress",
  "priority": "High",
  "category": "Royalty & Payments",
  "assigned_to": "admin-user-uuid"
}
```

#### `POST /tickets/:id/messages`

🔒 Send a message. Authors cannot post internal notes.

**Body:**

```json
{
  "message": "We are looking into this...",
  "is_internal_note": false
}
```

**Side effect:** If an admin sends a non-internal reply to an Open ticket, it auto-transitions to "In Progress".

#### `GET /tickets/:id/draft`

🔒 Admin only. Returns AI-generated draft response.

**Response:**

```json
{
  "draft": "Hi Arjun, thank you for reaching out...",
  "ai_used": true
}
```

If AI is unavailable:

```json
{
  "draft": null,
  "ai_used": false,
  "error": "AI service not configured. Please write a response manually."
}
```

---

## AI Integration Design

### Model

`claude-sonnet-4-20250514` — Strong instruction-following, good JSON output, excellent long-context handling.

### Classification Prompt (Cost-efficient)

- Single API call per ticket: classifies category AND priority simultaneously
- Input: subject + description only (not full history — keeps tokens low)
- Output: strict JSON `{"category": "...", "priority": "...", "reasoning": "..."}`
- Max tokens: 200

### Response Draft Prompt (Targeted context)

- Sends: ticket subject/description + AI category/priority + book metadata (if applicable) + full knowledge base
- Does NOT send: full ticket history (the KB already covers policy; history adds cost without benefit for initial drafts)
- Max tokens: 600
- The draft is editable by the admin before sending

### Graceful Degradation

If `ANTHROPIC_API_KEY` is not set or the API is down:

- Ticket creation still works (classification skipped or uses heuristics)
- Heuristic fallbacks (regex-based keyword matching) classify tickets locally
- Draft endpoint returns `{ draft: null, error: "..." }` — admin writes manually
- No ticket is ever lost due to AI failure

### API Key Security

- Keys are read from `process.env` only
- Never sent to the frontend
- The frontend never calls the Anthropic API directly
- `.env` is in `.gitignore`

---

## Role-Based Access Control

| Action                        | Author | Admin |
| ----------------------------- | ------ | ----- |
| View own books                | ✅     | —     |
| View all books                | —      | ✅    |
| Create ticket                 | ✅     | —     |
| View own tickets              | ✅     | —     |
| View all tickets              | —      | ✅    |
| Filter ticket queue           | —      | ✅    |
| View internal notes           | ❌     | ✅    |
| Post internal notes           | ❌     | ✅    |
| Update ticket status/priority | ❌     | ✅    |
| Get AI draft                  | —      | ✅    |
| Override AI classification    | —      | ✅    |
| View stats/dashboard          | —      | ✅    |

---

## Real-time Updates

The frontend polls `GET /tickets/my` and `GET /tickets/:id` every 15 seconds. This provides near-real-time updates (author sees admin replies without manual refresh) without requiring WebSockets.

---

## Database Schema

```sql
users (id, email, password_hash, name, role, created_at)
books (id, author_id, title, isbn, genre, publication_date, status, mrp, copies_sold, royalty_rate, royalty_paid, ...)
tickets (id, author_id, book_id, subject, description, status, category, priority, ai_category, ai_priority, assigned_to, ...)
ticket_messages (id, ticket_id, sender_id, sender_role, message, is_internal_note, ai_drafted, created_at)
```

---

## Design Decisions

1. **SQLite over PostgreSQL**: Zero-config for evaluation purposes. Swap `better-sqlite3` for `pg` for production.
2. **Background AI classification**: Ticket creation is instant; AI runs async so authors aren't waiting on the Anthropic API.
3. **Heuristic fallback**: Regex-based classification ensures tickets are always categorized even without AI.
4. **Minimal token usage**: Classification uses only subject+description (not full KB). Draft uses KB but not full history. A 50-ticket thread doesn't balloon costs.
5. **JWT expiry**: 24h tokens — long enough for a workday, short enough for security.

---

Made by Janvi — May 2026
