/**
 * @file (tabs)/calendar.tsx → Tab "Calendario"
 * @description Vista de calendario (placeholder para futura integración con Google Calendar).
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/src/utils/constants';
import { formatDateFriendly } from '@/src/utils/dateHelpers';

export default function CalendarScreen() {
  const today = new Date();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Calendario</Text>
          <Text style={styles.subtitle}>{formatDateFriendly(today)}</Text>
        </View>

        {/* Placeholder de integración */}
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderEmoji}>📅</Text>
          <Text style={styles.placeholderTitle}>Google Calendar</Text>
          <Text style={styles.placeholderText}>
            La integración con Google Calendar se implementará en la próxima iteración.
            {'\n\n'}
            Una vez conectado, verás aquí tus eventos sincronizados con las tareas.
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Próximamente</Text>
          </View>
        </View>

        {/* Preview de la semana */}
        <Text style={styles.sectionTitle}>Esta semana</Text>
        <WeekPreview />
      </ScrollView>
    </SafeAreaView>
  );
}

function WeekPreview() {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <View style={styles.weekRow}>
      {days.map((day, i) => {
        const isToday = i === 0;
        return (
          <View key={i} style={[styles.dayCell, isToday && styles.dayCellToday]}>
            <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
              {dayNames[day.getDay()]}
            </Text>
            <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
              {day.getDate()}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.lg },
  header: { paddingTop: SPACING.md },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 2 },
  placeholderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  placeholderEmoji: { fontSize: 48 },
  placeholderTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: '700', color: COLORS.textPrimary },
  placeholderText: { fontSize: TYPOGRAPHY.md, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  badge: { backgroundColor: COLORS.primaryDim, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  badgeText: { fontSize: TYPOGRAPHY.xs, color: COLORS.primary, fontWeight: '600' },
  sectionTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: '600', color: COLORS.textPrimary },
  weekRow: { flexDirection: 'row', gap: SPACING.xs },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayCellToday: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayName: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, fontWeight: '500' },
  dayNameToday: { color: COLORS.background },
  dayNumber: { fontSize: TYPOGRAPHY.lg, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
  dayNumberToday: { color: COLORS.background },
});
