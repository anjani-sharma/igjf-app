// mobile-app/app/profile-edit.tsx - Enhanced with Photo Update
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

interface FormData {
  fullName: string;
  fatherName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  occupation: string;
  address: string;
  constituency: string;
  gender: string;
  city: string;
  state: string;
  pincode: string;
  aadharNumber: string;
}

export default function ProfileEditScreen() {
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    fullName: user?.fullName || user?.name || '',
    fatherName: user?.fatherName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    occupation: user?.occupation || '',
    address: user?.address || '',
    constituency: user?.constituency || '',
    gender: user?.gender || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    aadharNumber: user?.aadharNumber || '',
  });

  // Photo-related state
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoChanged, setPhotoChanged] = useState(false);
  const camera = useRef<CameraView>(null);

  // Get current profile photo URI
  const getProfileImageUri = () => {
    if (photo) return photo.uri;
    if (user?.profilePhoto) {
      return user.profilePhoto.startsWith('http') 
        ? user.profilePhoto 
        : `http://192.168.1.65:5000/${user.profilePhoto}`;
    }
    return null;
  };

  // Photo picker functions
  const showImagePickerOptions = () => {
    setShowImageOptions(true);
  };

  const hideImageOptions = () => {
    setShowImageOptions(false);
  };

  const openCamera = async () => {
    hideImageOptions();
    
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const permissionResponse = await requestPermission();
      if (!permissionResponse.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take a photo');
        return;
      }
    }
    
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (camera.current) {
      try {
        const newPhoto = await camera.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        
        setPhoto(newPhoto);
        setPhotoChanged(true);
        setShowCamera(false);
      } catch (error: any) {
        Alert.alert('Error', 'Failed to take picture: ' + error.message);
      }
    }
  };

  const pickImageFromGallery = async () => {
    hideImageOptions();
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is required to select a photo');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0]);
      setPhotoChanged(true);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoChanged(true);
    hideImageOptions();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    
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
      
      // Prepare FormData for multipart request (to handle photo upload)
      const updateFormData = new FormData();
      
      // Add all text fields
      Object.keys(formData).forEach(key => {
        const fieldKey = key as keyof FormData;
        if (formData[fieldKey]) {
          updateFormData.append(key, formData[fieldKey]);
        }
      });

      // Add photo if changed
      if (photoChanged && photo) {
        updateFormData.append('profilePhoto', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
      }

      console.log('🔄 Updating profile...');

      const response = await fetch('http://192.168.1.65:5000/api/members/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it
        },
        body: updateFormData,
      });

      const data = await response.json();

      if (response.ok) {
        // Update the user context with new data
        const updatedUser = {
          ...user,
          ...formData,
          name: formData.fullName, // For compatibility
          profilePhoto: data.profilePhoto || user?.profilePhoto, // Update photo path if changed
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
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Camera permission check
  if (!permission) {
    return <View />;
  }

  // Render camera view
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={camera}
          style={styles.camera}
          facing={facing}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
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
        style={styles.content}
      >
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Profile Photo</Text>
            <TouchableOpacity onPress={showImagePickerOptions} style={styles.photoContainer}>
              {getProfileImageUri() ? (
                <Image source={{ uri: getProfileImageUri() }} style={styles.photo} />
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Ionicons name="person" size={40} color="#999" />
                  <Text style={styles.photoButtonText}>Add Photo</Text>
                </View>
              )}
              {photoChanged && (
                <View style={styles.changeIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.changePhotoButton}
              onPress={showImagePickerOptions}
            >
              <Text style={styles.changePhotoText}>
                {getProfileImageUri() ? 'Change Photo' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                value={formData.fullName}
                onChangeText={(text) => setFormData({...formData, fullName: text})}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Father's Name</Text>
              <TextInput
                style={styles.input}
                value={formData.fatherName}
                onChangeText={(text) => setFormData({...formData, fatherName: text})}
                placeholder="Enter father's name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(text) => setFormData({...formData, phone: text})}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={[styles.input, errors.dateOfBirth && styles.inputError]}
                value={formData.dateOfBirth}
                onChangeText={(text) => setFormData({...formData, dateOfBirth: text})}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
              {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <TextInput
                style={styles.input}
                value={formData.gender}
                onChangeText={(text) => setFormData({...formData, gender: text})}
                placeholder="Enter your gender"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Occupation</Text>
              <TextInput
                style={styles.input}
                value={formData.occupation}
                onChangeText={(text) => setFormData({...formData, occupation: text})}
                placeholder="Enter your occupation"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(text) => setFormData({...formData, address: text})}
                placeholder="Enter your address"
                placeholderTextColor="#999"
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
                onChangeText={(text) => setFormData({...formData, city: text})}
                placeholder="Enter your city"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => setFormData({...formData, state: text})}
                placeholder="Enter your state"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={[styles.input, errors.pincode && styles.inputError]}
                value={formData.pincode}
                onChangeText={(text) => setFormData({...formData, pincode: text})}
                placeholder="Enter your pincode"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Constituency</Text>
              <TextInput
                style={styles.input}
                value={formData.constituency}
                onChangeText={(text) => setFormData({...formData, constituency: text})}
                placeholder="Enter your constituency"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Aadhar Number</Text>
              <TextInput
                style={[styles.input, errors.aadharNumber && styles.inputError]}
                value={formData.aadharNumber}
                onChangeText={(text) => setFormData({...formData, aadharNumber: text})}
                placeholder="Enter your Aadhar number"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
              {errors.aadharNumber && <Text style={styles.errorText}>{errors.aadharNumber}</Text>}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={hideImageOptions}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imageOptionsModal}>
            <Text style={styles.modalTitle}>Update Profile Photo</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={openCamera}>
              <Ionicons name="camera" size={24} color="#2D5016" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={pickImageFromGallery}>
              <Ionicons name="images" size={24} color="#2D5016" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            {getProfileImageUri() && (
              <TouchableOpacity style={[styles.modalOption, styles.removeOption]} onPress={removePhoto}>
                <Ionicons name="trash" size={24} color="#DC3545" />
                <Text style={[styles.modalOptionText, styles.removeOptionText]}>Remove Photo</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.modalCancel} onPress={hideImageOptions}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B2951',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#ccc',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  changeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
  changePhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D5016',
  },
  changePhotoText: {
    color: '#2D5016',
    fontSize: 14,
    fontWeight: '600',
  },
  formSection: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#DC3545',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#DC3545',
    fontSize: 12,
    marginTop: 5,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  cameraButton: {
    padding: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2D5016',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  imageOptionsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  removeOption: {
    borderBottomColor: '#FFE6E6',
  },
  removeOptionText: {
    color: '#DC3545',
  },
  modalCancel: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});