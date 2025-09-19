const { sequelize } = require('../config/database');
const User = require('../models/User');

async function fixAadharValidation() {
  try {
    console.log('🔧 Starting Aadhar validation fix...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Clean up any empty string aadharNumber values to null
    const [affectedCount] = await sequelize.query(`
      UPDATE users 
      SET aadharNumber = NULL 
      WHERE aadharNumber = '' OR aadharNumber = ' '
    `);

    console.log(`🧹 Cleaned ${affectedCount} empty aadharNumber values`);

    // Sync the model with new validation
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced with new validation rules');

    // Test the validation
    console.log('🧪 Testing new validation...');
    
    // This should work (empty/null value)
    try {
      const testUser = User.build({
        membershipId: 'TEST123',
        fullName: 'Test User',
        fatherName: 'Test Father',
        address: 'Test Address',
        phone: '1234567890',
        email: 'test@example.com',
        dateOfBirth: new Date('1990-01-01'),
        password: 'testpass',
        aadharNumber: null // This should be allowed
      });
      await testUser.validate();
      console.log('✅ Null aadharNumber validation passed');
    } catch (error) {
      console.error('❌ Null validation failed:', error.message);
    }

    // This should work (valid 12-digit number)
    try {
      const testUser2 = User.build({
        membershipId: 'TEST124',
        fullName: 'Test User 2',
        fatherName: 'Test Father',
        address: 'Test Address',
        phone: '1234567891',
        email: 'test2@example.com',
        dateOfBirth: new Date('1990-01-01'),
        password: 'testpass',
        aadharNumber: '123456789012' // Valid 12-digit number
      });
      await testUser2.validate();
      console.log('✅ Valid aadharNumber validation passed');
    } catch (error) {
      console.error('❌ Valid aadhar validation failed:', error.message);
    }

    // This should fail (invalid aadhar)
    try {
      const testUser3 = User.build({
        membershipId: 'TEST125',
        fullName: 'Test User 3',
        fatherName: 'Test Father',
        address: 'Test Address',
        phone: '1234567892',
        email: 'test3@example.com',
        dateOfBirth: new Date('1990-01-01'),
        password: 'testpass',
        aadharNumber: '12345' // Invalid length
      });
      await testUser3.validate();
      console.log('❌ Invalid aadharNumber validation should have failed');
    } catch (error) {
      console.log('✅ Invalid aadharNumber correctly rejected:', error.message);
    }

    console.log('🎉 Aadhar validation fix completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  fixAadharValidation()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = fixAadharValidation;