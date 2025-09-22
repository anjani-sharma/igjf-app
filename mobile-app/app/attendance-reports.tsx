// Save this as: mobile-app/app/attendance-reports.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    email: string;
    role: string;
  };
  event?: {
    title: string;
    eventDate: string;
    location: string;
  };
  location: string;
  attendanceType: 'event' | 'location_visit';
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'late' | 'early_departure';
  notes?: string;
  marker: {
    fullName: string;
    role: string;
  };
}

interface AttendanceStats {
  totalAttendance: number;
  attendanceByLocation: Array<{ location: string; count: number }>;
  attendanceByType: Array<{ attendanceType: string; count: number }>;
  topAttendees: Array<{
    user: {
      fullName: string;
      membershipId: string;
      role: string;
    };
    attendanceCount: number;
  }>;
}

export default function AttendanceReports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'records' | 'stats'>('records');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAttendanceData();
  }, [activeTab]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (activeTab === 'records') {
        await loadAttendanceRecords(token);
      } else {
        await loadAttendanceStats(token);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      Alert.alert('Error', 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceRecords = async (token: string | null) => {
    const response = await fetch('http://192.168.1.65:5000/api/events/attendance/records', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setAttendanceRecords(data.attendances || []);
    } else {
      throw new Error('Failed to fetch attendance records');
    }
  };

  const loadAttendanceStats = async (token: string | null) => {
    const response = await fetch('http://192.168.1.65:5000/api/events/attendance/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setAttendanceStats(data.stats);
    } else {
      throw new Error('Failed to fetch attendance stats');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendanceData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return Theme.colors.success;
      case 'late':
        return Theme.colors.warning;
      case 'early_departure':
        return '#2196F3';
      default:
        return Theme.colors.text.secondary;
    }
  };

  const renderAttendanceRecord = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user.fullName}</Text>
          <Text style={styles.userDetails}>
            {item.user.membershipId} • {item.user.role}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.recordDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>
            {item.attendanceType === 'event' ? '🎯 Event' : '📍 Location Visit'}
          </Text>
        </View>

        {item.event && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Event:</Text>
            <Text style={styles.detailValue}>{item.event.title}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>{item.location}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Check-in:</Text>
          <Text style={styles.detailValue}>{formatDate(item.checkInTime)}</Text>
        </View>

        {item.checkOutTime && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-out:</Text>
            <Text style={styles.detailValue}>{formatDate(item.checkOutTime)}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Marked by:</Text>
          <Text style={styles.detailValue}>{item.marker.fullName} ({item.marker.role})</Text>
        </View>

        {item.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <Text style={styles.detailValue}>{item.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStatsSection = () => {
    if (!attendanceStats) return null;

    return (
      <ScrollView 
        style={styles.statsContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Total Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📊 Overall Statistics</Text>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Attendance Records:</Text>
            <Text style={styles.statValue}>{attendanceStats.totalAttendance}</Text>
          </View>
        </View>

        {/* Attendance by Type */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📈 Attendance by Type</Text>
          {attendanceStats.attendanceByType.map((item, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statLabel}>
                {item.attendanceType === 'event' ? '🎯 Events:' : '📍 Location Visits:'}
              </Text>
              <Text style={styles.statValue}>{item.count}</Text>
            </View>
          ))}
        </View>

        {/* Attendance by Location */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>📍 Attendance by Location</Text>
          {attendanceStats.attendanceByLocation.slice(0, 5).map((item, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statLabel}>{item.location}:</Text>
              <Text style={styles.statValue}>{item.count}</Text>
            </View>
          ))}
        </View>

        {/* Top Attendees */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>🏆 Top Attendees</Text>
          {attendanceStats.topAttendees.slice(0, 10).map((item, index) => (
            <View key={index} style={styles.attendeeItem}>
              <View style={styles.attendeeRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.attendeeInfo}>
                <Text style={styles.attendeeName}>{item.user.fullName}</Text>
                <Text style={styles.attendeeDetails}>
                  {item.user.membershipId} • {item.user.role}
                </Text>
              </View>
              <View style={styles.attendeeCount}>
                <Text style={styles.countText}>{item.attendanceCount}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Attendance Reports</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading attendance data...</Text>
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
        <Text style={styles.title}>Attendance Reports</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'records' && styles.activeTab]}
          onPress={() => setActiveTab('records')}
        >
          <Text style={[styles.tabText, activeTab === 'records' && styles.activeTabText]}>
            📋 Records
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            📊 Statistics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'records' ? (
        <FlatList
          data={attendanceRecords}
          renderItem={renderAttendanceRecord}
          keyExtractor={(item) => item.id}
          style={styles.recordsList}
          contentContainerStyle={styles.recordsContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>📝 No attendance records found</Text>
              <Text style={styles.emptySubtext}>
                Attendance will appear here once members start checking in
              </Text>
            </View>
          }
        />
      ) : (
        renderStatsSection()
      )}
    </SafeAreaView>
  );
}

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
  recordsList: {
    flex: 1,
  },
  recordsContent: {
    padding: Theme.spacing.md,
  },
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...Theme.typography.body1,
    fontWeight: '600',
    color: Theme.colors.text.primary,
  },
  userDetails: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  statusText: {
    ...Theme.typography.caption,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  recordDetails: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: Theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.xs,
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
  statsContainer: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  statsCard: {
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
  statsTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacing.xs,
  },
  statLabel: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
  },
  statValue: {
    ...Theme.typography.body1,
    color: Theme.colors.text.primary,
    fontWeight: '600',
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  attendeeRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
  },
  rankText: {
    ...Theme.typography.caption,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    ...Theme.typography.body1,
    fontWeight: '600',
    color: Theme.colors.text.primary,
  },
  attendeeDetails: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
  },
  attendeeCount: {
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  countText: {
    ...Theme.typography.caption,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyText: {
    ...Theme.typography.h4,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  emptySubtext: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
  },
});