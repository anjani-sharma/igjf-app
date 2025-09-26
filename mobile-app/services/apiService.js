// mobile-app/services/apiService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment-based API configuration
const getApiBaseUrl = () => {
  // Always use production for deployed builds
  return 'https://igjf-app.onrender.com/api';
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000,
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      console.log(`🌐 API Request: ${fetchOptions.method || 'GET'} ${url} (attempt ${attempt + 1})`);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`📡 Response: ${response.status} ${response.statusText}`);

      const data = await response.json();

      if (response.ok) {
        return { success: true, data, status: response.status };
      } else {
        return { success: false, error: data.message || 'Request failed', status: response.status, data };
      }
    } catch (error) {
      console.error(`❌ Request attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === retryAttempts) {
        let errorMessage = 'Network error. Please try again.';
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        }
        throw new Error(errorMessage);
      }
      await delay(retryDelay);
    }
  }
};

export const authAPI = {
  login: async (credentials) => {
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