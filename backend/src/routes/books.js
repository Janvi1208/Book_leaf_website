const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { getMyBooks, getAllBooks } = require('../controllers/booksController');

const router = express.Router();

/**
 * GET /api/books/my
 * Author's own books with royalty calculations
 */
router.get('/my', authenticate, getMyBooks);

/**
 * GET /api/books
 * All books (admin only)
 */
router.get('/', authenticate, requireAdmin, getAllBooks);

module.exports = router;
