const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController");

// Make sure these routes exactly match what your frontend expects
router.post("/auth/login", login); // Should match /api/auth/login
// router.post("/register", register);

module.exports = router;
