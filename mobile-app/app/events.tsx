// mobile-app/app/events.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
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
    accent: '#E0E0E0',
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

interface Event {
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
  attendanceCount: number;
  creator: {
    fullName: string;
    role: string;
  };
  createdAt: string;
}

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  const isAdmin = () => user?.role === 'admin';
  const isOrganizer = () => user?.role === 'organizer' || user?.role === 'admin';

  const loadEvents = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        active: 'true',
        ...(filter === 'upcoming' && { upcoming: 'true' }),
        ...(filter === 'past' && { past: 'true' }),
      });

      const response = await apiRequest<{ events: Event[] }>(`/events?${queryParams}`);

      if (response.success && response.data) {
        setEvents(response.data.events);
      } else {
        Alert.alert('Error', 'Failed to load events');
      }
    } catch (error) {
      console.error('❌ Error loading events:', error);
      Alert.alert('Error', 'Network error while loading events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEvents();
  }, [loadEvents]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const renderEvent = ({ item }: { item: Event }) => {
    const isUpcoming = new Date(item.eventDate) > new Date();
    
    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/event-detail?id=${item.id}`)}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventTypeContainer}>
            <Text style={styles.eventTypeIcon}>{getEventTypeIcon(item.eventType)}</Text>
            <Text style={[
              styles.eventType,
              { backgroundColor: getEventTypeColor(item.eventType) }
            ]}>
              {item.eventType.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={[
            styles.eventStatus,
            { color: isUpcoming ? Theme.colors.success : Theme.colors.secondary }
          ]}>
            {isUpcoming ? 'UPCOMING' : 'COMPLETED'}
          </Text>
        </View>

        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
        
        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailIcon}>📅</Text>
            <Text style={styles.eventDetailText}>{formatDate(item.eventDate)}</Text>
          </View>
          
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailIcon}>🕐</Text>
            <Text style={styles.eventDetailText}>
              {formatTime(item.startTime)}
              {item.endTime && ` - ${formatTime(item.endTime)}`}
            </Text>
          </View>
          
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailIcon}>📍</Text>
            <Text style={styles.eventDetailText} numberOfLines={1}>{item.location}</Text>
          </View>

          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailIcon}>👥</Text>
            <Text style={styles.eventDetailText}>
              {item.attendanceCount} attendees
              {item.maxAttendees && ` / ${item.maxAttendees} max`}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.eventFooter}>
          <Text style={styles.eventCreator}>
            Created by {item.creator?.fullName} ({item.creator?.role})
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📅</Text>
      <Text style={styles.emptyStateTitle}>No {filter} events</Text>
      <Text style={styles.emptyStateText}>
        {filter === 'upcoming' 
          ? 'No upcoming events scheduled' 
          : filter === 'past'
          ? 'No past events to show'
          : 'No events available'
        }
      </Text>
      {isAdmin() && (
        <TouchableOpacity
          style={styles.createEventButton}
          onPress={() => router.push('/create-event')}
        >
          <Text style={styles.createEventButtonText}>Create New Event</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Events</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Events</Text>
        <View style={styles.headerRight}>
          {isAdmin() && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-event')}
            >
              <Text style={styles.createButtonText}>+ Create</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['upcoming', 'past', 'all'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterTab,
              filter === filterType && styles.activeFilterTab
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[
              styles.filterTabText,
              filter === filterType && styles.activeFilterTabText
            ]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          events.length === 0 && styles.emptyListContainer
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Quick Actions for Admin/Organizer */}
      {isOrganizer() && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/attendance-scanner')}
          >
            <Text style={styles.quickActionIcon}>📱</Text>
            <Text style={styles.quickActionText}>Scan QR</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/location-attendance')}
          >
            <Text style={styles.quickActionIcon}>📍</Text>
            <Text style={styles.quickActionText}>Location</Text>
          </TouchableOpacity>
        </View>
      )}

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
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  createButton: {
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  createButtonText: {
    ...Theme.typography.body2,
    color: Theme.colors.text.onSecondary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.spacing.lg,
    marginVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.md,
  },
  activeFilterTab: {
    backgroundColor: Theme.colors.primary,
  },
  filterTabText: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: Theme.colors.text.onPrimary,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  eventCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTypeIcon: {
    fontSize: 16,
    marginRight: Theme.spacing.xs,
  },
  eventType: {
    ...Theme.typography.caption,
    color: Theme.colors.text.onPrimary,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    fontWeight: '600',
    fontSize: 10,
  },
  eventStatus: {
    ...Theme.typography.caption,
    fontWeight: '600',
    fontSize: 10,
  },
  eventTitle: {
    ...Theme.typography.h4,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  eventDetails: {
    marginBottom: Theme.spacing.md,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  eventDetailIcon: {
    fontSize: 14,
    width: 20,
    marginRight: Theme.spacing.sm,
  },
  eventDetailText: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    flex: 1,
  },
  eventDescription: {
    ...Theme.typography.body2,
    color: Theme.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: Theme.spacing.md,
  },
  eventFooter: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: Theme.spacing.sm,
  },
  eventCreator: {
    ...Theme.typography.caption,
    color: Theme.colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: Theme.spacing.lg,
    opacity: 0.3,
  },
  emptyStateTitle: {
    ...Theme.typography.h3,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  emptyStateText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  createEventButton: {
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  createEventButtonText: {
    ...Theme.typography.body1,
    color: Theme.colors.text.onSecondary,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.background,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: Theme.spacing.xs,
  },
  quickActionText: {
    ...Theme.typography.caption,
    color: Theme.colors.text.primary,
    fontWeight: '600',
  },
});