// backend/test-server.js - Minimal version of your main server
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting test server...');

// Basic middleware (same as debug server)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

// Try loading routes
console.log('Loading auth routes...');
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

console.log('Loading member routes...');
const memberRoutes = require('./routes/members');
app.use('/api/members', memberRoutes);

console.log('All routes loaded, starting server...');

app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Test server started successfully on port', PORT);
});
