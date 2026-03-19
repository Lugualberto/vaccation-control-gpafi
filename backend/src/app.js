const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const vacationRoutes = require("./routes/vacationRoutes");
const { authenticateToken } = require("./middlewares/auth");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/employees", authenticateToken, employeeRoutes);
app.use("/api/vacations", authenticateToken, vacationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
