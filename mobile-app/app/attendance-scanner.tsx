// mobile-app/app/attendance-scanner.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, Camera } from "expo-camera";
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/apiUtils';

const Theme = {
  colors: {
    primary: '#1B2951',
    secondary: '#2D5016',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: {
      primary: '#333333',
      secondary: '#666666',
      onPrimary: '#ffffff',
    },
    border: '#eee',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h3: { fontSize: 24, fontWeight: 'bold' as const },
    h4: { fontSize: 20, fontWeight: 'bold' as const },
    body1: { fontSize: 16, fontWeight: 'normal' as const },
    body2: { fontSize: 14, fontWeight: 'normal' as const },
    caption: { fontSize: 12, fontWeight: 'normal' as const },
  },
  borderRadius: {
    md: 8,
    lg: 12,
  },
};

interface AttendanceRecord {
  id: string;
  user: {
    fullName: string;
    membershipId: string;
    phone: string;
    email: string;
    role: string;
  };
  event?: {
    title: string;
    eventDate: string;
  };
  location: string;
  attendanceType: string;
  checkInTime: string;
  status: string;
}

const LOCATIONS = [
  'Central Party Office',
  'Party Office Darjeeling',
  'Party Office Kalimpong',
  'Party Office Kurseong',
];

export default function AttendanceScannerScreen() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [scanType, setScanType] = useState<'event' | 'location'>('event');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const camera = useRef(null);

  // Check permissions and role
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Check if user can mark attendance
  const canMarkAttendance = () => {
    return user?.role === 'admin' || user?.role === 'organizer';
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);
    
    try {
      console.log('📱 QR Code scanned:', data);
      
      let attendanceData;
      
      if (scanType === 'location') {
        if (!selectedLocation) {
          Alert.alert('Error', 'Please select a location first', [
            { text: 'OK', onPress: resetScanner }
          ]);
          return;
        }
        
        attendanceData = {
          qrData: data,
          location: selectedLocation,
          attendanceType: 'location_visit',
          notes: `Location visit at ${selectedLocation}`
        };
      } else {
        // For event attendance, the QR data should contain event info
        attendanceData = {
          qrData: data,
          attendanceType: 'event'
        };
      }

      const response = await apiRequest<{ attendance: AttendanceRecord }>('/events/attendance/mark', {
        method: 'POST',
        body: JSON.stringify(attendanceData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.success && response.data) {
        setAttendanceRecord(response.data.attendance);
        setModalVisible(true);
      } else {
        Alert.alert(
          'Attendance Error',
          response.error || 'Failed to mark attendance',
          [{ text: 'Try Again', onPress: resetScanner }]
        );
      }
    } catch (error) {
      console.error('❌ Attendance error:', error);
      Alert.alert(
        'Scan Error',
        'Network error while marking attendance',
        [{ text: 'Try Again', onPress: resetScanner }]
      );
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setAttendanceRecord(null);
    setModalVisible(false);
    setLoading(false);
  };

  const confirmAttendance = () => {
    setModalVisible(false);
    Alert.alert(
      'Attendance Marked!',
      `${attendanceRecord?.user.fullName} has been marked present.`,
      [
        {
          text: 'Scan Another',
          onPress: resetScanner
        },
        {
          text: 'Done',
          onPress: () => router.back()
        }
      ]
    );
  };

  // Access control
  if (!canMarkAttendance()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Attendance Scanner</Text>
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>Access Denied</Text>
          <Text style={styles.subMessage}>Only admins and organizers can mark attendance</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Camera permission check
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
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
          <Text style={styles.subMessage}>Please enable camera access to scan QR codes</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show location selector if location scan type is selected but no location chosen
  if (scanType === 'location' && !selectedLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Location</Text>
        </View>
        
        <View style={styles.locationSelectorContainer}>
          <Text style={styles.locationSelectorTitle}>
            Choose location for attendance marking:
          </Text>
          
          {LOCATIONS.map((location) => (
            <TouchableOpacity
              key={location}
              style={styles.locationOption}
              onPress={() => setSelectedLocation(location)}
            >
              <Text style={styles.locationOptionText}>{location}</Text>
              <Text style={styles.locationOptionArrow}>→</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.switchScanTypeButton}
            onPress={() => setScanType('event')}
          >
            <Text style={styles.switchScanTypeText}>
              Switch to Event Attendance
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Overlay */}
      <View style={styles.headerOverlay}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {scanType === 'event' ? 'Event Attendance' : `${selectedLocation}`}
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Camera */}
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417"],
        }}
      >
        {/* Scan Type Switcher */}
        <View style={styles.scanTypeSwitcher}>
          <TouchableOpacity
            style={[
              styles.scanTypeButton,
              scanType === 'event' && styles.activeScanType
            ]}
            onPress={() => setScanType('event')}
          >
            <Text style={[
              styles.scanTypeText,
              scanType === 'event' && styles.activeScanTypeText
            ]}>
              📅 Event
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.scanTypeButton,
              scanType === 'location' && styles.activeScanType
            ]}
            onPress={() => {
              setScanType('location');
              setSelectedLocation('');
            }}
          >
            <Text style={[
              styles.scanTypeText,
              scanType === 'location' && styles.activeScanTypeText
            ]}>
              📍 Location
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scan Frame */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanText}>
            {scanType === 'event' 
              ? 'Scan member QR code for event attendance' 
              : `Scan member QR code for ${selectedLocation} visit`
            }
          </Text>
        </View>
      </CameraView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Theme.colors.success} />
          <Text style={styles.loadingText}>Marking attendance...</Text>
        </View>
      )}

      {/* Attendance Confirmation Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Attendance Marked!</Text>
          </View>

          {attendanceRecord && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✅</Text>
              </View>

              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{attendanceRecord.user.fullName}</Text>
                <Text style={styles.membershipId}>ID: {attendanceRecord.user.membershipId}</Text>
                <Text style={styles.memberDetails}>{attendanceRecord.user.phone}</Text>
                <Text style={styles.memberDetails}>{attendanceRecord.user.email}</Text>
              </View>

              <View style={styles.attendanceDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {attendanceRecord.attendanceType === 'event' ? 'Event Attendance' : 'Location Visit'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{attendanceRecord.location}</Text>
                </View>

                {attendanceRecord.event && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Event:</Text>
                    <Text style={styles.detailValue}>{attendanceRecord.event.title}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(attendanceRecord.checkInTime).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[
                    styles.detailValue,
                    styles.statusText,
                    attendanceRecord.status === 'present' ? styles.presentStatus :
                    attendanceRecord.status === 'late' ? styles.lateStatus : 
                    styles.earlyStatus
                  ]}>
                    {attendanceRecord.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.scanAnotherButton}
                  onPress={resetScanner}
                >
                  <Text style={styles.scanAnotherButtonText}>Scan Another</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => router.back()}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scanTypeSwitcher: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: Theme.borderRadius.lg,
    padding: 4,
  },
  scanTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  activeScanType: {
    backgroundColor: Theme.colors.secondary,
  },
  scanTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  activeScanTypeText: {
    fontWeight: 'bold',
  },
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
    borderColor: Theme.colors.secondary,
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
    maxWidth: 280,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: Theme.colors.background,
  },
  message: {
    ...Theme.typography.h3,
    color: Theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subMessage: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: Theme.borderRadius.md,
  },
  buttonText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
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
  locationSelectorContainer: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  locationSelectorTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  locationOption: {
    backgroundColor: Theme.colors.surface,
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationOptionText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.primary,
    fontWeight: '500',
  },
  locationOptionArrow: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
  },
  switchScanTypeButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.xl,
    alignItems: 'center',
  },
  switchScanTypeText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalHeader: {
    backgroundColor: Theme.colors.surface,
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  successIconText: {
    fontSize: 64,
  },
  memberInfo: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  memberName: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  membershipId: {
    ...Theme.typography.body1,
    color: Theme.colors.primary,
    fontWeight: '600',
    marginBottom: Theme.spacing.sm,
  },
  memberDetails: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    marginBottom: 2,
  },
  attendanceDetails: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  detailLabel: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    fontWeight: '500',
  },
  detailValue: {
    ...Theme.typography.body2,
    color: Theme.colors.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusText: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  presentStatus: {
    backgroundColor: '#E8F5E8',
    color: Theme.colors.success,
  },
  lateStatus: {
    backgroundColor: '#FFF3E0',
    color: Theme.colors.warning,
  },
  earlyStatus: {
    backgroundColor: '#E3F2FD',
    color: '#2196F3',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  scanAnotherButton: {
    flex: 1,
    backgroundColor: Theme.colors.secondary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  scanAnotherButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  doneButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
});