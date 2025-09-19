const { sequelize } = require('../config/database');

async function addAadharFieldsToExisting() {
  try {
    console.log('🔄 Adding Aadhar fields to existing users table...');

    const queryInterface = sequelize.getQueryInterface();

    // Check if columns already exist before adding
    const tableDescription = await queryInterface.describeTable('users');
    
    // Add aadharNumber if it doesn't exist
    if (!tableDescription.aadharNumber) {
      await queryInterface.addColumn('users', 'aadharNumber', {
        type: sequelize.Sequelize.STRING(12),
        allowNull: true,
        unique: true
      });
      console.log('✅ Added aadharNumber column');
    } else {
      console.log('ℹ️ aadharNumber column already exists');
    }

    // Add aadharVerified if it doesn't exist
    if (!tableDescription.aadharVerified) {
      await queryInterface.addColumn('users', 'aadharVerified', {
        type: sequelize.Sequelize.BOOLEAN,
        defaultValue: false
      });
      console.log('✅ Added aadharVerified column');
    } else {
      console.log('ℹ️ aadharVerified column already exists');
    }

    // Add aadharVerificationDate if it doesn't exist
    if (!tableDescription.aadharVerificationDate) {
      await queryInterface.addColumn('users', 'aadharVerificationDate', {
        type: sequelize.Sequelize.DATE,
        allowNull: true
      });
      console.log('✅ Added aadharVerificationDate column');
    } else {
      console.log('ℹ️ aadharVerificationDate column already exists');
    }

    // Add gender if it doesn't exist
    if (!tableDescription.gender) {
      await queryInterface.addColumn('users', 'gender', {
        type: sequelize.Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added gender column');
    } else {
      console.log('ℹ️ gender column already exists');
    }

    // Add city if it doesn't exist
    if (!tableDescription.city) {
      await queryInterface.addColumn('users', 'city', {
        type: sequelize.Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added city column');
    } else {
      console.log('ℹ️ city column already exists');
    }

    // Add state if it doesn't exist
    if (!tableDescription.state) {
      await queryInterface.addColumn('users', 'state', {
        type: sequelize.Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added state column');
    } else {
      console.log('ℹ️ state column already exists');
    }

    // Add pincode if it doesn't exist
    if (!tableDescription.pincode) {
      await queryInterface.addColumn('users', 'pincode', {
        type: sequelize.Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Added pincode column');
    } else {
      console.log('ℹ️ pincode column already exists');
    }

    // Add isActive if it doesn't exist
    if (!tableDescription.isActive) {
      await queryInterface.addColumn('users', 'isActive', {
        type: sequelize.Sequelize.BOOLEAN,
        defaultValue: true
      });
      console.log('✅ Added isActive column');
    } else {
      console.log('ℹ️ isActive column already exists');
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  addAadharFieldsToExisting()
    .then(() => {
      console.log('✅ All Aadhar fields added successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addAadharFieldsToExisting;
