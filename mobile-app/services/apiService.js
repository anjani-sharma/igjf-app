// mobile-app/services/apiService.js - FIXED VERSION
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment-based API configuration
const getApiBaseUrl = () => {
  return 'https://igjf-app.onrender.com/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000, // Increased timeout
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 2000, // Increased retry delay
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const apiRequest = async (endpoint, options = {}) => {
  const {
    timeout = API_CONFIG.TIMEOUT,
    retryAttempts = API_CONFIG.RETRY_ATTEMPTS,
    retryDelay = API_CONFIG.RETRY_DELAY,
    requireAuth = false,
    ...fetchOptions
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...fetchOptions.headers,
  };

  if (requireAuth) {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        throw new Error('No authentication token found');
      }
    } catch (error) {
      throw new Error('Authentication required but no token found');
    }
  }

  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      console.log(`🌐 API Request: ${fetchOptions.method || 'GET'} ${url} (attempt ${attempt + 1})`);
      console.log(`📝 Headers:`, headers);
      console.log(`📦 Body:`, fetchOptions.body ? 'Present' : 'None');

      // Use a more compatible timeout approach for React Native Web
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      );

      const fetchPromise = fetch(url, {
        ...fetchOptions,
        headers,
        mode: 'cors', // Explicitly set CORS mode
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      console.log(`📡 Response: ${response.status} ${response.statusText}`);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Non-JSON response:', contentType);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Request successful:', data);
        return { success: true, data, status: response.status };
      } else {
        console.log('❌ Request failed:', data);
        return { success: false, error: data.message || 'Request failed', status: response.status, data };
      }
    } catch (error) {
      console.error(`❌ Request attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === retryAttempts) {
        let errorMessage = 'Network error. Please try again.';
        if (error.message.includes('timeout') || error.message.includes('aborted')) {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('non-JSON')) {
          errorMessage = 'Server error. Please try again later.';
        }
        throw new Error(errorMessage);
      }
      await delay(retryDelay);
    }
  }
};

export const authAPI = {
  login: async (credentials) => {
    console.log('🔐 Starting login with credentials:', { 
      identifier: credentials.identifier, 
      password: '***' 
    });
    
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};

export const handleApiError = (error, defaultMessage = 'Something went wrong') => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return defaultMessage;
};