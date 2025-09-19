// backend/routes/auth.js - COMPLETE FILE
const express = require('express');
const multer = require('multer');
const path = require('path');
const { register, login } = require('../controllers/authController');

const router = express.Router();

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Error handling middleware for multer
const uploadHandler = (req, res, next) => {
  upload.single('profilePhoto')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A multer error occurred during upload
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // An unknown error occurred when uploading
      return res.status(500).json({ message: err.message });
    }
    // Everything went fine
    next();
  });
};

// Routes
router.post('/register', uploadHandler, register);
router.post('/login', login);

module.exports = router;