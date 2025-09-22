// mobile-app/app/_layout.tsx - UPDATED with Events routes
import { Stack } from 'expo-router';
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
        <Stack.Screen name="profile-edit" />
        
        {/* NEW: Events-related screens */}
        <Stack.Screen name="events" />
        <Stack.Screen name="create-event" />
        <Stack.Screen name="event-detail" />
        <Stack.Screen name="attendance-scanner" />
        <Stack.Screen name="location-attendance" />
        
        {/* NEW: Attendance Reports screen */}
        <Stack.Screen name="attendance-reports" />
        <Stack.Screen name="member-details" />
      </Stack>
    </AuthProvider>
  );
}