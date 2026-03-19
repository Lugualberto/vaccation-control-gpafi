const express = require("express");
const {
  createVacation,
  approveVacation,
  rejectVacation,
  getVacations,
} = require("../controllers/vacationController");
const { asyncHandler } = require("../utils/errors");

const router = express.Router();

router.get("/", asyncHandler(getVacations));
router.post("/", asyncHandler(createVacation));
router.put("/:id/approve", asyncHandler(approveVacation));
router.put("/:id/reject", asyncHandler(rejectVacation));

module.exports = router;
