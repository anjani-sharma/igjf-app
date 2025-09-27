// mobile-app/contexts/AuthContext.tsx - COMPLETE FILE
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// User interface
interface User {
  id: number;
  membershipId: string;
  fullName?: string;
  name?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  occupation?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  constituency?: string;
  role: string;
  isVerified?: boolean;
  isActive?: boolean;
  profilePhoto?: string;
  qrCode?: string;
  qrCodeData?: string;
  aadharNumber?: string;
  aadharVerified?: boolean;
  aadharVerificationDate?: string;
  createdAt?: string;
  updatedAt?: string;
  registeredBy?: string;
  fatherName?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
        const parsedUser = JSON.parse(userData);
        console.log('✅ Loaded cached user data:', parsedUser);
        
        // Validate token with production server
        try {
          const response = await fetch('https://igjf-app.onrender.com/api/members/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.status === 401) {
            console.log('🔄 Token invalid for production server, clearing cached data...');
            await forceLogout();
            return;
          }
          
          if (response.ok) {
            console.log('✅ Token validated successfully');
            setUser(parsedUser);
          } else {
            console.log('⚠️ Token validation failed, clearing cached data...');
            await forceLogout();
            return;
          }
        } catch (validationError) {
          console.log('⚠️ Token validation error, using cached data:', validationError);
          setUser(parsedUser);
        }
      }
    } catch (error) {
      console.error('⚠️ Error loading user data:', error);
      // Clear corrupted data
      try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
      } catch (clearError) {
        console.error('Error clearing storage:', clearError);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      console.log('🔐 Logging in user:', userData);
      
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('✅ User logged in and saved to storage');
    } catch (error) {
      console.error('⚠️ Error saving user data:', error);
      throw new Error('Failed to save login data');
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 AuthContext: Starting logout process...');
      
      // Get current token for backend logout
      const token = await AsyncStorage.getItem('token');
      
      // Call backend logout endpoint (optional)
      if (token) {
        try {
          console.log('🚪 AuthContext: Calling backend logout...');
          const response = await fetch('https://igjf-app.onrender.com/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            console.log('✅ AuthContext: Backend logout successful');
          } else {
            console.log('⚠️ AuthContext: Backend logout failed, continuing with local logout');
          }
        } catch (backendError) {
          console.log('⚠️ AuthContext: Backend logout error, continuing with local logout:', backendError);
        }
      }
      
      // Clear local storage (this is the most important part)
      console.log('🚪 AuthContext: Clearing local storage...');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Clear state
      console.log('🚪 AuthContext: Clearing user state...');
      setUser(null);
      
      console.log('✅ AuthContext: Logout completed successfully');
    } catch (error) {
      console.error('⚠️ AuthContext: Error during logout:', error);
      // Still clear user state even if storage clear fails
      setUser(null);
      throw error;
    }
  };

  const forceLogout = async () => {
    try {
      console.log('🔄 Force logout - clearing all cached authentication data');
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Clear any other potential auth-related keys
      const allKeys = await AsyncStorage.getAllKeys();
      const authKeys = allKeys.filter(key => 
        key.includes('token') || 
        key.includes('user') || 
        key.includes('auth')
      );
      
      if (authKeys.length > 0) {
        await AsyncStorage.multiRemove(authKeys);
        console.log('🧹 Cleared additional auth keys:', authKeys);
      }
      
      setUser(null);
      
      console.log('✅ Force logout completed - all authentication data cleared');
    } catch (error) {
      console.error('⚠️ Error during force logout:', error);
      // Still set user to null even if storage clear fails
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, forceLogout, loading }}>
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

export type { User };