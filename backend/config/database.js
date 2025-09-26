// backend/config/database.js - Minimal Production Version
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/igjf_db',
  {
    dialect: 'postgres',
    logging: false, // Disable SQL query logging
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    try {
      // Use alter in production to avoid data loss
      await sequelize.sync({ 
        alter: process.env.NODE_ENV === 'production',
        force: process.env.NODE_ENV !== 'production' 
      });
      console.log('Database synchronized successfully');
      
      // Only create admin if this is initial setup
      await createDefaultAdmin();
      
    } catch (syncError) {
      console.log('Database sync failed:', syncError.message);
      
      // In production, don't force sync - just log and continue
      if (process.env.NODE_ENV === 'production') {
        console.log('Continuing without sync in production...');
      } else {
        // In development, we can be more aggressive
        console.log('Force syncing in development...');
        await sequelize.sync({ force: true });
        await createDefaultAdmin();
        console.log('Database force synced and admin created');
      }
    }
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

const createDefaultAdmin = async () => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    const QRCode = require('qrcode');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'abc1', 12);
    const adminMembershipId = `GJF${Date.now().toString().slice(-6)}`;
    const adminQrData = JSON.stringify({ membershipId: adminMembershipId });
    const adminQrCode = await QRCode.toDataURL(adminQrData);

    await User.create({
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
    
    console.log('Default admin created successfully');
    
  } catch (error) {
    console.error('Failed to create default admin:', error.message);
    // Don't throw - this shouldn't break the app startup
  }
};

module.exports = { sequelize, connectDB };