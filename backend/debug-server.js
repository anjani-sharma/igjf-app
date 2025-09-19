// backend/debug-server.js - Temporary file to isolate the issue
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🔍 Debug server starting...');

// Basic middleware
app.use(cors());
app.use(express.json());

// Test basic route
app.get('/', (req, res) => {
  res.json({ message: 'Debug server working' });
});

// Test auth routes
console.log('Testing auth routes...');
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Auth routes failed:', error.message);
}

// Test member routes
console.log('Testing member routes...');
try {
  const memberRoutes = require('./routes/members');
  app.use('/api/members', memberRoutes);
  console.log('✅ Member routes loaded successfully');
} catch (error) {
  console.error('❌ Member routes failed:', error.message);
}

app.listen(PORT, () => {
  console.log(`🎉 Debug server running on port ${PORT}`);
});
