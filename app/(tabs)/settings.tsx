/**
 * @file (tabs)/settings.tsx → Tab "Perfil"
 * @description Pantalla de perfil y ajustes – Estilo Quest UI.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useTaskStore } from '@/presentation/store/taskStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

interface SettingItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

export default function SettingsScreen() {
  const { user, signOut, isAuthenticated } = useAuth();
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const isLoading = useTaskStore((state) => state.isLoading);

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión? Los datos locales se conservarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleSync = async () => {
    if (!isAuthenticated) {
      Alert.alert('Inicia sesión', 'Debes estar conectado para sincronizar.');
      return;
    }
    await loadTasks();
    Alert.alert('Sincronización', 'Datos recargados desde Supabase.');
  };

  const SETTINGS: SettingItem[] = [
    { icon: 'logo-google', label: 'Cuenta de Google', value: user?.email ?? 'No conectado' },
    { icon: 'sync-outline', label: 'Sincronización', value: isLoading ? 'Sincronizando...' : 'Tiempo real', onPress: handleSync },
    { icon: 'notifications-outline', label: 'Notificaciones', value: 'Activadas', onPress: () => {} },
    { icon: 'moon-outline', label: 'Tema', value: 'Oscuro', onPress: () => {} },
    { icon: 'information-circle-outline', label: 'Versión', value: '1.0.0' },
    { icon: 'log-out-outline', label: 'Cerrar sesión', onPress: handleSignOut, danger: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.appLabel}>PERFIL</Text>
        <Text style={styles.title}>Configuración</Text>

        {/* Profile Card */}
        {isAuthenticated && user && (
          <View style={styles.profileCard}>
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{user.name[0]?.toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.avatarGlow} />
              {/* Level badge */}
              <View style={styles.avatarLevelBadge}>
                <Ionicons name="star" size={10} color={COLORS.gold} />
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>En línea · Google conectado</Text>
              </View>
            </View>
          </View>
        )}

        {/* Settings list */}
        <View style={styles.settingsGroup}>
          {SETTINGS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.settingRow, i === SETTINGS.length - 1 && styles.settingRowLast]}
              onPress={item.onPress}
              disabled={!item.onPress}
              activeOpacity={item.onPress ? 0.7 : 1}
            >
              <View style={styles.settingLeft}>
                <View style={[
                  styles.settingIconWrap,
                  item.danger && styles.settingIconWrapDanger,
                ]}>
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={item.danger ? COLORS.accent : COLORS.primary}
                  />
                </View>
                <Text style={[styles.settingLabel, item.danger && styles.settingLabelDanger]}>
                  {item.label}
                </Text>
              </View>
              {item.value && (
                <Text style={styles.settingValue}>{item.value}</Text>
              )}
              {item.onPress && !item.danger && (
                <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>QUESTLIST v1.0.0</Text>
          <Text style={styles.appInfoSubtext}>Sistema de misiones personales</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.lg },

  appLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 3,
  },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    ...SHADOWS.glowCyan,
  },
  avatarContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primaryDim,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: TYPOGRAPHY.xl, fontWeight: '800', color: COLORS.primary },
  avatarGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  avatarLevelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.goldDim,
    borderWidth: 2,
    borderColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: TYPOGRAPHY.lg, fontWeight: '700', color: COLORS.textPrimary },
  profileEmail: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  statusText: { fontSize: TYPOGRAPHY.xs, color: COLORS.success, fontWeight: '600' },

  // Settings
  settingsGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingRowLast: { borderBottomWidth: 0 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
  settingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconWrapDanger: {
    backgroundColor: COLORS.accentDim,
  },
  settingLabel: { fontSize: TYPOGRAPHY.md, color: COLORS.textPrimary, fontWeight: '500' },
  settingLabelDanger: { color: COLORS.accent },
  settingValue: { fontSize: TYPOGRAPHY.sm, color: COLORS.textMuted, marginRight: SPACING.xs },

  // Footer
  appInfo: { alignItems: 'center', paddingTop: SPACING.md },
  appInfoText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    fontWeight: '800',
    letterSpacing: 2,
  },
  appInfoSubtext: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
