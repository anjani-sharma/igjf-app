// Save this as: mobile-app/app/member-details.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';

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
    info: '#2196F3',
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
    h5: { fontSize: 18, fontWeight: 'bold' as const },
    body1: { fontSize: 16, fontWeight: 'normal' as const },
    body2: { fontSize: 14, fontWeight: 'normal' as const },
    caption: { fontSize: 12, fontWeight: 'normal' as const },
  },
  borderRadius: {
    md: 8,
    lg: 12,
    xl: 16,
  },
};

interface MemberData {
  id: string;
  membershipId: string;
  fullName: string;
  fatherName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  occupation: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  constituency: string;
  gender: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  profilePhoto?: string;
  qrCode?: string;
  qrCodeData?: string;
  aadharNumber?: string;
  aadharVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceRecord {
  id: string;
  location: string;
  attendanceType: string;
  checkInTime: string;
  checkOutTime?: string;
  status: string;
  event?: {
    title: string;
    eventDate: string;
  };
}

export default function MemberDetails() {
  const { user } = useAuth();
  const { memberId } = useLocalSearchParams();
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'attendance'>('details');
  const [showQRModal, setShowQRModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (memberId) {
      loadMemberData();
      loadAttendanceHistory();
    }
  }, [memberId]);

  const loadMemberData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://192.168.1.65:5000/api/members/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMemberData(data);
      } else {
        Alert.alert('Error', 'Failed to load member details');
        router.back();
      }
    } catch (error) {
      console.error('Error loading member data:', error);
      Alert.alert('Error', 'Failed to load member details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `http://192.168.1.65:5000/api/events/attendance/records?userId=${memberId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendanceHistory(data.attendances || []);
      }
    } catch (error) {
      console.error('Error loading attendance history:', error);
    }
  };

  const handleChangeRole = () => {
    if (!memberData) return;

    const roles = ['member', 'organizer', 'admin'];
    const currentRoleIndex = roles.indexOf(memberData.role);
    const roleOptions = roles.map((role, index) => ({
      text: role.charAt(0).toUpperCase() + role.slice(1),
      onPress: () => updateMemberRole(role),
      style: index === currentRoleIndex ? 'cancel' : 'default',
    }));

    Alert.alert(
      'Change Role',
      `Current role: ${memberData.role.toUpperCase()}\nSelect new role:`,
      [
        ...roleOptions,
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const updateMemberRole = async (newRole: string) => {
    if (!memberData) return;

    setActionLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `http://192.168.1.65:5000/api/members/${memberData.id}/role`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (response.ok) {
        setMemberData({ ...memberData, role: newRole });
        Alert.alert('Success', `Role updated to ${newRole}`);
      } else {
        Alert.alert('Error', 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert('Error', 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!memberData) return;

    const newStatus = !memberData.isActive;
    const action = newStatus ? 'activate' : 'deactivate';

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Member`,
      `Are you sure you want to ${action} ${memberData.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: newStatus ? 'default' : 'destructive',
          onPress: () => updateMemberStatus(newStatus),
        },
      ]
    );
  };

  const updateMemberStatus = async (isActive: boolean) => {
    if (!memberData) return;

    setActionLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `http://192.168.1.65:5000/api/members/${memberData.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive }),
        }
      );

      if (response.ok) {
        setMemberData({ ...memberData, isActive });
        Alert.alert('Success', `Member ${isActive ? 'activated' : 'deactivated'}`);
      } else {
        Alert.alert('Error', 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareMemberInfo = async () => {
    if (!memberData) return;

    try {
      const shareContent = `
🆔 Member Information
━━━━━━━━━━━━━━━━━━
👤 Name: ${memberData.fullName}
🎫 ID: ${memberData.membershipId}
📧 Email: ${memberData.email}
📱 Phone: ${memberData.phone}
🎭 Role: ${memberData.role.toUpperCase()}
✅ Status: ${memberData.isActive ? 'Active' : 'Inactive'}
📍 Constituency: ${memberData.constituency}

Generated by Gorkha Janshakti Front App
      `.trim();

      await Share.share({
        message: shareContent,
        title: 'Member Information',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return Theme.colors.error;
      case 'organizer':
        return Theme.colors.info;
      default:
        return Theme.colors.success;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return Theme.colors.success;
      case 'late':
        return Theme.colors.warning;
      case 'early_departure':
        return Theme.colors.info;
      default:
        return Theme.colors.text.secondary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Member Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading member details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!memberData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Member Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Member details not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Member Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareMemberInfo}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Member Header Card */}
      <View style={styles.memberHeader}>
        <View style={styles.memberInfo}>
          {memberData.profilePhoto ? (
            <Image 
              source={{ uri: `http://192.168.1.65:5000/${memberData.profilePhoto}` }} 
              style={styles.profilePhoto}
            />
          ) : (
            <View style={styles.defaultPhoto}>
              <Text style={styles.photoInitial}>
                {memberData.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          
          <View style={styles.memberBasicInfo}>
            <Text style={styles.memberName}>{memberData.fullName}</Text>
            <Text style={styles.membershipId}>ID: {memberData.membershipId}</Text>
            
            <View style={styles.badgeContainer}>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(memberData.role) }]}>
                <Text style={styles.badgeText}>{memberData.role.toUpperCase()}</Text>
              </View>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: memberData.isActive ? Theme.colors.success : Theme.colors.error }
              ]}>
                <Text style={styles.badgeText}>
                  {memberData.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.qrButton}
          onPress={() => setShowQRModal(true)}
        >
          <Text style={styles.qrButtonText}>📱 QR</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            👤 Details
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'attendance' && styles.activeTab]}
          onPress={() => setActiveTab('attendance')}
        >
          <Text style={[styles.tabText, activeTab === 'attendance' && styles.activeTabText]}>
            📊 Attendance ({attendanceHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'details' ? (
          <View style={styles.detailsContent}>
            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Personal Information</Text>
              <View style={styles.detailCard}>
                <DetailRow label="Full Name" value={memberData.fullName} />
                <DetailRow label="Father's Name" value={memberData.fatherName} />
                <DetailRow label="Date of Birth" value={formatDate(memberData.dateOfBirth)} />
                <DetailRow label="Gender" value={memberData.gender || 'Not specified'} />
                <DetailRow label="Occupation" value={memberData.occupation || 'Not specified'} />
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📞 Contact Information</Text>
              <View style={styles.detailCard}>
                <DetailRow label="Email" value={memberData.email} />
                <DetailRow label="Phone" value={memberData.phone} />
                <DetailRow label="Address" value={memberData.address} />
                <DetailRow label="City" value={memberData.city || 'Not specified'} />
                <DetailRow label="State" value={memberData.state || 'Not specified'} />
                <DetailRow label="Pincode" value={memberData.pincode || 'Not specified'} />
                <DetailRow label="Constituency" value={memberData.constituency || 'Not specified'} />
              </View>
            </View>

            {/* Verification Status */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Verification Status</Text>
              <View style={styles.detailCard}>
                <DetailRow 
                  label="Account Verified" 
                  value={memberData.isVerified ? 'Yes' : 'No'}
                  valueColor={memberData.isVerified ? Theme.colors.success : Theme.colors.warning}
                />
                <DetailRow 
                  label="Aadhar Verified" 
                  value={memberData.aadharVerified ? 'Yes' : 'No'}
                  valueColor={memberData.aadharVerified ? Theme.colors.success : Theme.colors.warning}
                />
                {memberData.aadharNumber && (
                  <DetailRow 
                    label="Aadhar Number" 
                    value={`****-****-${memberData.aadharNumber.slice(-4)}`} 
                  />
                )}
              </View>
            </View>

            {/* Account Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📅 Account Information</Text>
              <View style={styles.detailCard}>
                <DetailRow label="Member Since" value={formatDate(memberData.createdAt)} />
                <DetailRow label="Last Updated" value={formatDate(memberData.updatedAt)} />
                <DetailRow label="Account Status" value={memberData.isActive ? 'Active' : 'Inactive'} />
              </View>
            </View>

            {/* Admin Actions */}
            {user?.role === 'admin' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚙️ Admin Actions</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.roleButton]}
                    onPress={handleChangeRole}
                    disabled={actionLoading}
                  >
                    <Text style={styles.actionButtonText}>
                      {actionLoading ? 'Updating...' : 'Change Role'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.actionButton, 
                      memberData.isActive ? styles.deactivateButton : styles.activateButton
                    ]}
                    onPress={handleToggleStatus}
                    disabled={actionLoading}
                  >
                    <Text style={styles.actionButtonText}>
                      {actionLoading ? 'Updating...' : memberData.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.attendanceContent}>
            {attendanceHistory.length > 0 ? (
              attendanceHistory.map((record, index) => (
                <View key={record.id} style={styles.attendanceCard}>
                  <View style={styles.attendanceHeader}>
                    <View style={styles.attendanceType}>
                      <Text style={styles.typeIcon}>
                        {record.attendanceType === 'event' ? '🎯' : '📍'}
                      </Text>
                      <Text style={styles.typeText}>
                        {record.attendanceType === 'event' ? 'Event' : 'Location Visit'}
                      </Text>
                    </View>
                    <View style={[
                      styles.attendanceStatus,
                      { backgroundColor: getStatusColor(record.status) }
                    ]}>
                      <Text style={styles.statusText}>{record.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  {record.event && (
                    <Text style={styles.eventTitle}>{record.event.title}</Text>
                  )}
                  
                  <Text style={styles.attendanceLocation}>📍 {record.location}</Text>
                  <Text style={styles.attendanceTime}>
                    ⏰ Check-in: {formatDateTime(record.checkInTime)}
                  </Text>
                  
                  {record.checkOutTime && (
                    <Text style={styles.attendanceTime}>
                      ⏰ Check-out: {formatDateTime(record.checkOutTime)}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyAttendance}>
                <Text style={styles.emptyText}>📝 No attendance records found</Text>
                <Text style={styles.emptySubtext}>
                  This member hasn't checked in to any events or locations yet
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQRModal(false)}
      >
        <SafeAreaView style={styles.qrModalContainer}>
          <View style={styles.qrModalHeader}>
            <TouchableOpacity onPress={() => setShowQRModal(false)}>
              <Text style={styles.qrModalClose}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.qrModalTitle}>Member QR Code</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.qrModalContent}>
            <View style={styles.qrContainer}>
              {memberData.qrCodeData && (
                <QRCode
                  value={memberData.qrCodeData}
                  size={250}
                  backgroundColor="white"
                  color="black"
                />
              )}
            </View>
            
            <View style={styles.qrInfo}>
              <Text style={styles.qrMemberName}>{memberData.fullName}</Text>
              <Text style={styles.qrMemberId}>ID: {memberData.membershipId}</Text>
              <Text style={styles.qrInstructions}>
                Scan this QR code to mark attendance or verify member identity
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Helper component for detail rows
const DetailRow = ({ 
  label, 
  value, 
  valueColor = Theme.colors.text.primary 
}: { 
  label: string; 
  value: string; 
  valueColor?: string;
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    paddingRight: Theme.spacing.md,
  },
  backButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  title: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  shareButton: {
    paddingLeft: Theme.spacing.md,
  },
  shareButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Theme.typography.h5,
    color: Theme.colors.error,
  },
  memberHeader: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: Theme.spacing.md,
  },
  defaultPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  photoInitial: {
    ...Theme.typography.h3,
    color: Theme.colors.text.onPrimary,
    fontWeight: 'bold',
  },
  memberBasicInfo: {
    flex: 1,
  },
  memberName: {
    ...Theme.typography.h5,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  membershipId: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  badgeText: {
    ...Theme.typography.caption,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  qrButton: {
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
  },
  qrButtonText: {
    ...Theme.typography.body2,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Theme.colors.primary,
  },
  tabText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  detailsContent: {
    padding: Theme.spacing.md,
  },
  section: {
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    ...Theme.typography.h5,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  detailCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  detailLabel: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    ...Theme.typography.body2,
    color: Theme.colors.text.primary,
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  roleButton: {
    backgroundColor: Theme.colors.info,
  },
  activateButton: {
    backgroundColor: Theme.colors.success,
  },
  deactivateButton: {
    backgroundColor: Theme.colors.warning,
  },
  actionButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  attendanceContent: {
    padding: Theme.spacing.md,
  },
  attendanceCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attendanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  attendanceType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 16,
    marginRight: Theme.spacing.xs,
  },
  typeText: {
    ...Theme.typography.body2,
    fontWeight: '600',
    color: Theme.colors.text.primary,
  },
  attendanceStatus: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  eventTitle: {
    ...Theme.typography.body1,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  attendanceLocation: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  attendanceTime: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
  },
  emptyAttendance: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyText: {
    ...Theme.typography.h5,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  emptySubtext: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
  },
  qrModalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  qrModalClose: {
    ...Theme.typography.body1,
    color: Theme.colors.error,
    fontWeight: '600',
  },
  qrModalTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
  },
  placeholder: {
    width: 60,
  },
  qrModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  qrContainer: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: Theme.spacing.xl,
  },
  qrInfo: {
    alignItems: 'center',
  },
  qrMemberName: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  qrMemberId: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  qrInstructions: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
  },
});