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
        console.log('✅ Loaded user data:', parsedUser);
        setUser(parsedUser);
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
      console.log('🚪 Logging out user');
      
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('⚠️ Error removing user data:', error);
      // Still set user to null even if storage clear fails
      setUser(null);
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

export type { User };