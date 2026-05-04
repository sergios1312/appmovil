/**
 * @file (tabs)/settings.tsx → Tab "Ajustes"
 * @description Pantalla de ajustes con info del usuario y opciones de cuenta.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/presentation/hooks/useAuth';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/utils/constants';

interface SettingItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

export default function SettingsScreen() {
  const { user, signOut, isAuthenticated } = useAuth();

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

  const SETTINGS: SettingItem[] = [
    { icon: 'logo-google', label: 'Cuenta de Google', value: user?.email ?? 'No conectado' },
    { icon: 'sync-outline', label: 'Sincronización', value: 'Manual', onPress: () => {} },
    { icon: 'notifications-outline', label: 'Notificaciones', value: 'Activadas', onPress: () => {} },
    { icon: 'moon-outline', label: 'Tema', value: 'Oscuro', onPress: () => {} },
    { icon: 'information-circle-outline', label: 'Versión', value: '1.0.0' },
    { icon: 'log-out-outline', label: 'Cerrar sesión', onPress: handleSignOut, danger: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ajustes</Text>

        {/* Perfil del usuario */}
        {isAuthenticated && user && (
          <View style={styles.profileCard}>
            {user.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user.name[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <View style={styles.syncBadge}>
                <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                <Text style={styles.syncBadgeText}>Google conectado</Text>
              </View>
            </View>
          </View>
        )}

        {/* Lista de ajustes */}
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
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.danger ? COLORS.danger : COLORS.textSecondary}
                />
                <Text style={[styles.settingLabel, item.danger && styles.settingLabelDanger]}>
                  {item.label}
                </Text>
              </View>
              {item.value && (
                <Text style={styles.settingValue}>{item.value}</Text>
              )}
              {item.onPress && !item.danger && (
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.lg },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: '700', color: COLORS.textPrimary, paddingTop: SPACING.md },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: { fontSize: TYPOGRAPHY.xl, fontWeight: '700', color: COLORS.background },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: TYPOGRAPHY.lg, fontWeight: '600', color: COLORS.textPrimary },
  profileEmail: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  syncBadgeText: { fontSize: TYPOGRAPHY.xs, color: COLORS.success, fontWeight: '500' },
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
  settingLabel: { fontSize: TYPOGRAPHY.md, color: COLORS.textPrimary },
  settingLabelDanger: { color: COLORS.danger },
  settingValue: { fontSize: TYPOGRAPHY.sm, color: COLORS.textMuted, marginRight: SPACING.xs },
});
