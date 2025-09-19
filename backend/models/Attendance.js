// Create this file: backend/models/Attendance.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  eventId: {
    type: DataTypes.UUID,
    allowNull: true, // Can be null for location-only attendance
    references: {
      model: 'events',
      key: 'id',
    },
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false, // Required field
  },
  attendanceType: {
    type: DataTypes.ENUM('event', 'location_visit'),
    allowNull: false,
  },
  checkInTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  markedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('present', 'late', 'early_departure'),
    defaultValue: 'present',
  },
}, {
  tableName: 'attendances',
  timestamps: true,
});

module.exports = Attendance;