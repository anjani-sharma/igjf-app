require('dotenv').config();
const { sequelize } = require('./config/database');
const { User } = require('./models/index');

const fixPassword = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    const newHash = '$2b$12$65EUSEKHVqAoTZ0gaO02V.TQBRUA73rfYw5E5IcIAwQtYbc.0wbsm';
    
    console.log('🔄 Updating admin password...');
    const [updatedCount] = await User.update(
      { password: newHash },
      { where: { email: 'admin@gmail.com' } }
    );
    
    console.log('📊 Updated rows:', updatedCount);
    
    if (updatedCount > 0) {
      console.log('✅ Admin password fixed successfully!');
      console.log('📧 Email: admin@gmail.com');
      console.log('🔑 Password: admin@123');
    } else {
      console.log('❌ No user found with email admin@gmail.com');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixPassword();