const User = require('../models/User');
const { sendRoleUpdateEmail } = require('../services/emailService');

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    // Format response to match mobile app expectations
    const formattedUser = {
      _id: user.id,
      membershipId: user.membershipId,
      personalInfo: {
        fullName: user.fullName,
        fatherName: user.fatherName,
        address: user.address,
        phone: user.phone,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        occupation: user.occupation,
        constituency: user.constituency
      },
      profilePhoto: user.profilePhoto,
      role: user.role,
      qrCode: user.qrCode,
      qrCodeData: user.qrCodeData,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    res.json(formattedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllMembers = async (req, res) => {
  try {
    const members = await User.findAll({
      attributes: { exclude: ['password', 'qrCodeData'] }
    });
    
    // Format response for mobile app
    const formattedMembers = members.map(user => ({
      _id: user.id,
      membershipId: user.membershipId,
      personalInfo: {
        fullName: user.fullName,
        fatherName: user.fatherName,
        address: user.address,
        phone: user.phone,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        occupation: user.occupation,
        constituency: user.constituency
      },
      profilePhoto: user.profilePhoto,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    }));
    
    res.json(formattedMembers);
  } catch (error) {
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

    res.json({
      membershipId: user.membershipId,
      name: user.fullName,
      phone: user.phone,
      email: user.email,
      constituency: user.constituency,
      profilePhoto: user.profilePhoto,
      joinDate: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Invalid QR Code', error: error.message });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['member', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Find and update user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const oldRole = user.role;

    // Update role
    await user.update({ role });

    // Send role update email if role changed
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
      message: 'Role updated successfully',
      member: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmationText } = req.body;

    // Validate member ID
    if (!id) {
      return res.status(400).json({ message: 'Member ID is required' });
    }

    // Security check - require confirmation text
    if (confirmationText !== 'DELETE MEMBER') {
      return res.status(400).json({ 
        message: 'Confirmation text required. Type "DELETE MEMBER" to confirm.',
        received: confirmationText,
        expected: 'DELETE MEMBER'
      });
    }

    // Find the member to delete
    const member = await User.findByPk(id);
    
    if (!member) {
      // Let's also search by membershipId in case there's confusion
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

    // Prevent admin from deleting themselves
    if (member.id === req.user.id) {
      return res.status(400).json({ 
        message: 'Cannot delete your own account' 
      });
    }

    // Prevent deleting other admins (optional security measure)
    if (member.role === 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ 
        message: 'Cannot delete other admin accounts' 
      });
    }

    // Store member info for response before deletion
    const memberInfo = {
      name: member.fullName,
      membershipId: member.membershipId,
      email: member.email,
      role: member.role
    };
    
    // Delete the member
    await member.destroy();

    res.json({
      success: true,
      message: 'Member deleted successfully',
      deletedMember: memberInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error deleting member:', error);
    
    res.status(500).json({ 
      success: false,
      message: 'Server error occurred while deleting member', 
      error: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString()
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      fullName, 
      fatherName, 
      address, 
      phone, 
      email, 
      dateOfBirth, 
      occupation, 
      constituency 
    } = req.body;

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: userId } // Exclude current user
        } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Prepare update data
    const updateData = {};
    
    // Only update fields that are provided
    if (fullName !== undefined) updateData.fullName = fullName;
    if (fatherName !== undefined) updateData.fatherName = fatherName;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (occupation !== undefined) updateData.occupation = occupation;
    if (constituency !== undefined) updateData.constituency = constituency;

    // Handle profile photo update
    if (req.file) {
      updateData.profilePhoto = `/uploads/${req.file.filename}`;
    }

    // Update the user
    await user.update(updateData);

    // Get updated user data (excluding password)
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    // Format response to match mobile app expectations
    const responseData = {
      _id: updatedUser.id,
      membershipId: updatedUser.membershipId,
      personalInfo: {
        fullName: updatedUser.fullName,
        fatherName: updatedUser.fatherName,
        address: updatedUser.address,
        phone: updatedUser.phone,
        email: updatedUser.email,
        dateOfBirth: updatedUser.dateOfBirth,
        occupation: updatedUser.occupation,
        constituency: updatedUser.constituency
      },
      profilePhoto: updatedUser.profilePhoto,
      role: updatedUser.role,
      qrCode: updatedUser.qrCode,
      qrCodeData: updatedUser.qrCodeData,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    res.json({
      message: 'Profile updated successfully',
      profile: responseData
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      message: 'Server error occurred while updating profile', 
      error: error.message 
    });
  }
};

module.exports = { 
  getProfile, 
  getAllMembers, 
  scanQRCode, 
  updateMemberRole, 
  deleteMember,
  updateProfile 
};