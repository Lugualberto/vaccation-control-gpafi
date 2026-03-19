const express = require("express");
const {
  listEmployees,
  getEmployeeById,
  getEmployeeBalance,
  getEmployeeVacations,
  updateEmployeeBalance,
} = require("../controllers/employeeController");
const { asyncHandler } = require("../utils/errors");

const router = express.Router();

router.get("/", asyncHandler(listEmployees));
router.get("/:id", asyncHandler(getEmployeeById));
router.get("/:id/balance/:year", asyncHandler(getEmployeeBalance));
router.put("/:id/balance/:year", asyncHandler(updateEmployeeBalance));
router.get("/:id/vacations", asyncHandler(getEmployeeVacations));

module.exports = router;
