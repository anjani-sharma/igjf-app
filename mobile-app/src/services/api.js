import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3001/api';

class ApiService {
  async getAuthHeader() {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = await this.getAuthHeader();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
}

const apiService = new ApiService();

export const authAPI = {
  login: (credentials) =>
    apiService.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData) =>
    apiService.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

export const memberAPI = {
  getProfile: () => apiService.request('/members/profile'),
  
  updateProfile: (profileData) =>
    apiService.request('/members/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  getAllMembers: () => apiService.request('/members'),
  
  getMemberById: (id) => apiService.request(`/members/${id}`),
  
  updateMemberRole: (id, role) =>
    apiService.request(`/members/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
};