const { getCurrentUser, loginWithEmailPassword } = require("../services/authService");

async function login(req, res) {
  const { email, password } = req.body;
  const session = await loginWithEmailPassword(email, password);
  res.json(session);
}

async function me(req, res) {
  const user = await getCurrentUser(req.user.userId);
  res.json(user);
}

module.exports = {
  login,
  me,
};
