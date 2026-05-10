import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchPrimaryCalendarEvents } from '@/infrastructure/services/googleCalendar';
import { fetchGoogleProfile, signInWithGoogle } from '@/infrastructure/services/googleAuth';
import { useAuthStore } from '@/presentation/store/authStore';
import type { CalendarEvent } from '@/core/types/calendar';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

export default function CalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    const loadEvents = async () => {
      if (!accessToken) {
        setEvents([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const upcomingEvents = await fetchPrimaryCalendarEvents(accessToken, {
          timeMax: next7Days,
        });
        setEvents(upcomingEvents);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Error consultando Calendar.');
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [accessToken]);

  const isAuthenticated = useMemo(() => !!accessToken, [accessToken]);

  const handleSignIn = async () => {
    setError(null);
    try {
      const result = await signInWithGoogle();
      if (!result) return;

      const profile = await fetchGoogleProfile(result.accessToken);
      const expiresAt = new Date(Date.now() + 3600000).toISOString();
      await setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.picture,
        access_token: result.accessToken,
        token_expires_at: expiresAt,
        granted_scopes: [],
      });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Error autenticando con Google.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setEvents([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.appLabel}>INTEL</Text>
        <Text style={styles.title}>Calendario</Text>
        <Text style={styles.subtitle}>Eventos sincronizados con Google Calendar</Text>

        {!isAuthenticated ? (
          <Pressable onPress={handleSignIn} style={styles.connectButton}>
            <Ionicons name="logo-google" size={18} color={COLORS.textInverse} />
            <Text style={styles.connectButtonText}>Conectar con Google</Text>
          </Pressable>
        ) : (
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name ?? 'Usuario autenticado'}</Text>
                <Text style={styles.profileEmail}>{user?.email ?? 'Sin correo'}</Text>
              </View>
            </View>
            <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
              <Ionicons name="log-out-outline" size={14} color={COLORS.accent} />
              <Text style={styles.signOutText}>Desconectar</Text>
            </Pressable>
          </View>
        )}

        {isAuthenticated && (
          <View style={styles.eventsCard}>
            <View style={styles.eventsHeader}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.eventsTitle}>Próximos eventos</Text>
              <Text style={styles.eventsCount}>{events.length}</Text>
            </View>
            {isLoading ? (
              <Text style={styles.loadingText}>Cargando eventos...</Text>
            ) : events.length === 0 ? (
              <View style={styles.emptyEvents}>
                <Ionicons name="calendar-clear-outline" size={36} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No hay eventos próximos.</Text>
              </View>
            ) : (
              events.map((event) => (
                <View key={event.id} style={styles.eventRow}>
                  <View style={styles.eventDot} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDate}>
                      {new Date(event.startDate).toLocaleString('es', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
                </View>
              ))
            )}
          </View>
        )}

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={16} color={COLORS.accent} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.md },

  appLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },

  connectButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.glowCyan,
  },
  connectButtonText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: TYPOGRAPHY.md,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1,
    borderColor: `${COLORS.primary}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: TYPOGRAPHY.md, fontWeight: '600', color: COLORS.textPrimary },
  profileEmail: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: `${COLORS.accent}40`,
    backgroundColor: COLORS.accentDim,
  },
  signOutText: {
    color: COLORS.accent,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  eventsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  eventsTitle: { fontSize: TYPOGRAPHY.md, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  eventsCount: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sm },
  emptyEvents: { alignItems: 'center', padding: SPACING.xl, gap: SPACING.sm },
  emptyText: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.md },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: TYPOGRAPHY.md, fontWeight: '600', color: COLORS.textPrimary },
  eventDate: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 2 },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accentDim,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.accent}40`,
  },
  errorText: { color: COLORS.accent, fontSize: TYPOGRAPHY.sm, flex: 1 },
});
