import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, Camera } from "expo-camera";
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function QRScanner() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [memberData, setMemberData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return; // Prevent multiple scans
    
    setScanned(true);
    setScanning(false);
    setLoading(true);
    
    try {
      console.log('QR Code scanned:', data);
      
      // Parse QR data
      let qrData;
      try {
        qrData = JSON.parse(data);
      } catch (parseError) {
        // If it's not JSON, treat it as membership ID
        qrData = { membershipId: data };
      }

      console.log('Parsed QR data:', qrData);

      const token = await AsyncStorage.getItem('token');
      
      // FIXED: Use correct API endpoint and handle network issues
      const response = await fetch('https://igjf-app.onrender.com/api/members/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          qrData: typeof qrData === 'string' ? qrData : JSON.stringify(qrData),
          membershipId: qrData.membershipId || data 
        }),
      });

      console.log('API Response status:', response.status);

      const result = await response.json();
      console.log('API Response data:', result);

      if (response.ok && (result.member || result.success)) {
        const member = result.member || result.data;
        setMemberData(member);
        setModalVisible(true);
      } else {
        Alert.alert(
          'Member Not Found', 
          result.message || 'Invalid QR code or member not found',
          [{ text: 'OK', onPress: resetScanner }]
        );
      }
    } catch (error) {
      console.error('Scan error:', error);
      
      let errorMessage = 'Failed to verify member';
      
      if (error.message === 'Network request failed') {
        errorMessage = 'Cannot connect to server. Please check:\n• Internet connection\n• Server is running\n• Correct server address';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      }

      Alert.alert(
        'Scan Error', 
        errorMessage,
        [{ text: 'Try Again', onPress: resetScanner }]
      );
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanning(true);
    setMemberData(null);
    setModalVisible(false);
    setLoading(false);
  };

  const verifyMember = () => {
    Alert.alert(
      'Member Verified',
      `${memberData?.name || memberData?.fullName} has been verified successfully.`,
      [{ text: 'OK', onPress: resetScanner }]
    );
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" color="#2D5016" />
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>Camera permission denied</Text>
          <Text style={styles.subMessage}>Please enable camera access in settings to scan QR codes</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* FIXED: Header with absolute positioning */}
      <View style={styles.headerOverlay}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>QR Scanner</Text>
            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      </View>

      {/* FIXED: Camera with proper absolute positioning */}
      {scanning && (
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "pdf417"],
          }}
        >
          {/* FIXED: Overlay with absolute positioning */}
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanText}>
              Point camera at member's QR code
            </Text>
          </View>
        </CameraView>
      )}

      {/* Loading state */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2D5016" />
          <Text style={styles.loadingText}>Verifying member...</Text>
        </View>
      )}

      {/* Processing state */}
      {!scanning && !modalVisible && !loading && (
        <View style={styles.messageContainer}>
          <Text style={styles.message}>Processing QR code...</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetScanner}>
            <Text style={styles.resetButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FIXED: Member Info Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Member Verification</Text>
            
            {memberData && (
              <View style={styles.memberInfo}>
                <View style={styles.memberDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name:</Text>
                    <Text style={styles.detailValue}>
                      {memberData.name || memberData.fullName || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Membership ID:</Text>
                    <Text style={styles.detailValue}>
                      {memberData.membershipId || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>
                      {memberData.email || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>
                      {memberData.phone || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Role:</Text>
                    <Text style={[styles.detailValue, styles.roleText]}>
                      {(memberData.role || 'member').toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[
                      styles.detailValue, 
                      memberData.isActive ? styles.activeText : styles.inactiveText
                    ]}>
                      {memberData.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                  
                  {memberData.createdAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Member Since:</Text>
                      <Text style={styles.detailValue}>
                        {new Date(memberData.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.verificationStatus}>
                  <Text style={styles.verifiedText}>✅ VERIFIED MEMBER</Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={verifyMember}
              >
                <Text style={styles.verifyButtonText}>Mark as Verified</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={resetScanner}
              >
                <Text style={styles.scanAgainButtonText}>Scan Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // FIXED: Header with proper absolute positioning
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(27, 41, 81, 0.9)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  placeholder: {
    width: 60, // Same as backButton for centering
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  // FIXED: Camera with absolute positioning
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // FIXED: Overlay with proper positioning
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#2D5016',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#000',
  },
  message: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#2D5016',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#2D5016',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1B2951',
  },
  memberInfo: {
    marginBottom: 25,
  },
  memberDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  detailValue: {
    color: '#212529',
    flex: 2,
    textAlign: 'right',
  },
  roleText: {
    fontWeight: 'bold',
    color: '#2D5016',
  },
  activeText: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  inactiveText: {
    color: '#dc3545',
    fontWeight: 'bold',
  },
  verificationStatus: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifiedText: {
    color: '#155724',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  verifyButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scanAgainButton: {
    backgroundColor: '#2D5016',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  scanAgainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});