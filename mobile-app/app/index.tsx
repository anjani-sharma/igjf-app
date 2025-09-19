import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const partyFlag = require('./images/flag.jpeg');

export default function WelcomeScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect all logged-in users to the main dashboard
        router.replace('/dashboard');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  return (
     <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Text style={styles.partyName}>Hamro Darjeeling</Text>
          <Text style={styles.tagline}>No More Fear</Text>
        </View>
      </View>

      <View style={styles.imageContainer}>
        <Image 
          source={partyFlag} 
          style={styles.flagImage} 
          resizeMode="contain"
          onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
          defaultSource={require('./images/flag.jpeg')}
        />
      </View>
      

      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Indian Gorkha Janshakti Front</Text>
          <Text style={styles.subtitle}>
            Lets us work together for a better tomorrow.
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Member Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerButtonText}>
              Register as New Member
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B2951',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
  header: {
    paddingTop: 30,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  partyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: '#ded675',
    textAlign: 'center',
    lineHeight: 26,
  },
  buttonSection: {
    gap: 20,
  },
  loginButton: {
    backgroundColor: '#2D5016',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    width: '100%'
  },
  flagImage: {
    width: 250,
    height: 150,
    marginVertical: 5
  },
});
