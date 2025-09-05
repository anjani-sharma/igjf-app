const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth, adminAuth, adminOnlyAuth } = require('../middleware/auth');
const { getProfile, getAllMembers, scanQRCode, updateMemberRole, deleteMember, updateProfile } = require('../controllers/memberController');

const router = express.Router();

// Multer configuration for profile photo upload
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

// Regular routes
router.get('/profile', auth, getProfile);
router.get('/all', auth, adminAuth, getAllMembers);
router.post('/scan', auth, adminAuth, scanQRCode);
router.put('/role/:id', auth, adminAuth, updateMemberRole);

// Delete route - ADMIN ONLY
router.delete('/:id', auth, adminOnlyAuth, deleteMember);

// New profile update route
router.put('/profile', auth, upload.single('profilePhoto'), updateProfile);

module.exports = router;