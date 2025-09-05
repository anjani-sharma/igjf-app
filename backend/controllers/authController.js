const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const User = require('../models/User');
const { sendMembershipCard } = require('../services/emailService');

const generateMembershipId = () => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `GJMF-${year}-${random}`;
};

const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
    return qrCodeDataURL;
  } catch (error) {
    throw error;
  }
};

const register = async (req, res) => {
  try {
    const { fullName, fatherName, address, phone, email, dateOfBirth, occupation, constituency, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate membership ID
    const membershipId = generateMembershipId();

    // Create QR code data
    const qrData = {
      membershipId,
      name: fullName,
      phone,
      id: uuidv4()
    };

    // Generate QR code
    const qrCode = await generateQRCode(qrData);

    // Create user
    const user = await User.create({
      membershipId,
      fullName,
      fatherName,
      address,
      phone,
      email,
      dateOfBirth,
      occupation,
      constituency,
      password: hashedPassword,
      profilePhoto: req.file ? `/uploads/${req.file.filename}` : null,
      qrCode,
      qrCodeData: JSON.stringify(qrData)
    });

    // Prepare email data
    const emailData = {
      fullName,
      fatherName,
      membershipId,
      phone,
      email,
      constituency,
      qrCode, // Base64 QR code for email
    };

    // Send membership card email (don't wait for it)
    sendMembershipCard(emailData).catch(error => {
      console.error('Failed to send membership email:', error);
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'Registration successful! Check your email for membership card.',
      token,
      user: {
        id: user.id,
        membershipId: user.membershipId,
        name: user.fullName,
        email: user.email,
        role: user.role,
        qrCode: user.qrCode
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        membershipId: user.membershipId,
        name: user.fullName,
        email: user.email,
        role: user.role,
        qrCode: user.qrCode
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { register, login };