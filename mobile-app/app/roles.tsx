import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RoleManagement() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://192.168.1.65:5000/api/members/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
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

  const updateMemberRole = async (memberId, newRole) => {
    try {
      console.log('Updating member:', memberId, 'to role:', newRole);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://192.168.1.65:5000/api/members/role/${memberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      console.log('Response status:', response.status); // Add this
      const responseData = await response.json(); // Add this
      console.log('Response data:', responseData); // Add this


      if (response.ok) {
        Alert.alert('Success', 'Role updated successfully');
        loadMembers(); // Reload the list
      } else {
        Alert.alert('Error', 'Failed to update role');
      }
    } catch (error) {
      console.error('Update role error:', error);
      Alert.alert('Error', 'Network error');
    }
  };

  const deleteMember = async (memberId) => {
    if (!isAdmin) {
      Alert.alert('Access Denied', 'Only admins can delete members');
      return;
    }

    Alert.alert(
      'Delete Member',
      'Are you sure you want to delete this member? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await fetch(`http://192.168.1.65:5000/api/members/${memberId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({  // Add the required confirmationText
                  confirmationText: 'DELETE MEMBER'
                }),
              });

              if (response.ok) {
                Alert.alert('Success', 'Member deleted successfully');
                loadMembers();
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to delete member');
              }
            } catch (error) {
              console.error('Delete member error:', error);
              Alert.alert('Error', 'Network error');
            }
          }
        }
      ]
    );
  };

  const showRoleOptions = (member) => {
    const options = ['member', 'organizer'];
    if (isAdmin) {
      options.push('admin');
    }

    Alert.alert(
      'Change Role',
      `Select new role for ${member.personalInfo.fullName}:`,
      [
        ...options.map(role => ({
          text: role.charAt(0).toUpperCase() + role.slice(1),
          onPress: () => {
            if (role !== member.role) {
              updateMemberRole(member._id, role);
            }
          }
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.personalInfo.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.personalInfo.fullName}</Text>
          <Text style={styles.memberId}>ID: {item.membershipId}</Text>
          <Text style={styles.memberEmail}>{item.personalInfo.email}</Text>
        </View>
      </View>

      <View style={styles.memberActions}>
        <View style={styles.currentRole}>
          <Text style={styles.roleLabel}>Current Role:</Text>
          <Text style={[
            styles.roleValue,
            { 
              color: item.role === 'admin' ? '#FF5722' : 
                     item.role === 'organizer' ? '#2196F3' : '#4CAF50'
            }
          ]}>
            {item.role?.toUpperCase() || 'MEMBER'}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => showRoleOptions(item)}
          >
            <Text style={styles.roleButtonText}>Change Role</Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteMember(item._id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

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
        <Text style={styles.title}>Manage Roles</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          {isAdmin 
            ? 'Admin Access: You can change member roles and delete members.'
            : 'Organizer Access: You can change member roles but cannot delete members.'
          }
        </Text>
      </View>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
  infoCard: {
    backgroundColor: '#E3F2FD',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
  },
  listContainer: {
    paddingVertical: 10,
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
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
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
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
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
  memberActions: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  currentRole: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  roleValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    flex: 1,
  },
  roleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    flex: 1,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});