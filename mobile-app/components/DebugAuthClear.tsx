import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { router } from 'expo-router';

const DebugAuthClear: React.FC = () => {
  const { forceLogout } = useAuth();

  const handleClearAuth = async () => {
    Alert.alert(
      'Clear Authentication Data',
      'This will clear all cached authentication data and redirect to login. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear & Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await forceLogout();
              console.log('✅ Authentication data cleared successfully');
              router.replace('/');
            } catch (error) {
              console.error('❌ Error clearing auth data:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleClearAuth}>
        <Text style={styles.buttonText}>🔄 Clear Auth Cache</Text>
      </TouchableOpacity>
      <Text style={styles.helpText}>
        Use this if you're seeing "Token is not valid" errors
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  button: {
    backgroundColor: '#e17055',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  helpText: {
    marginTop: 8,
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
});

export default DebugAuthClear;