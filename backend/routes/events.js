// backend/routes/events.js - COMPLETE with attendance routes
const express = require('express');
const { auth, adminAuth, adminOnlyAuth } = require('../middleware/auth');
const { 
  createEvent, 
  getAllEvents, 
  getEvent, 
  updateEvent, 
  deleteEvent 
} = require('../controllers/eventController');
const {
  markAttendance,
  getAttendanceRecords,
  getAttendanceStats,
  markCheckout
} = require('../controllers/attendanceController');

const router = express.Router();

// Test routes
router.get('/test', (req, res) => {
  console.log('🧪 Events test route called');
  res.json({
    success: true,
    message: 'Events API is working',
    timestamp: new Date()
  });
});

router.get('/test-auth', auth, (req, res) => {
  console.log('🧪 Events auth test route called by:', req.user?.fullName);
  res.json({
    success: true,
    message: 'Events auth is working',
    user: {
      id: req.user?.id,
      name: req.user?.fullName,
      role: req.user?.role
    },
    timestamp: new Date()
  });
});

// Event CRUD routes
router.post('/', auth, adminOnlyAuth, createEvent); // Admin only can create events
router.get('/', auth, getAllEvents); // All authenticated users can view events
router.get('/:id', auth, getEvent); // Get single event
router.put('/:id', auth, adminOnlyAuth, updateEvent); // Admin only can update
router.delete('/:id', auth, adminOnlyAuth, deleteEvent); // Admin only can delete

// Attendance routes
router.post('/attendance/mark', auth, adminAuth, markAttendance); // Admin/Organizer can mark attendance
router.get('/attendance/records', auth, adminAuth, getAttendanceRecords); // Admin/Organizer can view records
router.get('/attendance/stats', auth, adminAuth, getAttendanceStats); // Admin/Organizer can view stats
router.patch('/attendance/:attendanceId/checkout', auth, adminAuth, markCheckout); // Mark checkout

module.exports = router;