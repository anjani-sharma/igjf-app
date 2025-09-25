// backend/server.js - FIXED VERSION
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./config/database');

// Import models to ensure associations are loaded
require('./models/index');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const eventRoutes = require('./routes/events');

const app = express(); // ← This line must come BEFORE any app.use() calls
const PORT = process.env.PORT || 3000;

// Health check endpoint for deployment platforms
app.get('/', (req, res) => {
  res.json({ 
    status: 'IGJF Backend API is running', 
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

console.log('🚀 Starting server...');

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Debug middleware for attendance requests (MOVED AFTER app creation)
app.use('/api/events/attendance', (req, res, next) => {
  console.log('🔍 Attendance API called:', {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: {
      authorization: req.headers.authorization ? 'Bearer ***' : 'No auth',
      contentType: req.headers['content-type']
    }
  });
  next();
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.1.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Gorkha Janshakti Front API Server',
    status: 'Running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      members: '/api/members',
      events: '/api/events'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/events', eventRoutes);

// Error handling middleware for attendance route
app.use('/api/events/attendance', (err, req, res, next) => {
  console.error('❌ Attendance API Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Attendance API error', 
    error: err.message 
  });
});

// General error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❓ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    console.log('📄 Syncing database...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    // Start listening
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 Server started successfully!');
      console.log('🔗 Server running on:');
      console.log(`   - Local: http://localhost:${PORT}`);
      console.log(`   - Network: http://192.168.1.65:${PORT}`);
      console.log('📱 API Base URL: http://192.168.1.65:5000/api');
      console.log('🏥 Health Check: http://192.168.1.65:5000/health');
      console.log('📅 Events API: http://192.168.1.65:5000/api/events');
      console.log('='.repeat(50));
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Process terminated');
      });
    });

  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();