// backend/models/User.js - FIXED VERSION (removes password hashing hooks)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  membershipId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  
  // Existing fields (keeping your structure)
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fatherName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  occupation: {
    type: DataTypes.STRING,
  },
  constituency: {
    type: DataTypes.STRING,
  },
  profilePhoto: {
    type: DataTypes.STRING,
  },
  role: {
    type: DataTypes.ENUM('member', 'organizer', 'admin'),
    defaultValue: 'member',
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  qrCode: {
    type: DataTypes.TEXT,
  },
  qrCodeData: {
    type: DataTypes.TEXT,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  registeredBy: {
    type: DataTypes.UUID,
  },
  
  // FIXED Aadhar-specific fields with proper validation
  aadharNumber: {
    type: DataTypes.STRING(12),
    allowNull: true,
    validate: {
      // Custom validation that allows null/empty values but validates when present
      aadharValidation(value) {
        if (value && value.trim() !== '') {
          // Only validate if value is not empty
          if (value.length !== 12) {
            throw new Error('Aadhar number must be exactly 12 digits');
          }
          if (!/^\d{12}$/.test(value)) {
            throw new Error('Aadhar number must contain only digits');
          }
        }
      }
    }
  },
  aadharVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aadharVerificationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Additional fields for enhanced registration
  gender: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pincode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      // 🔥 REMOVED: Password hashing (controller handles this now)
      // ❌ OLD CODE: 
      // if (user.password) {
      //   const salt = await bcrypt.genSalt(10);
      //   user.password = await bcrypt.hash(user.password, salt);
      // }
      
      // ✅ KEEP: Other hooks that don't conflict
      
      // Generate membership ID if not provided
      if (!user.membershipId) {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        user.membershipId = `GJF${timestamp}${random}`;
      }
      
      // Clean empty aadharNumber to null
      if (user.aadharNumber === '') {
        user.aadharNumber = null;
      }
      
      // Set Aadhar verification date if verified
      if (user.aadharVerified) {
        user.aadharVerificationDate = new Date();
      }
    },
    beforeUpdate: async (user) => {
      // 🔥 REMOVED: Password hashing (manual updates handle this)
      // ❌ OLD CODE:
      // if (user.changed('password') && user.password) {
      //   const salt = await bcrypt.genSalt(10);
      //   user.password = await bcrypt.hash(user.password, salt);
      // }
      
      // ✅ KEEP: Other hooks that don't conflict
      
      // Clean empty aadharNumber to null
      if (user.changed('aadharNumber') && user.aadharNumber === '') {
        user.aadharNumber = null;
      }
      
      // Update verification date if Aadhar status changed
      if (user.changed('aadharVerified') && user.aadharVerified) {
        user.aadharVerificationDate = new Date();
      }
    }
  }
});

// ✅ KEEP: Instance method to check password
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// ✅ KEEP: Instance method to get public profile
User.prototype.getPublicProfile = function() {
  const { password, ...publicData } = this.toJSON();
  return {
    ...publicData,
    hasAadhar: !!this.aadharNumber,
    verificationStatus: this.aadharVerified ? 'verified' : 'unverified'
  };
};

module.exports = User;