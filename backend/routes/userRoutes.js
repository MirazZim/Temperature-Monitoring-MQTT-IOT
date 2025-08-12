const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { getAllUsers } = require("../controllers/userController");

router.get("/", authenticate.adminOnly, getAllUsers);

module.exports = router;
