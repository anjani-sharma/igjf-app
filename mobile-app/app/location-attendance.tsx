// mobile-app/app/location-attendance.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const Theme = {
  colors: {
    primary: '#1B2951',
    secondary: '#2D5016',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: {
      primary: '#333333',
      secondary: '#666666',
      onPrimary: '#ffffff',
    },
    border: '#eee',
  },
  spacing: {
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h3: { fontSize: 24, fontWeight: 'bold' as const },
    h4: { fontSize: 20, fontWeight: 'bold' as const },
    body1: { fontSize: 16, fontWeight: 'normal' as const },
    body2: { fontSize: 14, fontWeight: 'normal' as const },
  },
  borderRadius: {
    lg: 12,
  },
};

const LOCATIONS = [
  {
    id: 'central',
    name: 'Central Party Office',
    address: 'Main headquarters, Darjeeling',
    icon: '🏛️',
    description: 'Main party headquarters for administrative work'
  },
  {
    id: 'darjeeling',
    name: 'Party Office Darjeeling',
    address: 'Darjeeling district office',
    icon: '🏢',
    description: 'District office for Darjeeling region'
  },
  {
    id: 'kalimpong',
    name: 'Party Office Kalimpong',
    address: 'Kalimpong district office',
    icon: '🏢',
    description: 'District office for Kalimpong region'
  },
  {
    id: 'kurseong',
    name: 'Party Office Kurseong',
    address: 'Kurseong district office',
    icon: '🏢',
    description: 'District office for Kurseong region'
  },
];

export default function LocationAttendanceScreen() {
  const { user } = useAuth();

  const isOrganizer = () => user?.role === 'organizer' || user?.role === 'admin';

  const handleLocationSelect = (location) => {
    // Navigate to attendance scanner with selected location
    router.push({
      pathname: '/attendance-scanner',
      params: { 
        scanType: 'location',
        selectedLocation: location.name 
      }
    });
  };

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.locationCard}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.locationHeader}>
        <Text style={styles.locationIcon}>{item.icon}</Text>
        <View style={styles.locationInfo}>
          <Text style={styles.locationName}>{item.name}</Text>
          <Text style={styles.locationAddress}>{item.address}</Text>
        </View>
        <Text style={styles.locationArrow}>→</Text>
      </View>
      <Text style={styles.locationDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  if (!isOrganizer()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Location Attendance</Text>
        </View>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>Only organizers can mark location attendance</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Location Attendance</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>📍 Location-Based Attendance</Text>
          <Text style={styles.instructionText}>
            Select a party office location to mark member attendance for visits and meetings at that location.
          </Text>
        </View>

        <FlatList
          data={LOCATIONS}
          renderItem={renderLocationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.locationsList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.onPrimary,
  },
  title: {
    ...Theme.typography.h4,
    color: Theme.colors.text.onPrimary,
    flex: 1,
    textAlign: 'center',
    marginLeft: Theme.spacing.md,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  instructionCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.secondary,
  },
  instructionTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  instructionText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    lineHeight: 24,
  },
  locationsList: {
    paddingBottom: Theme.spacing.xl,
  },
  locationCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: Theme.spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    marginBottom: 4,
  },
  locationAddress: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
  },
  locationArrow: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    fontSize: 20,
  },
  locationDescription: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedText: {
    ...Theme.typography.h3,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  accessDeniedSubtext: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
  },
});