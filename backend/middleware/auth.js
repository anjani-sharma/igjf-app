// backend/middleware/auth.js - CLEANED VERSION
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Admin and Organizer access (for most admin features)
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
    return res.status(403).json({ message: 'Access denied. Admin/Organizer only.' });
  }
  next();
};

// STRICT admin-only access for sensitive operations like delete
const adminOnlyAuth = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied. Admin privileges required for this operation.',
      userRole: req.user?.role 
    });
  }
};

module.exports = { auth, adminAuth, adminOnlyAuth };