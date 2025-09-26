
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration
const API_CONFIG = {
  BASE_URL: 'https://igjf-app.onrender.com/api',
  TIMEOUT: 30000, // 8 seconds timeout for production
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000, // 1 second between retries
};

interface ApiOptions extends RequestInit {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  requireAuth?: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// Delay utility for retries
const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Production-ready fetch wrapper with timeout, retries, and error handling
 */
export const apiRequest = async <T = any>(
  endpoint: string, 
  options: ApiOptions = {}
): Promise<ApiResponse<T>> => {
  const {
    timeout = API_CONFIG.TIMEOUT,
    retryAttempts = API_CONFIG.RETRY_ATTEMPTS,
    retryDelay = API_CONFIG.RETRY_DELAY,
    requireAuth = true,
    ...fetchOptions
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // Add auth header if required
  if (requireAuth) {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.log('⚠️ No auth token found for authenticated request');
        return {
          success: false,
          error: 'Authentication required but no token found',
          status: 401,
        };
      }
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return {
        success: false,
        error: 'Failed to retrieve authentication token',
        status: 401,
      };
    }
  }

  // Retry logic
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log(`⏰ Request to ${endpoint} timed out after ${timeout}ms (attempt ${attempt + 1})`);
      }, timeout);

      console.log(`🌐 API Request: ${fetchOptions.method || 'GET'} ${url} (attempt ${attempt + 1})`);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      // Clear timeout on successful request
      clearTimeout(timeoutId);

      console.log(`📡 Response: ${response.status} ${response.statusText}`);

      // Handle different response statuses
      if (response.ok) {
        try {
          const data = await response.json();
          return {
            success: true,
            data,
            status: response.status,
          };
        } catch (parseError) {
          console.error('❌ Error parsing response JSON:', parseError);
          return {
            success: false,
            error: 'Failed to parse server response',
            status: response.status,
          };
        }
      } else {
        // Handle non-2xx responses
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If we can't parse error response, use default message
        }

        console.log(`⚠️ API Error: ${errorMessage}`);
        
        return {
          success: false,
          error: errorMessage,
          status: response.status,
        };
      }

    } catch (error: any) {
      console.error(`❌ Network error (attempt ${attempt + 1}):`, error.message);

      // Don't retry on abort errors (timeouts) or on the last attempt
      if (error.name === 'AbortError' || attempt === retryAttempts) {
        return {
          success: false,
          error: error.name === 'AbortError' ? 'Request timed out' : 'Network error',
          status: 0,
        };
      }

      // Wait before retrying (exponential backoff)
      const waitTime = retryDelay * Math.pow(2, attempt);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await delay(waitTime);
    }
  }

  // This should never be reached, but TypeScript requires it
  return {
    success: false,
    error: 'Maximum retry attempts exceeded',
    status: 0,
  };
};

/**
 * Specialized API methods for common operations
 */
export const api = {
  // GET request
  get: <T = any>(endpoint: string, options: Omit<ApiOptions, 'method'> = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  // POST request
  post: <T = any>(endpoint: string, data?: any, options: Omit<ApiOptions, 'method' | 'body'> = {}) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // PUT request
  put: <T = any>(endpoint: string, data?: any, options: Omit<ApiOptions, 'method' | 'body'> = {}) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // DELETE request
  delete: <T = any>(endpoint: string, options: Omit<ApiOptions, 'method'> = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Specific API endpoints
 */
export const profileAPI = {
  // Get user profile
  getProfile: () => api.get('/members/profile'),

  // Update user profile
  updateProfile: (profileData: any) => api.put('/members/profile', profileData),
};

export const authAPI = {
  // Login (no auth required)
  login: (credentials: { identifier: string; password: string }) =>
    api.post('/auth/login', credentials, { requireAuth: false }),

  // Register (no auth required)  
  register: (userData: any) =>
    api.post('/auth/register', userData, { requireAuth: false }),
};

export const memberAPI = {
  // Get all members
  getAllMembers: () => api.get('/members'),

  // Update member role
  updateMemberRole: (id: string, role: string) =>
    api.put(`/members/${id}/role`, { role }),

  // Delete member
  deleteMember: (id: string) => api.delete(`/members/${id}`),
};

export default api;