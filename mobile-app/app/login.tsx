// mobile-app/app/login.tsx - COMPLETE FILE
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, handleApiError } from '../services/apiService';

const partyFlag = require('./images/flag.jpeg');

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    // Input validation
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Starting login process...');

      // 🔍 DEBUG: Log what we're sending
      console.log('🔍 Sending credentials:', { 
        identifier: identifier.trim(), 
        password: '***' // Don't log actual password
      });
      
      // Call the API using our service
      const result = await authAPI.login({ 
        identifier: identifier.trim(), 
        password: password 
      });
      
      if (result.success) {
        console.log('✅ Login successful');
        
        // Save user data using auth context
        await login(result.data.token, result.data.user);
        
        // Navigate based on user role
        if (result.data.user.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      } else {
        console.log('❌ Login failed:', result.error);
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('🚨 Login error:', error);
      Alert.alert('Connection Error', handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.logoSection}>
            <Text style={styles.partyName}>INDIAN GORKHA JANSHAKTI FRONT</Text>
            <Text style={styles.title}>Member Login</Text>
          </View>
        </View>

        
        {/* Flag Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={partyFlag} 
            style={styles.flagImage} 
            resizeMode="contain"
            onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
            defaultSource={require('./images/flag.jpeg')}
          />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email or Phone"
            placeholderTextColor="#999"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B2951',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  logoSection: {
    alignItems: 'center',
  },
  partyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },

  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: '100%'
  },
  flagImage: {
    width: 250,
    height: 150,
    marginVertical: 5
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40, // reduced from 40 to accommodate the image
  },
  
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#2D5016',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 10,
  },
  registerText: {
    color: 'white',
    fontSize: 16,
    opacity: 0.8,
  },
  registerTextBold: {
    color: 'white',
    fontWeight: 'bold',
    opacity: 1,
  },
});