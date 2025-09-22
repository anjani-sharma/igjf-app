// backend/config/database.js - IMPROVED VERSION
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false, // Set to console.log to see SQL queries during debugging
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    console.log('🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    console.log('📄 Syncing database...');

    await sequelize.query('PRAGMA foreign_keys = OFF');
    
    // Try different sync strategies
    try {
      // Strategy 1: No alter, just ensure tables exist
      await sequelize.sync();
      console.log('✅ Database synced successfully');
    } catch (syncError) {
      console.log('⚠️  Basic sync failed, trying without alter...');
      
      try {
        // Strategy 2: Force recreate if basic sync fails
        console.log('🔄 Creating fresh database schema...');
        await sequelize.sync({ force: true });
        console.log('✅ Database force synced (fresh start)');
        
        // Create default admin user after force sync
        await createDefaultAdmin();

        
      } catch (forceError) {
        console.error('❌ Force sync also failed:', forceError);
        console.log('💡 Please run one of these fix scripts:');
        console.log('   node comprehensive-database-fix.js');
        console.log('   node direct-sqlite-fix.js');
        console.log('   Or delete database.sqlite for fresh start');
        process.exit(1);
      }
    }
    
    await sequelize.query('PRAGMA foreign_keys = ON');
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    
    // Provide helpful error messages
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('💡 Unique constraint error detected. Try these solutions:');
      console.log('   1. node comprehensive-database-fix.js');
      console.log('   2. node direct-sqlite-fix.js');
      console.log('   3. rm database.sqlite (fresh start)');
    }
    
    process.exit(1);
  }
};

// Create default admin user after force sync
const createDefaultAdmin = async () => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    const QRCode = require('qrcode');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      return;
    }

    console.log('👤 Creating default admin user...');
    
    const adminPassword = await bcrypt.hash('pass1', 12);
    const adminMembershipId = `GJF${Date.now().toString().slice(-6)}`;
    const adminQrData = JSON.stringify({ membershipId: adminMembershipId });
    const adminQrCode = await QRCode.toDataURL(adminQrData);

    await User.create({
      membershipId: adminMembershipId,
      fullName: 'System Administrator',
      fatherName: 'Admin Father',
      email: 'admin@egmail.com',
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

    console.log('✅ Default admin created - Email: admin@egmail.com, Password: pass1');
    
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

module.exports = { sequelize, connectDB };