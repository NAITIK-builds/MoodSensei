const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const { sequelize, User } = require('./models/user');
sequelize.sync(); // This creates the table if it doesn't exist

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views/index.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public/signup.html')));
app.get('/mood', (req, res) => res.sendFile(path.join(__dirname, 'public/mood.html')));

app.post('/signup', async (req, res) => {
  const { username, password, mood } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Encrypt password

    await User.create({
      username,
      password: hashedPassword,
      mood
    });

    res.send('Signup successful!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Signup failed');
  }
});

app.post('/mood', async (req, res) => {
  const { username, mood } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (user) {
      user.mood = mood;
      await user.save();
      res.send("Mood updated");
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.error(err);
    res.send("Error updating mood");
  }
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (user && await bcrypt.compare(password, user.password)) {
    res.redirect('/mood');
  } else {
    res.send('Login failed');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});