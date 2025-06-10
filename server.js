const express = require('express');
const app = express();
const path = require('path');
const { sequelize } = require('./models/user');

// Middleware
app.use(express.static(__dirname)); // Serve static files like .html, .css, .js

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
sequelize.sync().then(() => {
  console.log('Database connected');
});

// Route to serve mood.html by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'mood.html'));
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
