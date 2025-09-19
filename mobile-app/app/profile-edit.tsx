// app/profile-edit.tsx - Enhanced with all user profile fields
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme for consistency
const Theme = {
  colors: {
    primary: '#1B2951',
    secondary: '#2D5016',
    accent: '#E0E0E0',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: {
      primary: '#333333',
      secondary: '#666666',
      onPrimary: '#ffffff',
      onSecondary: '#ffffff',
    },
    border: '#e0e0e0',
    success: '#4CAF50',
    error: '#F44336',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' as const },
    h2: { fontSize: 28, fontWeight: 'bold' as const },
    h3: { fontSize: 24, fontWeight: 'bold' as const },
    h4: { fontSize: 20, fontWeight: 'bold' as const },
    body1: { fontSize: 16, fontWeight: 'normal' as const },
    body2: { fontSize: 14, fontWeight: 'normal' as const },
    caption: { fontSize: 12, fontWeight: 'normal' as const },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

export default function ProfileEdit() {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({
    // Basic Info
    fullName: '',
    fatherName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    occupation: '',
    
    // Address Info
    address: '',
    city: '',
    state: '',
    pincode: '',
    constituency: '',
    
    // Additional Info
    aadharNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || user.name || '',
        fatherName: user.fatherName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: formatDateForInput(user.dateOfBirth) || '',
        gender: user.gender || '',
        occupation: user.occupation || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        constituency: user.constituency || '',
        aadharNumber: user.aadharNumber || '',
      });
    }
  }, [user]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    } catch {
      return '';
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }
    
    // Phone validation
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,15}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }
    
    // Date validation
    if (formData.dateOfBirth) {
      const date = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      if (age < 18 || age > 100) {
        newErrors.dateOfBirth = 'Age must be between 18 and 100 years';
      }
    }
    
    // Aadhar number validation (if provided)
    if (formData.aadharNumber && formData.aadharNumber.trim()) {
      if (!/^\d{12}$/.test(formData.aadharNumber.replace(/\s/g, ''))) {
        newErrors.aadharNumber = 'Aadhar number must be 12 digits';
      }
    }
    
    // Pincode validation (if provided)
    if (formData.pincode && formData.pincode.trim()) {
      if (!/^\d{6}$/.test(formData.pincode)) {
        newErrors.pincode = 'Pincode must be 6 digits';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the highlighted fields');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      
      // Prepare the data to match backend expectations
      const updateData = {
        fullName: formData.fullName,
        fatherName: formData.fatherName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        occupation: formData.occupation,
        address: formData.address,
        constituency: formData.constituency,
        // Add new fields if your backend supports them
        gender: formData.gender,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        aadharNumber: formData.aadharNumber,
      };

      const response = await fetch('http://192.168.1.65:5000/api/members/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the user context with new data
        const updatedUser = {
          ...user,
          ...formData,
          name: formData.fullName, // For compatibility
        };
        
        await login(token, updatedUser);
        
        Alert.alert(
          'Success!',
          'Your profile has been updated successfully.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Update Failed', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>Edit Profile</Text>
        
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={[styles.saveButtonText, loading && styles.disabledText]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            
            {/* Personal Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={[styles.input, errors.fullName && styles.errorInput]}
                  value={formData.fullName}
                  onChangeText={(value) => handleInputChange('fullName', value)}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                />
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Father's Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fatherName}
                  onChangeText={(value) => handleInputChange('fatherName', value)}
                  placeholder="Enter father's name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.errorInput]}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, errors.phone && styles.errorInput]}
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
                {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  style={[styles.input, errors.dateOfBirth && styles.errorInput]}
                  value={formData.dateOfBirth}
                  onChangeText={(value) => handleInputChange('dateOfBirth', value)}
                  placeholder="YYYY-MM-DD"
                />
                {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gender</Text>
                <TextInput
                  style={styles.input}
                  value={formData.gender}
                  onChangeText={(value) => handleInputChange('gender', value)}
                  placeholder="Male/Female/Other"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Occupation</Text>
                <TextInput
                  style={styles.input}
                  value={formData.occupation}
                  onChangeText={(value) => handleInputChange('occupation', value)}
                  placeholder="Enter your occupation"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Address Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  placeholder="Enter your complete address"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(value) => handleInputChange('city', value)}
                  placeholder="Enter your city"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(value) => handleInputChange('state', value)}
                  placeholder="Enter your state"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={[styles.input, errors.pincode && styles.errorInput]}
                  value={formData.pincode}
                  onChangeText={(value) => handleInputChange('pincode', value)}
                  placeholder="Enter 6-digit pincode"
                  keyboardType="numeric"
                  maxLength={6}
                />
                {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Constituency</Text>
                <TextInput
                  style={styles.input}
                  value={formData.constituency}
                  onChangeText={(value) => handleInputChange('constituency', value)}
                  placeholder="Enter your constituency"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Additional Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Aadhar Number (Optional)</Text>
                <TextInput
                  style={[styles.input, errors.aadharNumber && styles.errorInput]}
                  value={formData.aadharNumber}
                  onChangeText={(value) => handleInputChange('aadharNumber', value)}
                  placeholder="Enter 12-digit Aadhar number"
                  keyboardType="numeric"
                  maxLength={12}
                />
                {errors.aadharNumber && <Text style={styles.errorText}>{errors.aadharNumber}</Text>}
              </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>📝 Note:</Text>
              <Text style={styles.infoText}>
                • Fields marked with * are required{'\n'}
                • Your Membership ID cannot be changed{'\n'}
                • All information will be kept confidential{'\n'}
                • Updated information may take a few minutes to reflect
              </Text>
            </View>

            {/* Read-only Information */}
            <View style={styles.readOnlySection}>
              <Text style={styles.sectionTitle}>Membership Information</Text>
              <View style={styles.readOnlyCard}>
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Membership ID:</Text>
                  <Text style={styles.readOnlyValue}>{user?.membershipId}</Text>
                </View>
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Member Since:</Text>
                  <Text style={styles.readOnlyValue}>
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Status:</Text>
                  <Text style={[styles.readOnlyValue, styles.statusText]}>
                    {user?.isVerified ? 'Verified ✓' : 'Pending Verification'}
                  </Text>
                </View>
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  
  header: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  backButton: {
    minWidth: 60,
  },
  
  backButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.onPrimary,
  },
  
  title: {
    ...Theme.typography.h4,
    color: Theme.colors.text.onPrimary,
    textAlign: 'center',
    flex: 1,
  },
  
  saveButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  
  saveButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.success,
    fontWeight: '600',
  },

  disabledButton: {
    opacity: 0.6,
  },

  disabledText: {
    color: Theme.colors.text.secondary,
  },
  
  keyboardView: {
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
  },
  
  form: {
    padding: Theme.spacing.lg,
  },
  
  section: {
    marginBottom: Theme.spacing.xl,
  },
  
  sectionTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Theme.colors.primary,
  },
  
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  
  label: {
    ...Theme.typography.body2,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  
  input: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm + 2,
    borderRadius: Theme.borderRadius.md,
    fontSize: Theme.typography.body1.fontSize,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    color: Theme.colors.text.primary,
  },
  
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Theme.spacing.sm + 2,
  },

  errorInput: {
    borderColor: Theme.colors.error,
    borderWidth: 1.5,
  },

  errorText: {
    ...Theme.typography.caption,
    color: Theme.colors.error,
    marginTop: Theme.spacing.xs,
  },
  
  infoCard: {
    backgroundColor: '#E8F5E8',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginVertical: Theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.success,
  },

  infoTitle: {
    ...Theme.typography.body2,
    fontWeight: '600',
    color: Theme.colors.secondary,
    marginBottom: Theme.spacing.xs,
  },
  
  infoText: {
    ...Theme.typography.caption,
    color: Theme.colors.secondary,
    lineHeight: 16,
  },

  readOnlySection: {
    marginTop: Theme.spacing.lg,
  },

  readOnlyCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },

  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xs,
  },

  readOnlyLabel: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    fontWeight: '500',
  },

  readOnlyValue: {
    ...Theme.typography.body2,
    color: Theme.colors.text.primary,
    fontWeight: '600',
  },

  statusText: {
    color: Theme.colors.success,
  },
});