/**
 * @file (tabs)/expenses.tsx → Tab "Gastos" (CREDITS)
 * @description Módulo financiero sincronizado con Supabase + Realtime (paridad con la web).
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';
import {
  useExpenseStore,
  selectExpenseStats,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '@/presentation/store/expenseStore';

export default function ExpensesScreen() {
  const store = useExpenseStore();
  const stats = useExpenseStore(selectExpenseStats);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('otros');
  const [notes, setNotes] = useState('');

  useEffect(() => { store.loadExpenses(); }, []);

  const handleAdd = async () => {
    if (!title.trim() || !amount) return;
    try {
      await store.addExpense({
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD local
        notes: notes.trim() || undefined,
      });
      setTitle(''); setAmount(''); setNotes(''); setCategory('otros');
      setShowForm(false);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el gasto. Revisa tu conexión.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar gasto', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => store.deleteExpense(id) },
    ]);
  };

  const sortedCats = Object.entries(stats.byCategory).sort(([, a], [, b]) => b - a);
  const topCategory = sortedCats[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.appLabel}>INVENTARIO</Text>
        <Text style={styles.title}>Gestión de Recursos</Text>
        <Text style={styles.subtitle}>Control financiero mensual</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
            <Text style={[styles.statNumber, { color: COLORS.primary }]}>S/. {stats.totalMonth.toFixed(2)}</Text>
            <Text style={[styles.statLabel, { color: COLORS.primary }]}>ESTE MES</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="receipt-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.statNumber}>{stats.monthExpenses.length}</Text>
            <Text style={styles.statLabel}>TRANSACCIONES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>
              {topCategory ? (EXPENSE_CATEGORIES.find((c) => c.key === topCategory[0])?.emoji ?? '📦') : '—'}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              {topCategory ? (EXPENSE_CATEGORIES.find((c) => c.key === topCategory[0])?.label.toUpperCase() ?? 'TOP') : 'SIN DATOS'}
            </Text>
          </View>
        </View>

        {/* Desglose por categoría */}
        {sortedCats.length > 0 && (
          <View style={styles.breakdownCard}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="pie-chart-outline" size={12} color={COLORS.primary} /> DESGLOSE POR CATEGORÍA
            </Text>
            {sortedCats.map(([cat, total]) => {
              const info = EXPENSE_CATEGORIES.find((c) => c.key === cat);
              const pct = stats.totalMonth > 0 ? Math.round((total / stats.totalMonth) * 100) : 0;
              return (
                <View key={cat} style={styles.breakdownRow}>
                  <Text style={styles.breakdownEmoji}>{info?.emoji ?? '📦'}</Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.breakdownTop}>
                      <Text style={styles.breakdownName}>{info?.label ?? cat}</Text>
                      <Text style={styles.breakdownPct}>{pct}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.breakdownAmount}>S/. {total.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Add button */}
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close-circle-outline' : 'add-circle-outline'} size={18} color={COLORS.textInverse} />
          <Text style={styles.addButtonText}>{showForm ? 'CERRAR' : 'REGISTRAR GASTO'}</Text>
        </TouchableOpacity>

        {/* Form */}
        {showForm && (
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              placeholder="Descripción..."
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Monto (S/.)"
              placeholderTextColor={COLORS.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <View style={styles.categoriesRow}>
              {EXPENSE_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.categoryChip, category === c.key && styles.categoryChipActive]}
                  onPress={() => setCategory(c.key)}
                >
                  <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Notas (opcional)"
              placeholderTextColor={COLORS.textMuted}
              value={notes}
              onChangeText={setNotes}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd} disabled={!title.trim() || !amount}>
              <Ionicons name="checkmark-outline" size={16} color={COLORS.textInverse} />
              <Text style={styles.submitBtnText}>CONFIRMAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        <Text style={styles.sectionTitle}>
          <Ionicons name="time-outline" size={12} color={COLORS.primary} /> GASTOS RECIENTES
        </Text>
        {store.expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={42} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Sin registros</Text>
            <Text style={styles.emptyText}>No hay gastos registrados aún.</Text>
          </View>
        ) : (
          store.expenses.slice(0, 20).map((exp) => {
            const catInfo = EXPENSE_CATEGORIES.find((c) => c.key === exp.category);
            return (
              <TouchableOpacity key={exp.id} style={styles.expenseItem} onLongPress={() => handleDelete(exp.id)}>
                <View style={styles.expenseEmojiWrap}>
                  <Text style={styles.expenseEmoji}>{catInfo?.emoji ?? '📦'}</Text>
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>{exp.title}</Text>
                  <Text style={styles.expenseDate}>
                    {new Date(exp.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    {exp.notes ? ` · ${exp.notes}` : ''}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>S/. {exp.amount.toFixed(2)}</Text>
              </TouchableOpacity>
            );
          })
        )}
        <Text style={styles.hint}>Mantén pulsado un gasto para eliminarlo.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.huge },

  appLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.primary, fontWeight: '800', letterSpacing: 3 },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },

  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 4,
  },
  statCardPrimary: { backgroundColor: COLORS.primaryDim, borderColor: `${COLORS.primary}40` },
  statNumber: { fontSize: TYPOGRAPHY.lg, fontWeight: '800', color: COLORS.textPrimary },
  statEmoji: { fontSize: 20 },
  statLabel: { fontSize: 8, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1 },

  breakdownCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg,
    gap: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  breakdownEmoji: { fontSize: 20 },
  breakdownTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownName: { fontSize: TYPOGRAPHY.sm, color: COLORS.textPrimary, fontWeight: '600' },
  breakdownPct: { fontSize: TYPOGRAPHY.xs, color: COLORS.primary, fontWeight: '700' },
  breakdownAmount: { fontSize: TYPOGRAPHY.sm, color: COLORS.primary, fontWeight: '800', minWidth: 70, textAlign: 'right' },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: COLORS.surfaceBright, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },

  addButton: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...SHADOWS.glowCyan,
  },
  addButtonText: { color: COLORS.textInverse, fontWeight: '700', fontSize: TYPOGRAPHY.sm, letterSpacing: 1 },

  formCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.borderGlow, ...SHADOWS.glowCyan,
  },
  input: {
    backgroundColor: COLORS.surfaceBright, borderRadius: RADIUS.sm, padding: 12,
    color: COLORS.textPrimary, fontSize: TYPOGRAPHY.md, borderWidth: 1, borderColor: COLORS.border,
  },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surfaceBright,
    borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  categoryChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim, ...SHADOWS.glowCyan },
  categoryEmoji: { fontSize: 18 },
  submitBtn: {
    backgroundColor: COLORS.secondary, borderRadius: RADIUS.sm, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, ...SHADOWS.glowGreen,
  },
  submitBtnText: { color: COLORS.textInverse, fontWeight: '700', fontSize: TYPOGRAPHY.sm, letterSpacing: 1 },

  sectionTitle: { fontSize: TYPOGRAPHY.xs, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 1.5, marginTop: SPACING.md },

  emptyState: { alignItems: 'center', padding: SPACING.huge, gap: SPACING.md },
  emptyTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: TYPOGRAPHY.md, color: COLORS.textMuted },

  expenseItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  expenseEmojiWrap: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.surfaceBright,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  expenseEmoji: { fontSize: 18 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: TYPOGRAPHY.md, fontWeight: '600', color: COLORS.textPrimary },
  expenseDate: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, marginTop: 2 },
  expenseAmount: { fontSize: TYPOGRAPHY.md, fontWeight: '800', color: COLORS.primary },
  hint: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm, fontStyle: 'italic' },
});
