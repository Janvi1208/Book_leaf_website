const express = require("express");
const { body } = require("express-validator");
const { login, register, getMe } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  register,
);

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  login,
);

/**
 * GET /api/auth/me
 * Returns current user info from JWT
 */
router.get("/me", authenticate, getMe);

module.exports = router;
