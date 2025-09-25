// Enhanced version of your mobile-app/app/members.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check if current user can view member details
  const canViewDetails = user?.role === 'admin' || user?.role === 'organizer';

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('https://igjf-app.onrender.com/api/members/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Members data structure:', data[0]); // Log first item to see structure
        setMembers(data);
      } else {
        Alert.alert('Error', 'Failed to load members');
      }
    } catch (error) {
      console.error('Load members error:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const handleMemberPress = (member) => {
    if (canViewDetails) {
      // Navigate to member details with member ID
      router.push(`/member-details?memberId=${member.id || member._id}`);
    } else {
      Alert.alert(
        'Access Restricted', 
        'Only admins and organizers can view detailed member information'
      );
    }
  };

  const renderMember = ({ item }) => {
    // Handle different data structures
    const memberData = {
      id: item.id || item._id,
      fullName: item.personalInfo?.fullName || item.fullName || item.name,
      email: item.personalInfo?.email || item.email,
      membershipId: item.membershipId,
      role: item.role,
      createdAt: item.createdAt,
      isActive: item.isActive !== undefined ? item.isActive : true,
      isVerified: item.isVerified !== undefined ? item.isVerified : false,
    };

    return (
      <TouchableOpacity 
        style={[
          styles.memberCard,
          canViewDetails && styles.memberCardClickable
        ]}
        onPress={() => handleMemberPress(item)}
        disabled={!canViewDetails}
        activeOpacity={canViewDetails ? 0.7 : 1}
      >
        <View style={styles.memberHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {memberData.fullName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.memberInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.memberName}>{memberData.fullName}</Text>
              {canViewDetails && (
                <Text style={styles.detailsHint}>👁️</Text>
              )}
            </View>
            <Text style={styles.memberId}>ID: {memberData.membershipId}</Text>
            <Text style={styles.memberEmail}>{memberData.email}</Text>
          </View>
        </View>

        <View style={styles.memberMeta}>
          <View style={styles.roleContainer}>
            <Text style={[
              styles.memberRole,
              { 
                backgroundColor: memberData.role === 'admin' ? '#FF5722' : 
                                memberData.role === 'organizer' ? '#2196F3' : '#4CAF50',
                color: 'white'
              }
            ]}>
              {memberData.role?.toUpperCase() || 'MEMBER'}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            {/* Status indicators */}
            <View style={styles.statusIndicators}>
              {memberData.isActive && (
                <View style={styles.activeIndicator}>
                  <Text style={styles.indicatorText}>●</Text>
                </View>
              )}
              {memberData.isVerified && (
                <Text style={styles.verifiedBadge}>✓</Text>
              )}
            </View>
            
            <Text style={styles.joinDate}>
              Joined {new Date(memberData.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Show a hint for clickable cards */}
        {canViewDetails && (
          <View style={styles.clickHint}>
            <Text style={styles.clickHintText}>Tap to view details →</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D5016" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Members</Text>
      </View>

      <View style={styles.statsHeader}>
        <Text style={styles.memberCount}>
          {members.length} Total Members
        </Text>
        {canViewDetails && (
          <Text style={styles.accessInfo}>
            💡 Tap any member to view details
          </Text>
        )}
      </View>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => (item.id?.toString() || item._id?.toString())}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2D5016']}
            tintColor="#2D5016"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>👥 No members found</Text>
            <Text style={styles.emptySubtext}>
              Members will appear here once they register
            </Text>
          </View>
        }
      />

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsHeader: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  memberCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  accessInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  listContainer: {
    paddingVertical: 10,
    flexGrow: 1,
  },
  memberCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberCardClickable: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowOpacity: 0.15,
    elevation: 4,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2D5016',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  detailsHint: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  memberId: {
    fontSize: 14,
    color: '#2D5016',
    fontWeight: '600',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  memberMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  roleContainer: {
    alignItems: 'flex-start',
  },
  memberRole: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeIndicator: {
    marginRight: 6,
  },
  indicatorText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  clickHint: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  clickHintText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});