// File: backend/controllers/memberController.js - COMPLETE FIXED VERSION

const User = require('../models/User');
const { sendRoleUpdateEmail } = require('../services/emailService');

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Only exclude password, include qrCodeData for mobile app
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // 🔥 FIXED: Return consistent structure that works with mobile app
    const profileData = {
      id: user.id,
      membershipId: user.membershipId,
      name: user.fullName,        // For backward compatibility
      fullName: user.fullName,    // Primary field
      fatherName: user.fatherName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      occupation: user.occupation,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      constituency: user.constituency,
      gender: user.gender,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      profilePhoto: user.profilePhoto,
      qrCode: user.qrCode,
      qrCodeData: user.qrCodeData,
      aadharNumber: user.aadharNumber,
      aadharVerified: user.aadharVerified,
      aadharVerificationDate: user.aadharVerificationDate,
      registeredBy: user.registeredBy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    res.json(profileData);
  } catch (error) {
    console.error('❌ Error getting profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllMembers = async (req, res) => {
  try {
    const members = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    // 🔥 FIXED: Transform to structure that works with mobile app components
    const transformedMembers = members.map(member => ({
      // Direct fields (for new components)
      id: member.id,
      _id: member.id, // For components expecting _id
      membershipId: member.membershipId,
      name: member.fullName,
      fullName: member.fullName,
      role: member.role,
      email: member.email,
      phone: member.phone,
      isVerified: member.isVerified,
      isActive: member.isActive,
      profilePhoto: member.profilePhoto,
      createdAt: member.createdAt,
      
      // PersonalInfo structure (for components expecting nested structure)
      personalInfo: {
        fullName: member.fullName,
        fatherName: member.fatherName,
        email: member.email,
        phone: member.phone,
        dateOfBirth: member.dateOfBirth,
        gender: member.gender,
        occupation: member.occupation,
        address: member.address,
        city: member.city,
        state: member.state,
        pincode: member.pincode,
        constituency: member.constituency,
        aadharNumber: member.aadharNumber,
        aadharVerified: member.aadharVerified,
      },
      
      // All other fields
      fatherName: member.fatherName,
      dateOfBirth: member.dateOfBirth,
      occupation: member.occupation,
      address: member.address,
      city: member.city,
      state: member.state,
      pincode: member.pincode,
      constituency: member.constituency,
      gender: member.gender,
      aadharNumber: member.aadharNumber,
      aadharVerified: member.aadharVerified,
      aadharVerificationDate: member.aadharVerificationDate,
      qrCode: member.qrCode,
      registeredBy: member.registeredBy,
      updatedAt: member.updatedAt,
    }));
    
    res.json(transformedMembers);
  } catch (error) {
    console.error('❌ Error getting all members:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const scanQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;
    
    const parsedData = JSON.parse(qrData);
    const user = await User.findOne({ 
      where: { membershipId: parsedData.membershipId },
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // 🔥 FIXED: Return consistent member data for scanner
    const memberData = {
      id: user.id,
      membershipId: user.membershipId,
      name: user.fullName,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      constituency: user.constituency,
      profilePhoto: user.profilePhoto,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      joinDate: user.createdAt // Alias for compatibility
    };

    res.json({
      success: true,
      member: memberData
    });
  } catch (error) {
    console.error('❌ QR scan error:', error);
    res.status(500).json({ message: 'Invalid QR Code', error: error.message });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    console.log('🔄 Role update request:', { memberId: id, newRole: role, requestedBy: req.user.id });

    if (!['member', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Prevent users from updating their own role
    if (user.id === req.user.id) {
      return res.status(403).json({ message: 'Cannot update your own role' });
    }

    // Only admins can create other admins
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can assign admin role' });
    }

    const oldRole = user.role;
    await user.update({ role });

    console.log('✅ Role updated:', { member: user.fullName, from: oldRole, to: role });

    // Send email notification
    if (oldRole !== role) {
      const emailData = {
        name: user.fullName,
        email: user.email,
        membershipId: user.membershipId,
      };
      
      sendRoleUpdateEmail(emailData, role).catch(error => {
        console.error('Failed to send role update email:', error);
      });
    }

    res.json({
      success: true,
      message: 'Role updated successfully',
      member: {
        id: user.id,
        name: user.fullName,
        fullName: user.fullName,
        email: user.email,
        membershipId: user.membershipId,
        role: user.role,
        oldRole,
        newRole: role
      }
    });
  } catch (error) {
    console.error('❌ Error updating role:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmationText } = req.body;

    console.log('🗑️ Delete request:', { memberId: id, requestedBy: req.user.id, confirmation: confirmationText });

    if (!id) {
      return res.status(400).json({ message: 'Member ID is required' });
    }

    if (confirmationText !== 'DELETE MEMBER') {
      return res.status(400).json({ 
        message: 'Confirmation text required. Type "DELETE MEMBER" to confirm.',
        received: confirmationText,
        expected: 'DELETE MEMBER'
      });
    }

    const member = await User.findByPk(id);
    
    if (!member) {
      // Try finding by membership ID as fallback
      const memberByMembershipId = await User.findOne({ 
        where: { membershipId: id } 
      });
      if (memberByMembershipId) {
        return res.status(400).json({ 
          message: 'Please use the database ID, not membership ID',
          hint: `Database ID for ${memberByMembershipId.fullName} is: ${memberByMembershipId.id}`
        });
      }
      return res.status(404).json({ message: 'Member not found' });
    }

    if (member.id === req.user.id) {
      return res.status(400).json({ 
        message: 'Cannot delete your own account' 
      });
    }

    if (member.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Cannot delete admin accounts' 
      });
    }

    const memberInfo = {
      id: member.id,
      name: member.fullName,
      fullName: member.fullName,
      membershipId: member.membershipId,
      email: member.email,
      role: member.role
    };
    
    // Clean up profile photo file before deleting member
    if (member.profilePhoto && member.profilePhoto.startsWith('uploads/')) {
      const fs = require('fs');
      const path = require('path');
      const profilePhotoPath = path.join(__dirname, '..', member.profilePhoto);
      
      try {
        if (fs.existsSync(profilePhotoPath)) {
          fs.unlinkSync(profilePhotoPath);
          console.log('🗑️ Deleted profile photo for deleted member:', member.profilePhoto);
        }
      } catch (error) {
        console.error('⚠️ Error deleting profile photo for deleted member:', error.message);
        // Don't fail the deletion if file deletion fails
      }
    }
    
    await member.destroy();

    console.log('✅ Member deleted:', memberInfo);

    res.json({
      success: true,
      message: 'Member deleted successfully',
      deletedMember: memberInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error deleting member:', error);
    
    res.status(500).json({ 
      success: false,
      message: 'Server error occurred while deleting member', 
      error: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString()
    });
  }
};

// 🔥 COMPREHENSIVE FIXED updateProfile function
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    console.log('📝 Profile update request:', { 
      userId, 
      fields: Object.keys(updateData),
      aadharProvided: !!(updateData.aadharNumber || updateData.aadhaarNumber)
    });

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 🔥 Helper function to clean empty strings to null
    const cleanEmptyString = (value) => {
      if (typeof value === 'string' && value.trim() === '') {
        return null;
      }
      return value;
    };

    // 🔥 NORMALIZE: Handle both aadhar/aadhaar spellings
    if (updateData.aadhaarNumber !== undefined && updateData.aadharNumber === undefined) {
      updateData.aadharNumber = updateData.aadhaarNumber;
    }

    // Prepare clean update data
    const cleanUpdateData = {};
    
    // Handle all possible fields
    const fieldMappings = {
      fullName: 'fullName',
      fatherName: 'fatherName',
      address: 'address',
      phone: 'phone',
      email: 'email',
      dateOfBirth: 'dateOfBirth',
      occupation: 'occupation',
      constituency: 'constituency',
      gender: 'gender',
      city: 'city',
      state: 'state',
      pincode: 'pincode',
      aadharNumber: 'aadharNumber'
    };

    // Process each field
    Object.entries(fieldMappings).forEach(([key, dbField]) => {
      if (updateData[key] !== undefined) {
        cleanUpdateData[dbField] = cleanEmptyString(updateData[key]);
      }
    });

    // Handle profile photo with cleanup of old file
    if (req.file) {
      // Get the old profile photo path before updating
      const oldProfilePhoto = user.profilePhoto;
      
      // Set new profile photo path
      cleanUpdateData.profilePhoto = `uploads/${req.file.filename}`;
      
      // Clean up old profile photo file if it exists
      if (oldProfilePhoto && oldProfilePhoto.startsWith('uploads/')) {
        const fs = require('fs');
        const path = require('path');
        const oldFilePath = path.join(__dirname, '..', oldProfilePhoto);
        
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log('🗑️ Deleted old profile photo:', oldProfilePhoto);
          }
        } catch (error) {
          console.error('⚠️ Error deleting old profile photo:', error.message);
          // Don't fail the update if file deletion fails
        }
      }
    }

    console.log('🧹 Cleaned update data:', cleanUpdateData);

    await user.update(cleanUpdateData);

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    console.log('✅ Profile updated successfully');

    // 🔥 Return consistent structure
    const responseData = {
      id: updatedUser.id,
      membershipId: updatedUser.membershipId,
      name: updatedUser.fullName,
      fullName: updatedUser.fullName,
      fatherName: updatedUser.fatherName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      dateOfBirth: updatedUser.dateOfBirth,
      occupation: updatedUser.occupation,
      address: updatedUser.address,
      city: updatedUser.city,
      state: updatedUser.state,
      pincode: updatedUser.pincode,
      constituency: updatedUser.constituency,
      gender: updatedUser.gender,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      isActive: updatedUser.isActive,
      profilePhoto: updatedUser.profilePhoto,
      qrCode: updatedUser.qrCode,
      qrCodeData: updatedUser.qrCodeData,
      aadharNumber: updatedUser.aadharNumber,
      aadharVerified: updatedUser.aadharVerified,
      aadharVerificationDate: updatedUser.aadharVerificationDate,
      registeredBy: updatedUser.registeredBy,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: responseData,
      user: responseData // For backward compatibility
    });

  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error occurred while updating profile', 
      error: error.message 
    });
  }
};

const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Getting member by ID:', id);

    const member = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!member) {
      console.log('❌ Member not found with ID:', id);
      return res.status(404).json({ 
        success: false,
        message: 'Member not found' 
      });
    }

    // Return complete member data structure
    const memberData = {
      id: member.id,
      membershipId: member.membershipId,
      fullName: member.fullName,
      fatherName: member.fatherName,
      email: member.email,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth,
      occupation: member.occupation,
      address: member.address,
      city: member.city,
      state: member.state,
      pincode: member.pincode,
      constituency: member.constituency,
      gender: member.gender,
      role: member.role,
      isVerified: member.isVerified,
      isActive: member.isActive,
      profilePhoto: member.profilePhoto,
      qrCode: member.qrCode,
      qrCodeData: member.qrCodeData,
      aadharNumber: member.aadharNumber,
      aadharVerified: member.aadharVerified,
      aadharVerificationDate: member.aadharVerificationDate,
      registeredBy: member.registeredBy,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    };

    console.log('✅ Member found:', member.fullName);
    res.json(memberData);

  } catch (error) {
    console.error('❌ Error getting member by ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Don't forget to add getMemberById to your module.exports at the bottom:
module.exports = { 
  getProfile, 
  getAllMembers, 
  scanQRCode, 
  updateMemberRole, 
  deleteMember,
  updateProfile,
  getMemberById  // <-- Add this line
};