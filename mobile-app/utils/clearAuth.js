// Utility to clear authentication data
// This can be run in the browser console to clear cached auth data

const clearAuthData = async () => {
  try {
    // For React Native Web, AsyncStorage is available globally
    if (typeof window !== 'undefined' && window.localStorage) {
      // Clear localStorage items that AsyncStorage uses in web
      const keys = Object.keys(localStorage);
      const authKeys = keys.filter(key => 
        key.includes('token') || 
        key.includes('user') || 
        key.includes('@RNC_AsyncStorage')
      );
      
      console.log('🧹 Clearing auth keys:', authKeys);
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log('✅ Removed:', key);
      });
      
      // Also try to clear common AsyncStorage keys
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      console.log('✅ Authentication data cleared successfully');
      console.log('🔄 Please refresh the page to see the login screen');
      
      return true;
    } else {
      console.log('❌ localStorage not available');
      return false;
    }
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    return false;
  }
};

// Auto-execute if in browser
if (typeof window !== 'undefined') {
  console.log('🔧 Auth clearing utility loaded. Run clearAuthData() to clear cached authentication.');
  window.clearAuthData = clearAuthData;
}

export default clearAuthData;