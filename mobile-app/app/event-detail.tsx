// mobile-app/app/event-detail.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Share,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/apiUtils';
import QRCode from 'react-native-qrcode-svg';

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
      onSecondary: '#ffffff',
    },
    border: '#eee',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' as const },
    h2: { fontSize: 28, fontWeight: 'bold' as const },
    h3: { fontSize: 24, fontWeight: 'bold' as const },
    h4: { fontSize: 20, fontWeight: 'bold' as const },
    body1: { fontSize: 16, fontWeight: 'normal' as const },
    body2: { fontSize: 14, fontWeight: 'normal' as const },
    caption: { fontSize: 12, fontWeight: 'normal' as const },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
};

interface EventDetail {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  address: string;
  eventType: string;
  maxAttendees: number;
  isActive: boolean;
  qrCode: string;
  creator: {
    id: string;
    fullName: string;
    role: string;
  };
  attendances: Array<{
    id: string;
    user: {
      fullName: string;
      membershipId: string;
      phone: string;
      role: string;
    };
    checkInTime: string;
    status: string;
  }>;
  attendanceCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function EventDetailScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);

  const isAdmin = () => user?.role === 'admin';
  const isOrganizer = () => user?.role === 'organizer' || user?.role === 'admin';

  useEffect(() => {
    if (id) {
      loadEventDetail();
    }
  }, [id]);

  const loadEventDetail = async () => {
    try {
      const response = await apiRequest<{ event: EventDetail }>(`/events/${id}`);
      
      if (response.success && response.data) {
        setEvent(response.data.event);
      } else {
        Alert.alert('Error', 'Failed to load event details');
        router.back();
      }
    } catch (error) {
      console.error('❌ Error loading event:', error);
      Alert.alert('Error', 'Network error while loading event');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEventDetail();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      meeting: '#2196F3',
      rally: '#FF5722',
      conference: '#9C27B0',
      community_service: '#4CAF50',
      training: '#FF9800',
      other: '#607D8B'
    };
    return colors[eventType] || colors.other;
  };

  const getEventTypeIcon = (eventType: string) => {
    const icons = {
      meeting: '🤝',
      rally: '📢',
      conference: '🎤',
      community_service: '🤲',
      training: '📚',
      other: '📅'
    };
    return icons[eventType] || icons.other;
  };

  const shareEvent = async () => {
    if (!event) return;

    try {
      const eventDate = formatDate(event.eventDate);
      const startTime = formatTime(event.startTime);
      
      const shareContent = {
        title: event.title,
        message: `📅 ${event.title}\n\n📍 ${event.location}\n🗓️ ${eventDate}\n🕐 ${startTime}\n\n${event.description || ''}\n\nJoin us at this Gorkha Janshakti Front event!`,
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const deleteEvent = () => {
    if (!event) return;

    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiRequest(`/events/${event.id}`, {
                method: 'DELETE',
              });

              if (response.success) {
                Alert.alert('Success', 'Event deleted successfully');
                router.back();
              } else {
                Alert.alert('Error', response.error || 'Failed to delete event');
              }
            } catch (error) {
              Alert.alert('Error', 'Network error while deleting event');
            }
          }
        }
      ]
    );
  };

  const renderAttendeesList = () => (
    <Modal
      visible={showAttendeesModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAttendeesModal(false)}>
            <Text style={styles.modalCloseText}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Attendees ({event?.attendanceCount})</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.attendeesList}>
          {event?.attendances.map((attendance, index) => (
            <View key={attendance.id} style={styles.attendeeCard}>
              <View style={styles.attendeeInfo}>
                <Text style={styles.attendeeName}>{attendance.user.fullName}</Text>
                <Text style={styles.attendeeId}>ID: {attendance.user.membershipId}</Text>
                <Text style={styles.attendeePhone}>{attendance.user.phone}</Text>
              </View>
              <View style={styles.attendeeStatus}>
                <Text style={[
                  styles.statusBadge,
                  attendance.status === 'present' ? styles.presentBadge :
                  attendance.status === 'late' ? styles.lateBadge : styles.earlyBadge
                ]}>
                  {attendance.status.toUpperCase()}
                </Text>
                <Text style={styles.checkInTime}>
                  {new Date(attendance.checkInTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </Text>
              </View>
            </View>
          ))}
          
          {event?.attendances.length === 0 && (
            <View style={styles.emptyAttendees}>
              <Text style={styles.emptyAttendeesText}>No attendees yet</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderQRModal = () => (
    <Modal
      visible={showQRModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowQRModal(false)}>
            <Text style={styles.modalCloseText}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Event QR Code</Text>
          <TouchableOpacity onPress={shareEvent}>
            <Text style={styles.modalShareText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>{event?.title}</Text>
          <Text style={styles.qrSubtitle}>
            {event && formatDate(event.eventDate)} at {event && formatTime(event.startTime)}
          </Text>
          
          <View style={styles.qrCodeWrapper}>
            {event?.qrCode ? (
              <Image source={{ uri: event.qrCode }} style={styles.qrCodeImage} />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR Code</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.qrInstructions}>
            Organizers can use this QR code or scan member QR codes to mark attendance
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Event Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isUpcoming = new Date(event.eventDate) > new Date();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Event Details</Text>
        <View style={styles.headerActions}>
          {isAdmin() && (
            <TouchableOpacity onPress={deleteEvent} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={shareEvent} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Theme.colors.primary]}
          />
        }
      >
        {/* Event Header */}
        <View style={styles.eventHeader}>
          <View style={styles.eventTypeContainer}>
            <Text style={styles.eventTypeIcon}>{getEventTypeIcon(event.eventType)}</Text>
            <Text style={[
              styles.eventType,
              { backgroundColor: getEventTypeColor(event.eventType) }
            ]}>
              {event.eventType.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={[
            styles.eventStatus,
            { color: isUpcoming ? Theme.colors.success : Theme.colors.secondary }
          ]}>
            {isUpcoming ? 'UPCOMING' : 'COMPLETED'}
          </Text>
        </View>

        <Text style={styles.eventTitle}>{event.title}</Text>

        {/* Event Details */}
        <View style={styles.eventDetailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(event.eventDate)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🕐</Text>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>
              {formatTime(event.startTime)}
              {event.endTime && ` - ${formatTime(event.endTime)}`}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{event.location}</Text>
          </View>

          {event.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🏠</Text>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{event.address}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👥</Text>
            <Text style={styles.detailLabel}>Attendees:</Text>
            <TouchableOpacity onPress={() => setShowAttendeesModal(true)}>
              <Text style={[styles.detailValue, styles.attendeesLink]}>
                {event.attendanceCount} registered
                {event.maxAttendees && ` / ${event.maxAttendees} max`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        {event.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => setShowQRModal(true)}
          >
            <Text style={styles.qrButtonIcon}>📱</Text>
            <Text style={styles.qrButtonText}>View QR Code</Text>
          </TouchableOpacity>

          {isOrganizer() && (
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push('/attendance-scanner')}
            >
              <Text style={styles.scanButtonIcon}>📷</Text>
              <Text style={styles.scanButtonText}>Mark Attendance</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Creator Info */}
        <View style={styles.creatorCard}>
          <Text style={styles.creatorTitle}>Event Created By</Text>
          <Text style={styles.creatorName}>{event.creator.fullName}</Text>
          <Text style={styles.creatorRole}>({event.creator.role})</Text>
          <Text style={styles.createdDate}>
            Created: {new Date(event.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderQRModal()}
      {renderAttendeesList()}

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
    marginHorizontal: Theme.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  deleteButton: {
    padding: Theme.spacing.xs,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  shareButton: {
    padding: Theme.spacing.xs,
  },
  shareButtonText: {
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeIcon: {
    fontSize: 18,
    marginRight: Theme.spacing.xs,
  },
  eventType: {
    ...Theme.typography.caption,
    color: Theme.colors.text.onPrimary,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    fontWeight: '600',
    fontSize: 11,
  },
  eventStatus: {
    ...Theme.typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  eventTitle: {
    ...Theme.typography.h2,
    color: Theme.colors.text.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  eventDetailsCard: {
    backgroundColor: Theme.colors.surface,
    margin: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
  },
  detailIcon: {
    fontSize: 16,
    width: 25,
    marginRight: Theme.spacing.sm,
  },
  detailLabel: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    fontWeight: '500',
    width: 80,
  },
  detailValue: {
    ...Theme.typography.body2,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  attendeesLink: {
    color: Theme.colors.primary,
    textDecorationLine: 'underline',
  },
  descriptionCard: {
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
  },
  descriptionTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  descriptionText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    lineHeight: 24,
  },
  actionsCard: {
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  qrButton: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  qrButtonIcon: {
    fontSize: 20,
    marginRight: Theme.spacing.xs,
  },
  qrButtonText: {
    ...Theme.typography.body2,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  scanButton: {
    flex: 1,
    backgroundColor: Theme.colors.secondary,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scanButtonIcon: {
    fontSize: 20,
    marginRight: Theme.spacing.xs,
  },
  scanButtonText: {
    ...Theme.typography.body2,
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  creatorCard: {
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  creatorTitle: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
  },
  creatorName: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  creatorRole: {
    ...Theme.typography.body2,
    color: Theme.colors.secondary,
    fontWeight: '600',
    marginBottom: Theme.spacing.sm,
  },
  createdDate: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalHeader: {
    backgroundColor: Theme.colors.surface,
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  modalCloseText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
  },
  modalTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
  },
  modalShareText: {
    ...Theme.typography.body1,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  qrContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  qrTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  qrSubtitle: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  qrCodeWrapper: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Theme.borderRadius.md,
  },
  qrPlaceholderText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
  },
  qrInstructions: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  attendeesList: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  attendeeCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    ...Theme.typography.body1,
    color: Theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  attendeeId: {
    ...Theme.typography.body2,
    color: Theme.colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  attendeePhone: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
  },
  attendeeStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    ...Theme.typography.caption,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
    fontSize: 10,
  },
  presentBadge: {
    backgroundColor: '#E8F5E8',
    color: Theme.colors.success,
  },
  lateBadge: {
    backgroundColor: '#FFF3E0',
    color: Theme.colors.warning,
  },
  earlyBadge: {
    backgroundColor: '#E3F2FD',
    color: '#2196F3',
  },
  checkInTime: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
    marginTop: 2,
  },
  emptyAttendees: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyAttendeesText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
  },
});