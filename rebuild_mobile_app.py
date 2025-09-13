#!/usr/bin/env python3
"""
Mobile App Directory Rebuild Script
This script recreates the entire mobile-app folder structure with all files
"""

import os
import json

def create_directory_structure():
    """Create all the directories needed for the mobile app"""
    directories = [
        "mobile-app",
        "mobile-app/.expo",
        "mobile-app/.expo/types",
        "mobile-app/.vscode",
        "mobile-app/app",
        "mobile-app/assets",
        "mobile-app/assets/fonts",
        "mobile-app/assets/images",
        "mobile-app/components",
        "mobile-app/components/ui",
        "mobile-app/constants",
        "mobile-app/contexts",
        "mobile-app/hooks",
        "mobile-app/scripts",
        "mobile-app/src",
        "mobile-app/src/components",
        "mobile-app/src/context",
        "mobile-app/src/screens",
        "mobile-app/src/services"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Created directory: {directory}")

def create_package_json():
    """Create package.json file"""
    package_json = {
        "name": "mobile-app",
        "main": "expo-router/entry",
        "version": "1.0.0",
        "scripts": {
            "start": "expo start",
            "android": "expo start --android",
            "ios": "expo start --ios",
            "web": "expo start --web",
            "reset-project": "node ./scripts/reset-project.js"
        },
        "dependencies": {
            "@expo/metro-runtime": "~6.1.2",
            "@expo/vector-icons": "^15.0.2",
            "@react-native-async-storage/async-storage": "2.2.0",
            "expo": "^54.0.0",
            "expo-barcode-scanner": "~14.0.0",
            "expo-camera": "~17.0.7",
            "expo-constants": "~18.0.8",
            "expo-font": "~14.0.8",
            "expo-image-picker": "~17.0.8",
            "expo-linking": "~8.0.8",
            "expo-router": "~6.0.3",
            "expo-splash-screen": "~31.0.10",
            "react": "19.1.0",
            "react-native": "0.81.4",
            "react-native-qrcode-svg": "^6.3.15",
            "react-native-safe-area-context": "~5.6.0",
            "react-native-screens": "~4.16.0",
            "react-native-svg": "15.12.1",
            "expo-status-bar": "~3.0.8"
        },
        "devDependencies": {
            "@babel/core": "^7.25.2",
            "@types/react": "~19.1.10",
            "typescript": "~5.9.2"
        },
        "private": True
    }
    
    with open("mobile-app/package.json", "w") as f:
        json.dump(package_json, f, indent=2)
    print("✅ Created package.json")

def create_app_json():
    """Create app.json file"""
    app_json = {
        "expo": {
            "name": "mobile-app",
            "slug": "mobile-app",
            "version": "1.0.0",
            "orientation": "portrait",
            "scheme": "mobileapp",
            "userInterfaceStyle": "automatic",
            "newArchEnabled": True,
            "sdkVersion": "54.0.0",
            "ios": {
                "supportsTablet": True
            },
            "android": {
                "adaptiveIcon": {
                    "backgroundColor": "#ffffff"
                },
                "edgeToEdgeEnabled": True
            },
            "web": {
                "bundler": "metro",
                "output": "server"
            },
            "plugins": [
                "expo-router"
            ]
        }
    }
    
    with open("mobile-app/app.json", "w") as f:
        json.dump(app_json, f, indent=2)
    print("✅ Created app.json")

def create_tsconfig():
    """Create tsconfig.json"""
    tsconfig = {
        "compilerOptions": {},
        "extends": "expo/tsconfig.base"
    }
    
    with open("mobile-app/tsconfig.json", "w") as f:
        json.dump(tsconfig, f, indent=2)
    print("✅ Created tsconfig.json")

def create_eslint_config():
    """Create eslint.config.js"""
    eslint_content = '''// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
]);
'''
    
    with open("mobile-app/eslint.config.js", "w") as f:
        f.write(eslint_content)
    print("✅ Created eslint.config.js")

def create_expo_files():
    """Create .expo directory files"""
    # devices.json
    devices_json = {"devices": []}
    with open("mobile-app/.expo/devices.json", "w") as f:
        json.dump(devices_json, f, indent=2)
    
    print("✅ Created .expo/devices.json")

def create_vscode_settings():
    """Create .vscode/settings.json"""
    settings = {
        "editor.codeActionsOnSave": {
            "source.fixAll": "explicit",
            "source.organizeImports": "explicit",
            "source.sortMembers": "explicit"
        }
    }
    
    with open("mobile-app/.vscode/settings.json", "w") as f:
        json.dump(settings, f, indent=2)
    print("✅ Created .vscode/settings.json")

def create_constants():
    """Create constants/Colors.ts"""
    colors_content = '''/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
'''
    
    with open("mobile-app/constants/Colors.ts", "w") as f:
        f.write(colors_content)
    print("✅ Created constants/Colors.ts")

def create_auth_context():
    """Create contexts/AuthContext.tsx"""
    auth_context_content = '''import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  membershipId: string;
  name: string;
  email: string;
  role: string;
  qrCode?: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
'''
    
    with open("mobile-app/contexts/AuthContext.tsx", "w") as f:
        f.write(auth_context_content)
    print("✅ Created contexts/AuthContext.tsx")

def create_hooks():
    """Create hook files"""
    # useColorScheme.ts
    color_scheme_content = "export { useColorScheme } from 'react-native';"
    with open("mobile-app/hooks/useColorScheme.ts", "w") as f:
        f.write(color_scheme_content)
    
    # useColorScheme.web.ts
    color_scheme_web_content = '''import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
'''
    with open("mobile-app/hooks/useColorScheme.web.ts", "w") as f:
        f.write(color_scheme_web_content)
    
    # useThemeColor.ts
    theme_color_content = '''/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
'''
    with open("mobile-app/hooks/useThemeColor.ts", "w") as f:
        f.write(theme_color_content)
    
    print("✅ Created hook files")

def create_app_layout():
    """Create app/_layout.tsx"""
    layout_content = '''import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="scanner" />
        <Stack.Screen name="members" />
        <Stack.Screen name="roles" />
      </Stack>
    </AuthProvider>
  );
}
'''
    
    with open("mobile-app/app/_layout.tsx", "w") as f:
        f.write(layout_content)
    print("✅ Created app/_layout.tsx")

def create_app_index():
    """Create app/index.tsx"""
    index_content = '''import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function WelcomeScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is logged in, redirect based on role
        if (user.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
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
          <Text style={styles.partyName}>POLITICAL PARTY</Text>
          <Text style={styles.tagline}>Member Management System</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Manage your party membership with ease
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
    paddingTop: 60,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E0E0',
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
});
'''
    
    with open("mobile-app/app/index.tsx", "w") as f:
        f.write(index_content)
    print("✅ Created app/index.tsx")

def create_root_app_js():
    """Create root App.js file"""
    app_js_content = '''import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🚀 NEW APP WORKING!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
});
'''
    
    with open("mobile-app/App.js", "w") as f:
        f.write(app_js_content)
    print("✅ Created App.js")

def create_login_screen():
    """Create a basic login screen"""
    login_content = '''import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:3001/api';

export default function LoginScreen() {
  const [membershipId, setMembershipId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!membershipId.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          membershipId: membershipId.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await login(data.token, data.user);
        
        // Navigate based on user role
        if (data.user.role === 'admin') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.logoSection}>
          <Text style={styles.partyName}>POLITICAL PARTY</Text>
          <Text style={styles.title}>Member Login</Text>
        </View>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Membership ID"
          value={membershipId}
          onChangeText={setMembershipId}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
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
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  logoSection: {
    alignItems: 'center',
  },
  partyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  form: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
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
  },
});
'''
    
    with open("mobile-app/app/login.tsx", "w") as f:
        f.write(login_content)
    print("✅ Created app/login.tsx")

def main():
    """Main function to create the entire mobile app structure"""
    print("🚀 Starting Mobile App Rebuild...")
    print("=" * 50)
    
    # Create directory structure
    create_directory_structure()
    print()
    
    # Create configuration files
    create_package_json()
    create_app_json()
    create_tsconfig()
    create_eslint_config()
    create_expo_files()
    create_vscode_settings()
    print()
    
    # Create source files
    create_constants()
    create_auth_context()
    create_hooks()
    print()
    
    # Create app files
    create_app_layout()
    create_app_index()
    create_login_screen()
    create_root_app_js()
    print()
    
    print("=" * 50)
    print("✅ Mobile App Structure Created Successfully!")
    print()
    print("Next steps:")
    print("1. cd mobile-app")
    print("2. npm install")
    print("3. npx expo start")
    print()
    print("Note: This script created the basic structure and core files.")
    print("You'll need to add the remaining app screens (register, dashboard, scanner, etc.)")
    print("using the code from the previous artifacts.")

if __name__ == "__main__":
    main()