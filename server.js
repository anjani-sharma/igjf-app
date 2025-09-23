// Root server.js - Redirects to backend server
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// For production, we want to run the backend server directly
if (process.env.NODE_ENV === 'production') {
  // In production, just require and run the backend server
  require('./backend/server.js');
} else {
  // For development, redirect to backend
  app.get('*', (req, res) => {
    res.redirect('http://localhost:3000' + req.path);
  });
  
  app.listen(PORT, () => {
    console.log(`Root server running on port ${PORT}`);
    console.log('Redirecting to backend server...');
  });
}