// backend/config/database.js - Production Ready Version
const { Sequelize } = require('sequelize');
const path = require('path');

// Determine if we're using PostgreSQL (production) or SQLite (development)
const isProduction = process.env.NODE_ENV === 'production';
const DATABASE_URL = process.env.DATABASE_URL;

let sequelize;

if (isProduction && DATABASE_URL) {
  // Production PostgreSQL configuration
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Important for Render's PostgreSQL
      }
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Development SQLite configuration
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DATABASE_PATH || path.join(__dirname, '../database.db'),
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    if (sequelize.getDialect() === 'sqlite') {
      // SQLite-specific operations
      await sequelize.query('PRAGMA foreign_keys = OFF');
      
      try {
        await sequelize.sync();
      } catch (syncError) {
        console.error('Basic sync failed, attempting force sync:', syncError.message);
        await sequelize.sync({ force: true });
        await createDefaultAdmin();
      }
      
      await sequelize.query('PRAGMA foreign_keys = ON');
    } else {
      // PostgreSQL operations
      try {
        await sequelize.sync();
        console.log('Database synchronized successfully');
      } catch (syncError) {
        console.error('Database sync error:', syncError.message);
        // For production, we don't want to force sync by default
        // Only force sync if explicitly set in environment variable
        if (process.env.FORCE_DB_SYNC === 'true') {
          console.log('Forcing database sync as specified in environment');
          await sequelize.sync({ force: true });
          await createDefaultAdmin();
        } else {
          throw syncError;
        }
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

    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) return;

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
    
  } catch (error) {
    console.error('Failed to create default admin:', error.message);
  }
};

module.exports = { sequelize, connectDB };