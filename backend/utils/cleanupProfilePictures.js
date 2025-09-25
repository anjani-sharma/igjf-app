// backend/utils/cleanupProfilePictures.js
// Utility script to clean up unused profile pictures

const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { sequelize } = require('../config/database');

const cleanupUnusedProfilePictures = async () => {
  try {
    console.log('🧹 Starting profile picture cleanup...');
    
    // Get all users with profile photos
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'profilePhoto'],
      where: {
        profilePhoto: {
          [require('sequelize').Op.not]: null
        }
      }
    });
    
    console.log(`📊 Found ${users.length} users with profile photos`);
    
    // Get all files in uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('📁 Uploads directory does not exist');
      return;
    }
    
    const allFiles = fs.readdirSync(uploadsDir).filter(file => {
      return file.match(/\.(jpg|jpeg|png)$/i);
    });
    
    console.log(`📁 Found ${allFiles.length} image files in uploads directory`);
    
    // Create a set of currently used profile photo filenames
    const usedFiles = new Set();
    users.forEach(user => {
      if (user.profilePhoto && user.profilePhoto.startsWith('uploads/')) {
        const filename = path.basename(user.profilePhoto);
        usedFiles.add(filename);
      }
    });
    
    console.log(`✅ ${usedFiles.size} files are currently in use`);
    
    // Find unused files
    const unusedFiles = allFiles.filter(file => !usedFiles.has(file));
    
    console.log(`🗑️ Found ${unusedFiles.length} unused files`);
    
    if (unusedFiles.length === 0) {
      console.log('✨ No unused files to clean up!');
      return;
    }
    
    // Delete unused files
    let deletedCount = 0;
    let deletedSize = 0;
    
    for (const file of unusedFiles) {
      try {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        deletedSize += stats.size;
        
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`🗑️ Deleted: ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
      } catch (error) {
        console.error(`❌ Error deleting ${file}:`, error.message);
      }
    }
    
    console.log(`\n✅ Cleanup completed!`);
    console.log(`📊 Deleted ${deletedCount} files`);
    console.log(`💾 Freed up ${(deletedSize / 1024 / 1024).toFixed(2)} MB of storage`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
};

// Function to get storage statistics
const getStorageStats = async () => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('📁 Uploads directory does not exist');
      return;
    }
    
    const files = fs.readdirSync(uploadsDir).filter(file => {
      return file.match(/\.(jpg|jpeg|png)$/i);
    });
    
    let totalSize = 0;
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });
    
    const users = await User.findAll({
      attributes: ['profilePhoto'],
      where: {
        profilePhoto: {
          [require('sequelize').Op.not]: null
        }
      }
    });
    
    console.log('\n📊 Storage Statistics:');
    console.log(`📁 Total files: ${files.length}`);
    console.log(`👥 Users with photos: ${users.length}`);
    console.log(`💾 Total storage used: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📈 Average file size: ${(totalSize / files.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error getting storage stats:', error);
  }
};

// Run cleanup if called directly
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('🔗 Database connected successfully');
      
      await getStorageStats();
      await cleanupUnusedProfilePictures();
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Script failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  cleanupUnusedProfilePictures,
  getStorageStats
};