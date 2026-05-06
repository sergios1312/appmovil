import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchPrimaryCalendarEvents } from '@/infrastructure/services/googleCalendar';
import { fetchGoogleProfile, useGoogleLoginRequest } from '@/infrastructure/services/googleAuth';
import { useAuthStore } from '@/presentation/store/authStore';
import type { CalendarEvent } from '@/core/types/calendar';

export default function CalendarScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = useGoogleLoginRequest();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    const runAuthFlow = async () => {
      if (response?.type !== 'success') {
        return;
      }
      const token =
        response.authentication?.accessToken ??
        response.params?.access_token;
      if (!token) {
        setError('No se recibió access token de Google.');
        return;
      }

      try {
        setError(null);
        const profile = await fetchGoogleProfile(token);
        const expiresAt = new Date(Date.now() + 3600000).toISOString();
        await setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar_url: profile.picture,
          access_token: token,
          token_expires_at: expiresAt,
          granted_scopes: [],
        });
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Error autenticando con Google.');
      }
    };

    runAuthFlow();
  }, [response, setUser]);

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
    await promptAsync();
  };

  const handleSignOut = async () => {
    await signOut();
    setEvents([]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Google Calendar</Text>
      <Text style={styles.subtitle}>Conexión OAuth + lectura de eventos del calendario primario.</Text>

      {!isAuthenticated ? (
        <Pressable
          disabled={!request}
          onPress={handleSignIn}
          style={[styles.button, !request && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>Iniciar sesión con Google</Text>
        </Pressable>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{user?.name ?? 'Usuario autenticado'}</Text>
          <Text style={styles.cardText}>{user?.email ?? 'Sin correo'}</Text>
          <Pressable onPress={handleSignOut} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      )}

      {isAuthenticated && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Próximos eventos</Text>
          {isLoading ? (
            <Text style={styles.cardText}>Cargando eventos...</Text>
          ) : events.length === 0 ? (
            <Text style={styles.cardText}>No hay eventos próximos.</Text>
          ) : (
            events.map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.cardText}>{new Date(event.startDate).toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
  },
  button: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardText: {
    fontSize: 13,
    color: '#666',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  eventRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    gap: 2,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#a00',
    fontSize: 13,
  },
});
