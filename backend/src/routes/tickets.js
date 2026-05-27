const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  createTicket, getMyTickets, getTicket,
  getAllTickets, updateTicket, sendMessage, getDraftResponse, getStats
} = require('../controllers/ticketsController');

const router = express.Router();

// ─── Author routes ────────────────────────────────────────────────────────────

/**
 * POST /api/tickets
 * Create a new support ticket
 */
router.post('/', authenticate, [
  body('subject').trim().notEmpty().isLength({ max: 200 }).withMessage('Subject required (max 200 chars)'),
  body('description').trim().notEmpty().isLength({ min: 10 }).withMessage('Description required (min 10 chars)')
], createTicket);

/**
 * GET /api/tickets/my
 * Get current author's tickets
 */
router.get('/my', authenticate, getMyTickets);

// ─── Admin routes ─────────────────────────────────────────────────────────────

/**
 * GET /api/tickets/stats
 * Ticket statistics dashboard (admin only)
 */
router.get('/stats', authenticate, requireAdmin, getStats);

/**
 * GET /api/tickets
 * All tickets with filters: ?status=Open&category=...&priority=...&sort=priority
 * (admin only)
 */
router.get('/', authenticate, requireAdmin, getAllTickets);

/**
 * PATCH /api/tickets/:id
 * Update ticket status/priority/category/assignment (admin only)
 */
router.patch('/:id', authenticate, requireAdmin, [
  body('status').optional().isIn(['Open','In Progress','Resolved','Closed']),
  body('priority').optional().isIn(['Critical','High','Medium','Low']),
], updateTicket);

/**
 * GET /api/tickets/:id/draft
 * Get AI-generated draft response (admin only)
 */
router.get('/:id/draft', authenticate, requireAdmin, getDraftResponse);

// ─── Shared routes ────────────────────────────────────────────────────────────

/**
 * GET /api/tickets/:id
 * Get ticket + messages (authors: own only; admins: all)
 */
router.get('/:id', authenticate, getTicket);

/**
 * POST /api/tickets/:id/messages
 * Send a message on a ticket
 */
router.post('/:id/messages', authenticate, [
  body('message').trim().notEmpty().withMessage('Message cannot be empty')
], sendMessage);

module.exports = router;
