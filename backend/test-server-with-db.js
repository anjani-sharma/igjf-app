const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

console.log('🔌 Testing database connection...');
const { sequelize } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting test server with database...');

// Middleware
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
    message: 'Test server with DB is running',
    timestamp: new Date().toISOString()
  });
});

// Load routes
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);

// Start server with database
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Test server with DB started successfully on port', PORT);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();
