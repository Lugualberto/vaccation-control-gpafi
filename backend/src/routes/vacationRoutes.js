const express = require("express");
const {
  createVacation,
  removeVacation,
  getVacations,
  getVacationAuditLogs,
} = require("../controllers/vacationController");
const { asyncHandler } = require("../utils/errors");

const router = express.Router();

router.get("/audit", asyncHandler(getVacationAuditLogs));
router.get("/", asyncHandler(getVacations));
router.post("/", asyncHandler(createVacation));
router.delete("/:id", asyncHandler(removeVacation));

module.exports = router;
