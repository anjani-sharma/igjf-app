// backend/models/index.js - UPDATED with Attendance
const User = require('./User');
const Event = require('./Event');
const Attendance = require('./Attendance');

// Define associations
User.hasMany(Event, { 
  foreignKey: 'createdBy', 
  as: 'createdEvents' 
});

Event.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator' 
});

User.hasMany(Attendance, { 
  foreignKey: 'userId', 
  as: 'attendances' 
});

User.hasMany(Attendance, { 
  foreignKey: 'markedBy', 
  as: 'markedAttendances' 
});

Event.hasMany(Attendance, { 
  foreignKey: 'eventId', 
  as: 'attendances' 
});

Attendance.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

Attendance.belongsTo(User, { 
  foreignKey: 'markedBy', 
  as: 'marker' 
});

Attendance.belongsTo(Event, { 
  foreignKey: 'eventId', 
  as: 'event' 
});

module.exports = {
  User,
  Event,
  Attendance
};