import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
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

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setScanning(false);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/members/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData: data }),
      });

      const result = await response.json();

      if (response.ok && result.member) {
        setMemberData(result.member);
        setModalVisible(true);
      } else {
        Alert.alert('Invalid QR Code', 'Member not found or invalid QR code');
        resetScanner();
      }
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Error', 'Failed to verify member');
      resetScanner();
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanning(true);
    setMemberData(null);
    setModalVisible(false);
  };

  const verifyMember = () => {
    Alert.alert(
      'Member Verified',
      `${memberData?.name} has been verified successfully.`,
      [{ text: 'OK', onPress: resetScanner }]
    );
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>No access to camera</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.title}>QR Scanner</Text>
      </View>

      {/* Camera View */}
      {scanning && (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.scanner}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "pdf417"],
            }}
          >
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanText}>
                Point camera at member's QR code
              </Text>
            </View>
          </CameraView>
        </View>
      )}

      {!scanning && !modalVisible && (
        <View style={styles.messageContainer}>
          <Text style={styles.message}>Processing QR code...</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetScanner}>
            <Text style={styles.resetButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Member Info Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Member Information</Text>
            
            {memberData && (
              <View style={styles.memberInfo}>
                <View style={styles.memberDetails}>
                  <Text style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Name: </Text>
                    {memberData.name}
                  </Text>
                  <Text style={styles.detailItem}>
                    <Text style={styles.detailLabel}>ID: </Text>
                    {memberData.membershipId}
                  </Text>
                  <Text style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Email: </Text>
                    {memberData.email}
                  </Text>
                  <Text style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Role: </Text>
                    {memberData.role || 'Member'}
                  </Text>
                  <Text style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Member Since: </Text>
                    {new Date(memberData.createdAt).toLocaleDateString()}
                  </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#1B2951',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    margin: 20,
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
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#2D5016',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
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
    alignItems: 'center',
    marginBottom: 20,
  },
  memberDetails: {
    width: '100%',
    marginBottom: 15,
  },
  detailItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#1B2951',
  },
  verificationStatus: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  verifiedText: {
    color: '#2D5016',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  verifyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
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
    marginLeft: 10,
  },
  scanAgainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});