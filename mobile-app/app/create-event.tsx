// mobile-app/app/create-event.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/apiUtils';

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
    border: '#e0e0e0',
    error: '#F44336',
    success: '#4CAF50',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h4: { fontSize: 20, fontWeight: 'bold' as const },
    body1: { fontSize: 16, fontWeight: 'normal' as const },
    body2: { fontSize: 14, fontWeight: 'normal' as const },
    caption: { fontSize: 12, fontWeight: 'normal' as const },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
};

const EVENT_TYPES = [
  { key: 'meeting', label: 'Meeting', icon: '🤝' },
  { key: 'rally', label: 'Rally', icon: '📢' },
  { key: 'conference', label: 'Conference', icon: '🎤' },
  { key: 'community_service', label: 'Community Service', icon: '🤲' },
  { key: 'training', label: 'Training', icon: '📚' },
  { key: 'other', label: 'Other', icon: '📅' },
];

const LOCATIONS = [
  'Central Party Office',
  'Party Office Darjeeling',
  'Party Office Kalimpong',
  'Party Office Kurseong',
  'Custom Location'
];

export default function CreateEventScreen() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    location: '',
    customLocation: '',
    address: '',
    eventType: 'meeting',
    maxAttendees: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Event</Text>
        </View>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>Only admins can create events</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    } else {
      const eventDate = new Date(formData.eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        newErrors.eventDate = 'Event date cannot be in the past';
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.location) {
      newErrors.location = 'Location is required';
    }

    if (formData.location === 'Custom Location' && !formData.customLocation.trim()) {
      newErrors.customLocation = 'Custom location is required';
    }

    if (formData.endTime && formData.startTime) {
      const startTime = new Date(`2000-01-01T${formData.startTime}`);
      const endTime = new Date(`2000-01-01T${formData.endTime}`);
      if (endTime <= startTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (formData.maxAttendees && isNaN(parseInt(formData.maxAttendees))) {
      newErrors.maxAttendees = 'Max attendees must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the highlighted fields');
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        eventDate: formData.eventDate,
        startTime: formData.startTime,
        endTime: formData.endTime || null,
        location: formData.location === 'Custom Location' ? formData.customLocation.trim() : formData.location,
        address: formData.address.trim(),
        eventType: formData.eventType,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
      };

      console.log('📝 Creating event:', eventData);

      const response = await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.success) {
        Alert.alert(
          'Success!',
          'Event created successfully',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('❌ Error creating event:', error);
      Alert.alert('Error', 'Network error while creating event');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Event</Text>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.errorInput]}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Enter event title"
                editable={!loading}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Enter event description"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Type *</Text>
              <View style={styles.eventTypeContainer}>
                {EVENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.eventTypeButton,
                      formData.eventType === type.key && styles.selectedEventType
                    ]}
                    onPress={() => handleInputChange('eventType', type.key)}
                    disabled={loading}
                  >
                    <Text style={styles.eventTypeIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.eventTypeText,
                      formData.eventType === type.key && styles.selectedEventTypeText
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Date and Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date & Time</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event Date *</Text>
              <TextInput
                style={[styles.input, errors.eventDate && styles.errorInput]}
                value={formData.eventDate}
                onChangeText={(value) => handleInputChange('eventDate', value)}
                placeholder="YYYY-MM-DD"
                editable={!loading}
              />
              {errors.eventDate && <Text style={styles.errorText}>{errors.eventDate}</Text>}
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Start Time *</Text>
                <TextInput
                  style={[styles.input, errors.startTime && styles.errorInput]}
                  value={formData.startTime}
                  onChangeText={(value) => handleInputChange('startTime', value)}
                  placeholder="HH:MM (24h)"
                  editable={!loading}
                />
                {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={[styles.input, errors.endTime && styles.errorInput]}
                  value={formData.endTime}
                  onChangeText={(value) => handleInputChange('endTime', value)}
                  placeholder="HH:MM (24h)"
                  editable={!loading}
                />
                {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Location *</Text>
              <View style={styles.locationContainer}>
                {LOCATIONS.map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.locationButton,
                      formData.location === location && styles.selectedLocation
                    ]}
                    onPress={() => handleInputChange('location', location)}
                    disabled={loading}
                  >
                    <Text style={[
                      styles.locationText,
                      formData.location === location && styles.selectedLocationText
                    ]}>
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>

            {formData.location === 'Custom Location' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Custom Location *</Text>
                <TextInput
                  style={[styles.input, errors.customLocation && styles.errorInput]}
                  value={formData.customLocation}
                  onChangeText={(value) => handleInputChange('customLocation', value)}
                  placeholder="Enter custom location"
                  editable={!loading}
                />
                {errors.customLocation && <Text style={styles.errorText}>{errors.customLocation}</Text>}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                placeholder="Enter full address (optional)"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>
          </View>

          {/* Additional Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Maximum Attendees</Text>
              <TextInput
                style={[styles.input, errors.maxAttendees && styles.errorInput]}
                value={formData.maxAttendees}
                onChangeText={(value) => handleInputChange('maxAttendees', value)}
                placeholder="Leave empty for unlimited"
                keyboardType="numeric"
                editable={!loading}
              />
              {errors.maxAttendees && <Text style={styles.errorText}>{errors.maxAttendees}</Text>}
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📋 Note:</Text>
            <Text style={styles.infoText}>
              • Fields marked with * are required{'\n'}
              • Event date must be today or in the future{'\n'}
              • QR code will be auto-generated for attendance{'\n'}
              • Organizers can scan member QR codes to mark attendance
            </Text>
          </View>
        </ScrollView>

        <StatusBar style="light" />
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
  },
  backButton: {
    minWidth: 60,
  },
  backButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.onPrimary,
  },
  title: {
    ...Theme.typography.h4,
    color: Theme.colors.text.onPrimary,
    textAlign: 'center',
    flex: 1,
  },
  submitButton: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  submitButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.success,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedText: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  accessDeniedSubtext: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  section: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginVertical: Theme.spacing.md,
  },
  sectionTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Theme.colors.primary,
    paddingBottom: Theme.spacing.sm,
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    ...Theme.typography.body2,
    fontWeight: '600',
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  input: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm + 2,
    borderRadius: Theme.borderRadius.md,
    fontSize: Theme.typography.body1.fontSize,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    color: Theme.colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: Theme.spacing.sm + 2,
  },
  errorInput: {
    borderColor: Theme.colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    ...Theme.typography.caption,
    color: Theme.colors.error,
    marginTop: Theme.spacing.xs,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  eventTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
    minWidth: 100,
  },
  selectedEventType: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary,
  },
  eventTypeIcon: {
    fontSize: 16,
    marginRight: Theme.spacing.xs,
  },
  eventTypeText: {
    ...Theme.typography.body2,
    color: Theme.colors.text.primary,
  },
  selectedEventTypeText: {
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  locationContainer: {
    gap: Theme.spacing.sm,
  },
  locationButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.background,
  },
  selectedLocation: {
    borderColor: Theme.colors.secondary,
    backgroundColor: Theme.colors.secondary,
  },
  locationText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.primary,
    textAlign: 'center',
  },
  selectedLocationText: {
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#E8F5E8',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    marginVertical: Theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.success,
  },
  infoTitle: {
    ...Theme.typography.body2,
    fontWeight: '600',
    color: Theme.colors.secondary,
    marginBottom: Theme.spacing.xs,
  },
  infoText: {
    ...Theme.typography.caption,
    color: Theme.colors.secondary,
    lineHeight: 16,
  },
});