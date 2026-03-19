const express = require("express");
const { login, me } = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/auth");
const { asyncHandler } = require("../utils/errors");

const router = express.Router();

router.post("/login", asyncHandler(login));
router.get("/me", authenticateToken, asyncHandler(me));

module.exports = router;
