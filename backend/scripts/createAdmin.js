// Script to create default admin user
require('dotenv').config();
const { sequelize } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const createDefaultAdmin = async () => {
  try {
    console.log('🔍 Checking for existing admin user...');
    
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    console.log('👤 Creating default admin user...');
    
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'abc1', 12);
    const adminMembershipId = `GJF${Date.now().toString().slice(-6)}`;
    const adminQrData = JSON.stringify({ membershipId: adminMembershipId });
    const adminQrCode = await QRCode.toDataURL(adminQrData);

    const admin = await User.create({
      membershipId: adminMembershipId,
      fullName: 'System Administrator',
      fatherName: 'System',
      email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
      phone: '9999999999',
      dateOfBirth: new Date('1990-01-01'),
      address: 'System Address',
      password: adminPassword,
      role: 'admin',
      occupation: 'Administrator',
      constituency: 'System',
      gender: 'other',
      city: 'System City',
      state: 'System State',
      pincode: '000000',
      isActive: true,
      isVerified: true,
      qrCode: adminQrCode,
      qrCodeData: adminQrData
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: abc1');
    console.log('🆔 Membership ID:', admin.membershipId);
    
  } catch (error) {
    console.error('❌ Failed to create default admin:', error.message);
  }
};

const main = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    await createDefaultAdmin();
    
    await sequelize.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
};

main();