// backend/controllers/attendanceController.js - FIXED VERSION
const { Op } = require('sequelize');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const User = require('../models/User');

// Mark attendance via QR scan
const markAttendance = async (req, res) => {
  try {
    const { qrData, location, attendanceType = 'event', notes } = req.body;
    
    console.log('📋 Marking attendance:', { 
      markedBy: req.user.id, 
      location, 
      attendanceType,
      qrData: qrData?.substring(0, 10) + '...' // Only show first 10 chars for privacy
    });

    let parsedQrData;
    try {
      parsedQrData = JSON.parse(qrData);
    } catch (error) {
      // If QR data is just membershipId (simple QR)
      parsedQrData = { membershipId: qrData };
    }

    // Find the user whose attendance is being marked
    const user = await User.findOne({
      where: { membershipId: parsedQrData.membershipId },
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      console.log('❌ Member not found:', parsedQrData.membershipId);
      return res.status(404).json({ 
        success: false,
        message: 'Member not found' 
      });
    }

    console.log('👤 Found member:', user.fullName, '- ID:', user.membershipId);

    // Handle event attendance
    let eventId = null;
    let finalLocation = location || 'Event Location'; // DEFAULT LOCATION FIX
    
    if (attendanceType === 'event' && parsedQrData.eventId) {
      const event = await Event.findByPk(parsedQrData.eventId);
      if (!event) {
        return res.status(404).json({ 
          success: false,
          message: 'Event not found' 
        });
      }
      eventId = event.id;
      finalLocation = event.location || 'Event Location'; // Use event location
      
      console.log('📅 Event found:', event.title, 'at', finalLocation);
      
      // Check if already marked for this event
      const existingAttendance = await Attendance.findOne({
        where: {
          userId: user.id,
          eventId: eventId
        }
      });

      if (existingAttendance) {
        return res.status(400).json({ 
          success: false,
          message: 'Attendance already marked for this event',
          attendance: existingAttendance
        });
      }
    } else if (attendanceType === 'event') {
      // For event attendance without specific event ID, use generic location
      finalLocation = location || 'Event Location';
    } else {
      // For location visits, location should be provided
      if (!location) {
        return res.status(400).json({
          success: false,
          message: 'Location is required for location visits'
        });
      }
      finalLocation = location;
    }

    // Determine status based on timing (for events)
    let status = 'present';
    if (eventId) {
      const event = await Event.findByPk(eventId);
      const eventDateTime = new Date(`${event.eventDate.toDateString()} ${event.startTime}`);
      const currentTime = new Date();
      
      if (currentTime > eventDateTime) {
        const lateDuration = currentTime - eventDateTime;
        if (lateDuration > 15 * 60 * 1000) { // 15 minutes late
          status = 'late';
        }
      }
    }

    console.log('💾 Creating attendance record:', {
      userId: user.id,
      eventId,
      location: finalLocation,
      attendanceType,
      status
    });

    // Create attendance record
    const attendance = await Attendance.create({
      userId: user.id,
      eventId,
      location: finalLocation, // This is now guaranteed to have a value
      attendanceType,
      checkInTime: new Date(),
      markedBy: req.user.id,
      notes,
      status
    });

    // Fetch complete attendance data with relations
    const completeAttendance = await Attendance.findByPk(attendance.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'membershipId', 'phone', 'email', 'role']
        },
        {
          model: User,
          as: 'marker',
          attributes: ['id', 'fullName', 'role']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'eventDate', 'location']
        }
      ]
    });

    console.log('✅ Attendance marked successfully for:', user.fullName);

    res.json({
      success: true,
      message: `Attendance marked successfully for ${user.fullName}`,
      attendance: completeAttendance
    });
  } catch (error) {
    console.error('❌ Error marking attendance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get attendance records
const getAttendanceRecords = async (req, res) => {
  try {
    const { 
      eventId, 
      location, 
      userId, 
      startDate, 
      endDate,
      attendanceType,
      page = 1,
      limit = 50 
    } = req.query;

    let whereCondition = {};
    
    if (eventId) whereCondition.eventId = eventId;
    if (location) whereCondition.location = location;
    if (userId) whereCondition.userId = userId;
    if (attendanceType) whereCondition.attendanceType = attendanceType;
    
    if (startDate && endDate) {
      whereCondition.checkInTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: attendances } = await Attendance.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'membershipId', 'phone', 'role']
        },
        {
          model: User,
          as: 'marker',
          attributes: ['id', 'fullName', 'role']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'title', 'eventDate', 'location'],
          required: false
        }
      ],
      order: [['checkInTime', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      attendances,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching attendance records:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get attendance summary/statistics
const getAttendanceStats = async (req, res) => {
  try {
    const { eventId, startDate, endDate } = req.query;

    let whereCondition = {};
    
    if (eventId) whereCondition.eventId = eventId;
    
    if (startDate && endDate) {
      whereCondition.checkInTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get total attendance count
    const totalAttendance = await Attendance.count({
      where: whereCondition
    });

    // Get attendance by location
    const attendanceByLocation = await Attendance.findAll({
      attributes: [
        'location',
        [Attendance.sequelize.fn('COUNT', Attendance.sequelize.col('id')), 'count']
      ],
      where: whereCondition,
      group: ['location'],
      raw: true
    });

    // Get attendance by type
    const attendanceByType = await Attendance.findAll({
      attributes: [
        'attendanceType',
        [Attendance.sequelize.fn('COUNT', Attendance.sequelize.col('id')), 'count']
      ],
      where: whereCondition,
      group: ['attendanceType'],
      raw: true
    });

    // Get top attendees
    const topAttendees = await Attendance.findAll({
      attributes: [
        'userId',
        [Attendance.sequelize.fn('COUNT', Attendance.sequelize.col('Attendance.id')), 'attendanceCount']
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['fullName', 'membershipId', 'role']
        }
      ],
      where: whereCondition,
      group: ['userId'],
      order: [[Attendance.sequelize.literal('attendanceCount'), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      stats: {
        totalAttendance,
        attendanceByLocation,
        attendanceByType,
        topAttendees
      }
    });
  } catch (error) {
    console.error('❌ Error fetching attendance stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Mark checkout (for location visits)
const markCheckout = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { notes } = req.body;

    const attendance = await Attendance.findByPk(attendanceId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'membershipId']
        }
      ]
    });

    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Attendance record not found' 
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ 
        success: false,
        message: 'Checkout already marked' 
      });
    }

    await attendance.update({
      checkOutTime: new Date(),
      notes: notes || attendance.notes
    });

    console.log('✅ Checkout marked for:', attendance.user.fullName);

    res.json({
      success: true,
      message: 'Checkout marked successfully',
      attendance
    });
  } catch (error) {
    console.error('❌ Error marking checkout:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  markAttendance,
  getAttendanceRecords,
  getAttendanceStats,
  markCheckout
};