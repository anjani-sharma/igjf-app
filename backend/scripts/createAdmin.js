const { sequelize } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const createAdminUser = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    await sequelize.sync();

    // Check if admin already exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (adminExists) {
      console.log('Admin user already exists:');
      console.log('Email:', adminExists.email);
      console.log('You can use this account to login');
      
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('pass1', 12);
    
    // Generate membership ID
    const membershipId = 'GJMF-ADMIN-2026';
    
    // Create QR code data
    const qrData = {
      membershipId,
      name: 'System Administrator',
      phone: '+91-9999999999',
      id: uuidv4()
    };
    
    // Generate QR code
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    // Create admin user
    const adminUser = await User.create({
      membershipId,
      fullName: 'System Administrator',
      fatherName: 'System',
      address: 'Party Headquarters',
      phone: '+91-9999999999',
      email: 'admin@gmail.com',
      dateOfBirth: new Date('1990-01-01'),
      occupation: 'Administrator',
      constituency: 'Central Office',
      password: hashedPassword,
      role: 'admin',
      qrCode,
      qrCodeData: JSON.stringify(qrData),
      isVerified: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: pass1');
    console.log('🆔 Membership ID:', adminUser.membershipId);
    console.log('\nYou can now login with these credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();