// File: mobile-app/app/dashboard.tsx - FIXED LAYOUT VERSION with Flag
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../utils/apiUtils';
import { User } from '../contexts/AuthContext';


// Party flag image - Comment this out if you don't have the flag image
// const partyFlag = require('./images/flag.jpeg');

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
    border: '#eee',
    success: '#4CAF50',
    warning: '#FF9800',
    gold: '#FFD700',
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
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
  },
};

interface UserWithPersonalInfo extends User {
  personalInfo?: {
    fullName: string;
    fatherName: string;
    address: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    occupation: string;
    constituency: string;
    city: string;
    state: string;
    pincode: string;
    gender: string;
  };
}

export default function Dashboard() {
  const { user, logout, login } = useAuth();
  const [profile, setProfile] = useState<UserWithPersonalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  
  const hasLoadedProfile = useRef(false);
  const isLoadingProfile = useRef(false);

  const loadProfile = useCallback(async () => {
    if (isLoadingProfile.current) {
      return;
    }

    try {
      isLoadingProfile.current = true;
      setLoading(true);
      setRefreshing(true);
      
      const response = await apiRequest<{ personalInfo: User }>(`/members/profile`, {
        method: 'GET',
      });
      
      if (response.success && response.data) {
        const { personalInfo, ...rest } = response.data;
        const formattedProfile = { ...rest, ...personalInfo };
        
        const token = await AsyncStorage.getItem('token');
        if (token && JSON.stringify(formattedProfile) !== JSON.stringify(user)) {
          await login(token, formattedProfile as User);
        }

        setProfile(formattedProfile as UserWithPersonalInfo);
        hasLoadedProfile.current = true;
      } else {
        setProfile(user as UserWithPersonalInfo);
        hasLoadedProfile.current = true;
      }
      
    } catch (error) {
      setProfile(user as UserWithPersonalInfo);
      hasLoadedProfile.current = true;
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingProfile.current = false;
    }
  }, [user, login]);

  useEffect(() => {
    if (!hasLoadedProfile.current && user && !isLoadingProfile.current) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const onRefresh = useCallback(() => {
    hasLoadedProfile.current = false;
    setRefreshing(true);
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    console.log('LOGOUT: Button pressed');
    
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            console.log('LOGOUT: User confirmed logout');
            console.log('LOGOUT: Current user before logout:', user?.fullName || 'No user');
            
            try {
              console.log('LOGOUT: Calling AuthContext logout...');
              await logout();
              console.log('LOGOUT: AuthContext logout completed successfully');
              
              // Small delay to ensure state updates properly
              setTimeout(() => {
                console.log('LOGOUT: Navigating to home page...');
                router.replace('/');
                console.log('LOGOUT: Navigation command sent');
              }, 100);
              
            } catch (error) {
              console.error('LOGOUT: Error during logout:', error);
              
              // Fallback: Force clear everything
              try {
                console.log('LOGOUT: Attempting fallback logout...');
                await AsyncStorage.multiRemove(['token', 'user']);
                console.log('LOGOUT: Fallback storage clear completed');
                router.replace('/');
                console.log('LOGOUT: Fallback navigation sent');
              } catch (fallbackError) {
                console.error('LOGOUT: Fallback logout also failed:', fallbackError);
                Alert.alert('Error', 'Failed to logout. Please restart the app.');
              }
            }
          }
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };
  
  const getDisplayValue = (value: any, fallback = 'Not provided') => {
    return value && String(value).trim() ? String(value) : fallback;
  };

  const getDisplayName = () => {
    const profileName = profile?.fullName || profile?.name;
    const userName = user?.fullName || user?.name;
    return profileName || userName || 'Member';
  };

  const getProfileImageUri = () => {
    const photoPath = profile?.profilePhoto || user?.profilePhoto;
    
    if (photoPath) {
      let imageUri;
      if (photoPath.startsWith('http')) {
        imageUri = photoPath;
      } else {
        const cleanPath = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;
        imageUri = `https://igjf-app.onrender.com/${cleanPath}`;
      }
      
      return imageUri;
    }
    return null;
  };

  const isAdmin = () => {
    return (profile?.role || user?.role) === 'admin';
  };

  const isOrganizer = () => {
    return (profile?.role || user?.role) === 'organizer';
  };

  if (loading && !profile && !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.roleText}>
                {isAdmin() ? 'ADMIN ACCOUNT' : isOrganizer() ? 'ORGANIZER ACCOUNT' : 'MEMBER ACCOUNT'}
              </Text>
              <Text style={styles.nameText}>{getDisplayName()}</Text>
            </View>
            <View style={{ flexDirection: 'column', gap: 8 }}>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.membershipCardContainer}>
          <View style={[
            styles.membershipCard, 
            isAdmin() && styles.adminCard,
            isOrganizer() && styles.organizerCard
          ]}>
            <View style={styles.cardHeader}>
              <View style={[
                styles.roleBadge,
                isAdmin() && styles.adminBadge,
                isOrganizer() && styles.organizerBadge
              ]}>
                <Text style={styles.roleBadgeText}>
                  {isAdmin() ? '👑 ADMIN' : isOrganizer() ? '👥 ORGANIZER' : '👤 MEMBER'}
                </Text>
              </View>

              {/* Flag section - comment out if you don't have the image */}
              {/*
              <View style={styles.flagContainer}>
                <Image 
                  source={partyFlag} 
                  style={styles.flagImage} 
                  resizeMode="contain"
                />
              </View>
              */}
              
              <Text style={styles.partyName}>INDIAN GORKHA JANSHAKTI FRONT</Text>
            </View>

            {/* NEW LAYOUT: QR code left, Profile picture right */}
            <View style={styles.cardContent}>
              {/* Top Row: QR Code (Left) and Profile Picture (Right) */}
              <View style={styles.topRow}>
                {/* QR Code Section - LEFT */}
                <View style={styles.qrSection}>
                  <View style={styles.qrContainer}>
                    <QRCode
                      value={profile?.membershipId || user?.membershipId || 'No ID'}
                      size={100}
                      color={Theme.colors.primary}
                      backgroundColor="transparent"
                    />
                  </View>
                  <Text style={styles.qrLabel}>Scan for Verification</Text>
                </View>

                {/* Profile Picture Section - RIGHT */}
                <View style={styles.photoSection}>
                  {getProfileImageUri() ? (
                    <Image 
                      source={{ uri: getProfileImageUri() }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {getDisplayName().charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Bottom Section: Member Info */}
              <View style={styles.memberInfoSection}>
                <Text style={styles.memberName}>{getDisplayName()}</Text>
                <Text style={styles.membershipId}>
                  {getDisplayValue(profile?.membershipId || user?.membershipId)}
                </Text>
                
                <View style={styles.memberDetailsRow}>
                  <View style={styles.memberSince}>
                    <Text style={styles.memberSinceLabel}>Member Since</Text>
                    <Text style={styles.memberSinceDate}>
                      {formatDate(profile?.createdAt || user?.createdAt)}
                    </Text>
                  </View>

                  <View style={[
                    styles.statusBadge,
                    (profile?.isVerified || user?.isVerified) && styles.verifiedBadge
                  ]}>
                    <Text style={[
                      styles.statusText,
                      (profile?.isVerified || user?.isVerified) && styles.verifiedText
                    ]}>
                      {(profile?.isVerified || user?.isVerified) ? '✓ VERIFIED' : '⏳ PENDING'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => setShowFullDetails(true)}
            >
              <Text style={styles.viewDetailsText}>📋 View Full Information</Text>
              <Text style={styles.viewDetailsArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/profile-edit')}
            >
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionLabel}>Edit Profile</Text>
            </TouchableOpacity>

            {/* ADD THIS NEW EVENTS BUTTON */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/events')}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionLabel}>Events</Text>
            </TouchableOpacity>

            {isAdmin() && (
              <TouchableOpacity
                style={[styles.actionCard, styles.adminAction]}
                onPress={() => router.push('/admin')}
              >
                <Text style={styles.actionIcon}>🛠️</Text>
                <Text style={[styles.actionLabel, styles.adminActionText]}>Admin Dashboard</Text>
              </TouchableOpacity>
            )}

            {(isAdmin() || isOrganizer()) && (
              <>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/scanner')}
                >
                  <Text style={styles.actionIcon}>📱</Text>
                  <Text style={styles.actionLabel}>Scan QR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => router.push('/members')}
                >
                  <Text style={styles.actionIcon}>👥</Text>
                  <Text style={styles.actionLabel}>View Members</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal remains the same */}
      <Modal
        visible={showFullDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowFullDetails(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Complete Profile</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowFullDetails(false);
                router.push('/profile-edit');
              }}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Personal Information</Text>
              
              <View style={styles.detailGrid}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name</Text>
                  <Text style={styles.detailValue}>{getDisplayValue(profile?.fullName || user?.fullName)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Father's Name</Text>
                  <Text style={styles.detailValue}>
                    {getDisplayValue(profile?.fatherName || user?.fatherName)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>
                    {getDisplayValue(profile?.email || user?.email)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>
                    {getDisplayValue(profile?.phone || user?.phone)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date of Birth</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(profile?.dateOfBirth || user?.dateOfBirth)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gender</Text>
                  <Text style={styles.detailValue}>
                    {getDisplayValue(profile?.gender || user?.gender)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Occupation</Text>
                  <Text style={styles.detailValue}>
                    {getDisplayValue(profile?.occupation || user?.occupation)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Aadhar Number</Text>
                  <Text style={styles.detailValue}>
                    {getDisplayValue(profile?.aadharNumber || user?.aadharNumber, 'Not Provided')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Aadhar Verified</Text>
                  <Text style={[styles.detailValue, (profile?.aadharVerified || user?.aadharVerified) ? styles.verifiedText : styles.pendingText]}>
                    {(profile?.aadharVerified || user?.aadharVerified) ? 'Verified' : 'Not Verified'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Address Information</Text>
              
              <View style={styles.detailGrid}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>
                    {getDisplayValue(profile?.address || user?.address)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>City</Text>
                  <Text style={styles.detailValue}>
                    {getDisplayValue(profile?.city || user?.city)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>State</Text>
                  <Text style={styles.detailValue}>
                    {getDisplayValue(profile?.state || user?.state)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pincode</Text>
                  <Text style={styles.detailValue}>
                    {getDisplayValue(profile?.pincode || user?.pincode)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Constituency</Text>
                  <Text style={styles.detailValue}>
                    {getDisplayValue(profile?.constituency || user?.constituency)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Membership Information</Text>
              
              <View style={styles.detailGrid}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Membership ID</Text>
                  <Text style={[styles.detailValue, styles.membershipIdText]}>
                    {getDisplayValue(profile?.membershipId || user?.membershipId)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Role</Text>
                  <Text style={[styles.detailValue, styles.detailRoleText]}>
                    {((profile?.role || user?.role) || 'member').toUpperCase()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Join Date</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(profile?.createdAt || user?.createdAt)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Verification Status</Text>
                  <Text style={[
                    styles.detailValue,
                    (profile?.isVerified || user?.isVerified) ? styles.verifiedText : styles.pendingText
                  ]}>
                    {(profile?.isVerified || user?.isVerified) ? 'Verified ✓' : 'Pending Verification ⏳'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Theme.colors.primary,
    paddingBottom: Theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  roleText: {
    ...Theme.typography.caption,
    color: Theme.colors.gold,
    fontWeight: '700',
    letterSpacing: 1,
  },
  nameText: {
    ...Theme.typography.h3,
    color: Theme.colors.text.onPrimary,
    marginTop: Theme.spacing.xs,
  },
  logoutButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.text.onPrimary,
  },
  logoutText: {
    ...Theme.typography.body2,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  membershipCardContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
  },
  membershipCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    ...Theme.shadows.card,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.secondary,
  },
  adminCard: {
    borderLeftColor: Theme.colors.gold,
    backgroundColor: '#FFF9E6',
  },
  organizerCard: {
    borderLeftColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  roleBadge: {
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
  },
  adminBadge: {
    backgroundColor: Theme.colors.gold,
  },
  organizerBadge: {
    backgroundColor: '#2196F3',
  },
  roleBadgeText: {
    ...Theme.typography.caption,
    color: Theme.colors.text.onSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  flagContainer: {
    alignItems: 'center',
    marginVertical: Theme.spacing.md,
    width: '100%',
  },
  flagImage: {
    width: 200,
    height: 100,
    marginVertical: 5,
  },
  partyName: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // NEW LAYOUT STYLES
  cardContent: {
    marginBottom: Theme.spacing.lg,
  },
  
  // Top row with QR code left and profile picture right
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.sm,
  },
  
  // QR Code Section (LEFT)
  qrSection: {
    alignItems: 'center',
    flex: 1,
  },
  qrContainer: {
    padding: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.xs,
    ...Theme.shadows.sm,
  },
  qrLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 11,
  },
  
  // Profile Picture Section (RIGHT)
  photoSection: {
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.background,
    borderWidth: 3,
    borderColor: Theme.colors.surface,
    ...Theme.shadows.sm,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Theme.colors.surface,
    ...Theme.shadows.sm,
  },
  avatarText: {
    ...Theme.typography.h2,
    color: Theme.colors.text.onSecondary,
  },
  
  // Member Info Section (BOTTOM)
  memberInfoSection: {
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
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
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
    letterSpacing: 1,
    fontSize: 18,
  },
  
  // Row for member since and status
  memberDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Theme.spacing.md,
  },
  memberSince: {
    alignItems: 'flex-start',
    flex: 1,
  },
  memberSinceLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  memberSinceDate: {
    ...Theme.typography.body2,
    color: Theme.colors.text.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: Theme.colors.warning,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E8',
    borderColor: Theme.colors.success,
  },
  statusText: {
    ...Theme.typography.caption,
    color: Theme.colors.warning,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  verifiedText: {
    color: Theme.colors.success,
  },
  
  // Rest of the styles...
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.background,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  viewDetailsText: {
    ...Theme.typography.body1,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  viewDetailsArrow: {
    ...Theme.typography.h4,
    color: Theme.colors.primary,
  },
  quickActions: {
    padding: Theme.spacing.lg,
  },
  quickActionsTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  actionCard: {
    backgroundColor: Theme.colors.surface,
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    minWidth: '45%',
    ...Theme.shadows.sm,
  },
  adminAction: {
    backgroundColor: Theme.colors.gold,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Theme.spacing.sm,
  },
  actionLabel: {
    ...Theme.typography.body2,
    color: Theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  adminActionText: {
    color: Theme.colors.text.onSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  closeButton: {
    minWidth: 60,
  },
  closeButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
  },
  modalTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  editButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.secondary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  detailSection: {
    backgroundColor: Theme.colors.surface,
    margin: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  detailSectionTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Theme.colors.primary,
    paddingBottom: Theme.spacing.sm,
  },
  detailGrid: {
    gap: Theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    flex: 2,
    textAlign: 'right',
  },
  membershipIdText: {
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  detailRoleText: {
    fontWeight: '700',
    color: Theme.colors.secondary,
    textTransform: 'capitalize',
  },
  pendingText: {
    color: Theme.colors.warning,
    fontWeight: '600',
  },
});