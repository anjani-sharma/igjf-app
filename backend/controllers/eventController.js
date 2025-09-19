// backend/controllers/eventController.js - FIXED VERSION
const QRCode = require('qrcode');
const { Op } = require('sequelize');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Create event (Admin only)
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      address,
      eventType,
      maxAttendees
    } = req.body;

    // DEBUG LOG
    console.log('🔍 Creating event with data:', {
      title,
      eventDate,
      startTime,
      location,
      createdBy: req.user?.id,
      userRole: req.user?.role
    });

    // Validate required fields
    if (!title || !eventDate || !startTime || !location) {
      console.log('❌ Validation failed - missing required fields');
      return res.status(400).json({ 
        message: 'Title, event date, start time, and location are required' 
      });
    }

    // Generate QR code data for event
    const qrCodeData = JSON.stringify({
      type: 'event',
      eventId: null, // Will be updated after creation
      title,
      eventDate,
      location,
      timestamp: Date.now()
    });

    console.log('📝 About to create event in database...');

    // Create event
    const event = await Event.create({
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      address,
      eventType: eventType || 'meeting',
      maxAttendees,
      createdBy: req.user.id,
      qrCodeData
    });

    console.log('✅ Event created with ID:', event.id);

    // Update QR code data with actual event ID
    const updatedQrCodeData = JSON.stringify({
      type: 'event',
      eventId: event.id,
      title,
      eventDate,
      location,
      timestamp: Date.now()
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(updatedQrCodeData);

    // Update event with QR code
    await event.update({
      qrCode: qrCodeUrl,
      qrCodeData: updatedQrCodeData
    });

    console.log('✅ Event updated with QR code');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        address: event.address,
        eventType: event.eventType,
        maxAttendees: event.maxAttendees,
        isActive: event.isActive,
        qrCode: event.qrCode,
        createdBy: event.createdBy,
        createdAt: event.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const { active, upcoming, past } = req.query;
    
    let whereCondition = {};
    
    if (active === 'true') {
      whereCondition.isActive = true;
    }
    
    if (upcoming === 'true') {
      whereCondition.eventDate = {
        [Op.gte]: new Date()
      };
    }
    
    if (past === 'true') {
      whereCondition.eventDate = {
        [Op.lt]: new Date()
      };
    }

    const events = await Event.findAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'role']
        },
        {
          model: Attendance,
          as: 'attendances',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'membershipId']
            }
          ]
        }
      ],
      order: [['eventDate', 'ASC']]
    });

    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      address: event.address,
      eventType: event.eventType,
      maxAttendees: event.maxAttendees,
      isActive: event.isActive,
      qrCode: event.qrCode,
      createdBy: event.createdBy,
      creator: event.creator,
      attendanceCount: event.attendances ? event.attendances.length : 0,
      attendances: event.attendances || [],
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    }));

    res.json({
      success: true,
      events: formattedEvents,
      total: formattedEvents.length
    });
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get single event
const getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'role']
        },
        {
          model: Attendance,
          as: 'attendances',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'membershipId', 'phone', 'email']
            },
            {
              model: User,
              as: 'marker',
              attributes: ['id', 'fullName']
            }
          ]
        }
      ]
    });

    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }

    res.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location,
        address: event.address,
        eventType: event.eventType,
        maxAttendees: event.maxAttendees,
        isActive: event.isActive,
        qrCode: event.qrCode,
        createdBy: event.createdBy,
        creator: event.creator,
        attendances: event.attendances || [],
        attendanceCount: event.attendances ? event.attendances.length : 0,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error fetching event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update event (Admin only)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }

    await event.update(updateData);

    console.log('✅ Event updated:', event.id);

    res.json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete event (Admin only)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ 
        success: false,
        message: 'Event not found' 
      });
    }

    await event.destroy();

    console.log('✅ Event deleted:', id);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent
};