// Replace your mobile-app/app/admin.tsx with this updated version
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    newMembersThisWeek: 0,
    activeMembers: 0,
    totalAttendance: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // In a real app, you'd load these from your backend
    setStats({
      totalMembers: 156,
      newMembersThisWeek: 12,
      activeMembers: 142,
      totalAttendance: 89,
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1B2951" />
      
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              Welcome, {user?.fullName || user?.name}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {user?.role === 'admin' ? 'Admin Control Panel' : 'Organizer Dashboard'}
            </Text>
            <Text style={styles.welcomeDescription}>
              Manage party membership and activities
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalMembers}</Text>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.newMembersThisWeek}</Text>
            <Text style={styles.statLabel}>New This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeMembers}</Text>
            <Text style={styles.statLabel}>Active Members</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalAttendance}</Text>
            <Text style={styles.statLabel}>Total Attendance</Text>
          </View>
        </View>

        {/* Member Management Section */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Member Management</Text>
          
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push('/scanner')}
          >
            <Text style={styles.actionIcon}>📱</Text>
            <View style={styles.actionContent}>
              <Text style={styles.primaryActionText}>Scan Member QR Code</Text>
              <Text style={styles.actionSubtext}>Verify member identity</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push('/members')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <View style={styles.actionContent}>
              <Text style={styles.primaryActionText}>View All Members</Text>
              <Text style={styles.actionSubtext}>Browse member directory</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <View style={styles.actionContent}>
              <Text style={styles.secondaryActionText}>Register New Member</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Events & Attendance Section */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Events & Attendance</Text>
          
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push('/events')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <View style={styles.actionContent}>
              <Text style={styles.primaryActionText}>Manage Events</Text>
              <Text style={styles.actionSubtext}>Create and view events</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push('/attendance-scanner')}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <View style={styles.actionContent}>
              <Text style={styles.primaryActionText}>Mark Attendance</Text>
              <Text style={styles.actionSubtext}>Scan QR codes for attendance</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          {/* NEW: Attendance Reports Button */}
          <TouchableOpacity
            style={styles.highlightAction}
            onPress={() => router.push('/attendance-reports')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <View style={styles.actionContent}>
              <Text style={styles.highlightActionText}>Attendance Reports</Text>
              <Text style={styles.actionSubtext}>View attendance statistics and records</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.push('/location-attendance')}
          >
            <Text style={styles.actionIcon}>📍</Text>
            <View style={styles.actionContent}>
              <Text style={styles.secondaryActionText}>Location Attendance</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Only Features */}
        {user?.role === 'admin' && (
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Admin Features</Text>
            
            <TouchableOpacity
              style={styles.adminAction}
              onPress={() => router.push('/roles')}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <View style={styles.actionContent}>
                <Text style={styles.adminActionText}>Manage Roles</Text>
                <Text style={styles.actionSubtext}>Assign organizer permissions</Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminAction}
              onPress={() => Alert.alert('Feature', 'Export functionality coming soon!')}
            >
              <Text style={styles.actionIcon}>📤</Text>
              <View style={styles.actionContent}>
                <Text style={styles.adminActionText}>Export Data</Text>
                <Text style={styles.actionSubtext}>Download member reports</Text>
              </View>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.push('/profile-edit')}
          >
            <Text style={styles.actionIcon}>✏️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.secondaryActionText}>Edit Profile</Text>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.actionIcon}>🚪</Text>
            <View style={styles.actionContent}>
              <Text style={styles.logoutText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1B2951',
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 40,
  },
  welcomeSection: {
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#E0E0E0',
    fontWeight: '600',
    marginBottom: 5,
  },
  welcomeDescription: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingLeft: 5,
  },
  primaryAction: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  highlightAction: {
    backgroundColor: '#E8F5E8',
    borderWidth: 2,
    borderColor: '#4CAF50',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  secondaryAction: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  adminAction: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFB74D',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF5350',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 15,
    width: 30,
    textAlign: 'center',
  },
  actionContent: {
    flex: 1,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  highlightActionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 2,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  adminActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C62828',
  },
  actionSubtext: {
    fontSize: 14,
    color: '#666',
  },
  actionArrow: {
    fontSize: 20,
    color: '#999',
    marginLeft: 10,
  },
});