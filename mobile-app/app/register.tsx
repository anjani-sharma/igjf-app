import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

interface FormDataType {
  aadharNumber: string;
  fullName: string;
  fatherName: string;
  address: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  occupation: string;
  constituency: string;
  gender: string;
  city: string;
  state: string;
  pincode: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const [formData, setFormData] = useState<FormDataType>({
    // 🔥 FIXED: Using consistent field names that match backend
    aadharNumber: '',      // Backend expects this spelling
    fullName: '',
    fatherName: '',
    address: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    occupation: '',
    constituency: '',
    gender: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    confirmPassword: '',
  });

  const [aadharValidated, setAadharValidated] = useState(false);
  const [aadharLoading, setAadharLoading] = useState(false);
  const [useAadharVerification, setUseAadharVerification] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef(null);

  // Aadhaar validation function
  const validateAadhar = (aadharNumber) => {
    const cleanAadhar = aadharNumber.replace(/[\s-]/g, '');
    
    if (!/^\d{12}$/.test(cleanAadhar)) {
      return false;
    }
    
    // Verhoeff algorithm for Aadhaar validation
    const verhoeffTable = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];
    
    const multiplicationTable = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];
    
    let checksum = 0;
    const digits = cleanAadhar.split('').map(Number).reverse();
    
    for (let i = 0; i < digits.length; i++) {
      checksum = verhoeffTable[checksum][multiplicationTable[i % 8][digits[i]]];
    }
    
    return checksum === 0;
  };

  // Format Aadhaar number with spaces
  const formatAadhar = (value) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  // 🔥 FIXED: Handle Aadhaar input with consistent field naming
  const handleAadharChange = async (text) => {
    const formatted = formatAadhar(text);
    setFormData({...formData, aadharNumber: formatted}); // Use consistent field name
    setAadharValidated(false);
    
    const cleanAadhar = text.replace(/[\s-]/g, '');
    
    if (cleanAadhar.length === 12) {
      setAadharLoading(true);
      
      if (validateAadhar(cleanAadhar)) {
        setTimeout(() => {
          // Mock Aadhaar data - in real implementation, this would come from UIDAI API
          const mockAadharData = {
            name: 'Rajesh Kumar Sharma',
            fatherName: 'Ram Bahadur Sharma',
            address: 'House No 123, Ward No 5, Kalimpong, West Bengal - 734301',
            dateOfBirth: '1990-05-15',
            phone: '+91-9876543210'
          };
          
          setFormData(prev => ({
            ...prev,
            fullName: mockAadharData.name,
            fatherName: mockAadharData.fatherName,
            address: mockAadharData.address,
            dateOfBirth: mockAadharData.dateOfBirth,
            phone: mockAadharData.phone
          }));
          
          setAadharValidated(true);
          setAadharLoading(false);
          Alert.alert(
            'Aadhaar Verified!', 
            'Your details have been auto-filled from Aadhaar. Please verify and update if needed.',
            [{ text: 'OK' }]
          );
        }, 2000);
      } else {
        setAadharLoading(false);
        Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number');
      }
    }
  };

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
        Alert.alert('Permission Required', 'Camera permission is required to take a selfie');
        return;
      }
    }
    
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        
        setPhoto(photo);
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
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    hideImageOptions();
  };

  // 🔥 FIXED: Registration function with consistent field names
  const handleRegister = async () => {
    try {
      if (!photo) {
        Alert.alert('Error', 'Please take a selfie or select a profile photo');
        return;
      }

      if (useAadharVerification === true && !aadharValidated) {
        Alert.alert('Error', 'Please enter and validate your Aadhaar number');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      // Validate required fields based on verification method
      const requiredFields = ['fullName', 'fatherName', 'address', 'phone', 'dateOfBirth', 'password'];
      if (useAadharVerification === true) {
        requiredFields.push('aadharNumber');
      }

      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Validate email format if provided
      if (formData.email && formData.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          Alert.alert('Error', 'Please enter a valid email address');
          return;
        }
      }

      // Validate phone number
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return;
      }

      setLoading(true);

      console.log('📝 Starting registration with data:', {
        ...formData,
        password: '***',
        confirmPassword: '***',
        aadharNumber: formData.aadharNumber ? formData.aadharNumber.substring(0, 4) + '***' : null
      });

      // 🔥 FIXED: Prepare form data with consistent field names
      const registerFormData = new FormData();
      
      // Add photo
      registerFormData.append('profilePhoto', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      // Add form fields (excluding confirmPassword)
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword' && formData[key]) {
          registerFormData.append(key, formData[key]);
        }
      });

      // Add verification method info
      registerFormData.append('verificationMethod', useAadharVerification ? 'aadhaar' : 'manual');
      registerFormData.append('aadharVerified', aadharValidated.toString());

      console.log('🌐 Sending registration request...');

      const response = await fetch('https://igjf-app.onrender.com/api/auth/register', {
        method: 'POST',
        body: registerFormData,
        
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Registration successful');
        Alert.alert(
          'Registration Successful!',
          'Welcome to Gorkha Janshakti Front! You can now login with your credentials.',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      } else {
        console.log('❌ Registration failed:', data);
        Alert.alert('Registration Failed', data.message || 'Please try again');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      Alert.alert('Error', 'Registration failed: ' + error.message);
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
        
        <View style={styles.logoSection}>
          <Text style={styles.partyName}>GORKHA JANSHAKTI FRONT</Text>
          <Text style={styles.title}>Register</Text>
        </View>
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {/* Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={showImagePickerOptions} style={styles.photoContainer}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.photo} />
            ) : (
              <View style={styles.placeholderPhoto}>
                <Ionicons name="camera" size={40} color="#999" />
                <Text style={styles.photoButtonText}>Take Selfie or{'\n'}Select Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {photo && (
            <TouchableOpacity 
              style={styles.changePhotoButton}
              onPress={showImagePickerOptions}
            >
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verification Method Selection */}
        {useAadharVerification === null && (
          <View style={styles.verificationMethodSection}>
            <Text style={styles.sectionTitle}>Choose Registration Method</Text>
            <Text style={styles.sectionDescription}>
              You can either verify using your Aadhaar card for quick auto-fill, or fill the details manually.
            </Text>
            
            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => setUseAadharVerification(true)}
            >
              <View style={styles.methodButtonContent}>
                <Ionicons name="card" size={24} color="#2D5016" />
                <View style={styles.methodButtonText}>
                  <Text style={styles.methodButtonTitle}>Use Aadhaar Verification</Text>
                  <Text style={styles.methodButtonSubtitle}>Auto-fill details from Aadhaar</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.methodButton}
              onPress={() => setUseAadharVerification(false)}
            >
              <View style={styles.methodButtonContent}>
                <Ionicons name="create" size={24} color="#2D5016" />
                <View style={styles.methodButtonText}>
                  <Text style={styles.methodButtonTitle}>Fill Details Manually</Text>
                  <Text style={styles.methodButtonSubtitle}>Enter all details yourself</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Form Fields */}
        {useAadharVerification !== null && (
          <View style={styles.form}>
            {/* Method Selection Header */}
            <View style={styles.selectedMethodHeader}>
              <View style={styles.selectedMethodInfo}>
                <Ionicons 
                  name={useAadharVerification ? "card" : "create"} 
                  size={20} 
                  color="#2D5016" 
                />
                <Text style={styles.selectedMethodText}>
                  {useAadharVerification ? 'Aadhaar Verification' : 'Manual Entry'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeMethodButton}
                onPress={() => {
                  setUseAadharVerification(null);
                  setAadharValidated(false);
                  setFormData({
                    aadharNumber: '',
                    fullName: '',
                    fatherName: '',
                    address: '',
                    phone: '',
                    email: '',
                    dateOfBirth: '',
                    occupation: '',
                    constituency: '',
                    gender: '',
                    city: '',
                    state: '',
                    pincode: '',
                    password: '',
                    confirmPassword: '',
                  });
                }}
              >
                <Text style={styles.changeMethodText}>Change Method</Text>
              </TouchableOpacity>
            </View>

            {/* 🔥 FIXED: Aadhaar Number Field with consistent naming */}
            {useAadharVerification && (
              <View style={styles.aadharContainer}>
                <View style={styles.aadharInputContainer}>
                  <TextInput
                    style={[
                      styles.input, 
                      styles.aadharInput,
                      aadharValidated && styles.validatedInput
                    ]}
                    placeholder="Aadhaar Number (XXXX XXXX XXXX) *"
                    placeholderTextColor="#999"
                    value={formData.aadharNumber}
                    onChangeText={handleAadharChange}
                    keyboardType="numeric"
                    maxLength={14} // 12 digits + 2 spaces
                  />
                  {aadharLoading && (
                    <View style={styles.aadharLoader}>
                      <Text style={styles.loaderText}>Verifying...</Text>
                    </View>
                  )}
                  {aadharValidated && (
                    <View style={styles.aadharSuccess}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.successText}>Verified</Text>
                    </View>
                  )}
                </View>
                {aadharValidated && (
                  <Text style={styles.aadharNote}>
                    ✓ Details auto-filled from Aadhaar. Please verify and update if needed.
                  </Text>
                )}
              </View>
            )}

            {/* Personal Details */}
            <TextInput
              style={[styles.input, aadharValidated && styles.autoFilledInput]}
              placeholder="Full Name *"
              placeholderTextColor="#999"
              value={formData.fullName}
              onChangeText={(text) => setFormData({...formData, fullName: text})}
              editable={true}
            />

            <TextInput
              style={[styles.input, aadharValidated && styles.autoFilledInput]}
              placeholder="Father's Name *"
              placeholderTextColor="#999"
              value={formData.fatherName}
              onChangeText={(text) => setFormData({...formData, fatherName: text})}
              editable={true}
            />

            <TextInput
              style={[styles.input, aadharValidated && styles.autoFilledInput]}
              placeholder="Address *"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={formData.address}
              onChangeText={(text) => setFormData({...formData, address: text})}
              editable={true}
            />

            <TextInput
              style={[styles.input, aadharValidated && styles.autoFilledInput]}
              placeholder="Phone Number *"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({...formData, phone: text})}
              editable={true}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
            />

            <TextInput
              style={[styles.input, aadharValidated && styles.autoFilledInput]}
              placeholder="Date of Birth (YYYY-MM-DD) *"
              placeholderTextColor="#999"
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({...formData, dateOfBirth: text})}
              editable={true}
            />

            <TextInput
              style={styles.input}
              placeholder="Gender"
              placeholderTextColor="#999"
              value={formData.gender}
              onChangeText={(text) => setFormData({...formData, gender: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Occupation"
              placeholderTextColor="#999"
              value={formData.occupation}
              onChangeText={(text) => setFormData({...formData, occupation: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#999"
              value={formData.city}
              onChangeText={(text) => setFormData({...formData, city: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="State"
              placeholderTextColor="#999"
              value={formData.state}
              onChangeText={(text) => setFormData({...formData, state: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Pincode"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={formData.pincode}
              onChangeText={(text) => setFormData({...formData, pincode: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Constituency"
              placeholderTextColor="#999"
              value={formData.constituency}
              onChangeText={(text) => setFormData({...formData, constituency: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor="#999"
              secureTextEntry
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor="#999"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
            />

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Registering...' : 'Register'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text
                  style={styles.loginLinkHighlight}
                  onPress={() => router.replace('/login')}
                >
                  Login here
                </Text>
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={hideImageOptions}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imageOptionsModal}>
            <Text style={styles.modalTitle}>Select Profile Photo</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={openCamera}>
              <Ionicons name="camera" size={24} color="#2D5016" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={pickImageFromGallery}>
              <Ionicons name="images" size={24} color="#2D5016" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            {photo && (
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
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
  },
  partyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  photoSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 10,
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
  changePhotoButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  changePhotoText: {
    color: '#2D5016',
    fontSize: 14,
    fontWeight: '500',
  },
  verificationMethodSection: {
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    lineHeight: 22,
  },
  methodButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  methodButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  methodButtonText: {
    flex: 1,
    marginLeft: 15,
  },
  methodButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  methodButtonSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  selectedMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginBottom: 20,
  },
  selectedMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginLeft: 8,
  },
  changeMethodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D5016',
  },
  changeMethodText: {
    color: '#2D5016',
    fontSize: 12,
    fontWeight: '500',
  },
  form: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  aadhaarContainer: {
    marginBottom: 20,
  },
  aadhaarInputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  aadhaarInput: {
    paddingRight: 80,
  },
  validatedInput: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  autoFilledInput: {
    backgroundColor: '#F0F8FF',
    borderColor: '#4CAF50',
  },
  aadhaarLoader: {
    position: 'absolute',
    right: 15,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loaderText: {
    color: '#666',
    fontSize: 12,
    marginRight: 5,
  },
  aadhaarSuccess: {
    position: 'absolute',
    right: 15,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  aadhaarNote: {
    color: '#4CAF50',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: -15,
    marginBottom: 15,
    paddingLeft: 5,
  },
  registerButton: {
    backgroundColor: '#2D5016',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    color: '#666',
    fontSize: 16,
  },
  loginLinkHighlight: {
    color: '#2D5016',
    fontWeight: 'bold',
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

   aadharContainer: {
    marginBottom: 20,
  },
  aadharInputContainer: {
    position: 'relative',
  },
  aadharInput: {
    paddingRight: 80,
  },
  aadharLoader: {
    position: 'absolute',
    right: 15,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aadharSuccess: {
    position: 'absolute',
    right: 15,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aadharNote: {
    color: '#4CAF50',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: -15,
    marginBottom: 15,
    paddingLeft: 5,
  },
});
