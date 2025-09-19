// backend/controllers/authController.js - FIXED VERSION with consistent field names
const bcryptjs = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const QRCode = require('qrcode');

const register = async (req, res) => {
  try {
    const { 
      fullName, 
      fatherName, 
      email, 
      phone,
      dateOfBirth,
      occupation,
      address,
      constituency,
      password,
      verificationMethod,
      // 🔥 FIXED: Accept both spellings and normalize to backend format
      aadharNumber: reqAadharNumber,
      aadhaarNumber: reqAadhaarNumber, // Alternative spelling from frontend
      aadharVerified: reqAadharVerified,
      aadhaarVerified: reqAadhaarVerified,
      gender,
      city,
      state,
      pincode
    } = req.body;

    console.log('📝 Registration request:', { 
      fullName, 
      email, 
      verificationMethod,
      aadharProvided: !!(reqAadharNumber || reqAadhaarNumber)
    });

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    // 🔥 NORMALIZE: Handle both aadhar/aadhaar spellings
    const aadharNumber = reqAadharNumber || reqAadhaarNumber || null;
    const aadharVerified = reqAadharVerified || reqAadhaarVerified || false;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: {
        [Op.or]: [
          { email },
          ...(phone ? [{ phone }] : []),
          ...(aadharNumber ? [{ aadharNumber }] : [])
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      if (existingUser.phone === phone) {
        return res.status(400).json({ message: 'User with this phone number already exists' });
      }
      if (existingUser.aadharNumber === aadharNumber) {
        return res.status(400).json({ message: 'User with this Aadhar number already exists' });
      }
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Generate unique membership ID
    const membershipId = `GJF${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;

    // Handle profile photo
    let profilePhotoPath = null;
    if (req.file) {
      profilePhotoPath = req.file.path.replace(/\\/g, '/');
    }

    // Generate QR code data
    const qrCodeData = JSON.stringify({
      membershipId,
      name: fullName,
      email,
      phone: phone || '',
      id: require('uuid').v4()
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData);

    // Create user with cleaned data
    const user = await User.create({
      membershipId,
      fullName,
      fatherName,
      email,
      phone,
      dateOfBirth,
      occupation,
      address,
      constituency,
      password: hashedPassword,
      profilePhoto: profilePhotoPath,
      qrCode: qrCodeUrl,
      qrCodeData,
      role: 'member',
      isVerified: aadharVerified === 'true' || aadharVerified === true,
      isActive: true,
      aadharNumber: aadharNumber || null,
      aadharVerified: aadharVerified === 'true' || aadharVerified === true,
      aadharVerificationDate: (aadharVerified === 'true' || aadharVerified === true) ? new Date() : null,
      gender: gender || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    console.log('✅ Registration successful for:', user.email);

    res.status(201).json({
      message: 'Registration successful! Check your email for membership card.',
      token,
      user: {
        id: user.id,
        membershipId: user.membershipId,
        name: user.fullName,        // For backward compatibility
        fullName: user.fullName,    // Primary field
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        profilePhoto: user.profilePhoto,
        qrCode: user.qrCode,
        // Include all user fields for consistency
        fatherName: user.fatherName,
        dateOfBirth: user.dateOfBirth,
        occupation: user.occupation,
        address: user.address,
        constituency: user.constituency,
        gender: user.gender,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        aadharNumber: user.aadharNumber,
        aadharVerified: user.aadharVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    console.log('🔐 Login attempt for:', identifier ? identifier.substring(0, 3) + '***' : 'missing');

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email/phone and password are required' });
    }

    // Find user by email OR phone number
    const user = await User.findOne({ 
      where: {
        [Op.or]: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user) {
      console.log('❌ User not found for identifier:', identifier);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('👤 User found:', { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      isActive: user.isActive 
    });

    // Check password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password mismatch for user:', user.email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated. Please contact admin.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    console.log('✅ Login successful for:', user.email);

    // 🔥 FIXED: Return consistent, complete user object
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        membershipId: user.membershipId,
        name: user.fullName,        // For backward compatibility
        fullName: user.fullName,    // Primary field
        fatherName: user.fatherName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        occupation: user.occupation,
        address: user.address,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        constituency: user.constituency,
        gender: user.gender,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        profilePhoto: user.profilePhoto,
        qrCode: user.qrCode,
        qrCodeData: user.qrCodeData,
        aadharNumber: user.aadharNumber,
        aadharVerified: user.aadharVerified,
        aadharVerificationDate: user.aadharVerificationDate,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error('🚨 Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login };