const express = require('express');
const bodyParser = require('body-parser');
const { sequelize, User } = require('./models/user');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    await User.create({ username, password });
    res.send("Signup successful!");
  } catch (error) {
    res.status(400).send("User already exists or error occurred.");
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username, password } });
  if (user) {
    res.redirect('/mood.html');
  } else {
    res.status(401).send("Invalid credentials.");
  }
});

// Start server
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
});
