/**
 * @file (tabs)/expenses.tsx → Tab "Gastos"
 * @description Módulo básico para control financiero (en construcción).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  created_at: string;
}

const CATEGORIES = [
  { key: 'alimentacion', label: 'Alimentación', emoji: '🍔' },
  { key: 'transporte', label: 'Transporte', emoji: '🚗' },
  { key: 'entretenimiento', label: 'Entretenimiento', emoji: '🎬' },
  { key: 'salud', label: 'Salud', emoji: '💊' },
  { key: 'educacion', label: 'Educación', emoji: '📚' },
  { key: 'servicios', label: 'Servicios', emoji: '💡' },
  { key: 'compras', label: 'Compras', emoji: '🛍️' },
  { key: 'otros', label: 'Otros', emoji: '📦' },
];

const STORAGE_KEY = 'taskflow_expenses';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('otros');
  const [notes, setNotes] = useState('');

  const loadExpenses = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setExpenses(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadExpenses(); }, []);

  const saveExpenses = async (list: Expense[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setExpenses(list);
  };

  const handleAdd = async () => {
    if (!title.trim() || !amount) return;
    const exp: Expense = {
      id: `exp-${Date.now()}`,
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString().split('T')[0],
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };
    await saveExpenses([exp, ...expenses]);
    setTitle(''); setAmount(''); setNotes(''); setCategory('otros');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar gasto', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => saveExpenses(expenses.filter(e => e.id !== id)) },
    ]);
  };

  const thisMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const monthExpenses = expenses.filter(e => e.date.startsWith(thisMonth));
  const totalMonth = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Gastos</Text>
        <Text style={styles.subtitle}>
          <Ionicons name="construct-outline" size={13} color={COLORS.textMuted} /> Módulo en construcción
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Ionicons name="wallet-outline" size={22} color={COLORS.primary} />
            <Text style={[styles.statNumber, { color: COLORS.primary }]}>S/. {totalMonth.toFixed(2)}</Text>
            <Text style={[styles.statLabel, { color: COLORS.primary }]}>Este mes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="receipt-outline" size={22} color={COLORS.textSecondary} />
            <Text style={styles.statNumber}>{monthExpenses.length}</Text>
            <Text style={styles.statLabel}>Transacciones</Text>
          </View>
        </View>

        {/* Add button */}
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close-circle-outline' : 'add-circle-outline'} size={20} color={COLORS.background} />
          <Text style={styles.addButtonText}>{showForm ? 'Cerrar' : 'Registrar gasto'}</Text>
        </TouchableOpacity>

        {/* Form */}
        {showForm && (
          <View style={styles.formCard}>
            <TextInput style={styles.input} placeholder="Descripción..." placeholderTextColor={COLORS.textMuted}
              value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Monto (S/.)" placeholderTextColor={COLORS.textMuted}
              value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <View style={styles.categoriesRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c.key}
                  style={[styles.categoryChip, category === c.key && styles.categoryChipActive]}
                  onPress={() => setCategory(c.key)}>
                  <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Notas (opcional)" placeholderTextColor={COLORS.textMuted}
              value={notes} onChangeText={setNotes} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd} disabled={!title.trim() || !amount}>
              <Text style={styles.submitBtnText}>Agregar gasto</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        <Text style={styles.sectionTitle}>Gastos recientes</Text>
        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No hay gastos registrados.</Text>
          </View>
        ) : (
          expenses.slice(0, 20).map(exp => {
            const catInfo = CATEGORIES.find(c => c.key === exp.category);
            return (
              <TouchableOpacity key={exp.id} style={styles.expenseItem} onLongPress={() => handleDelete(exp.id)}>
                <Text style={styles.expenseEmoji}>{catInfo?.emoji ?? '📦'}</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.lg, gap: SPACING.md },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: '700', color: COLORS.textPrimary, paddingTop: SPACING.md },
  subtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textMuted },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  statCardAccent: { backgroundColor: COLORS.primaryDim, borderColor: COLORS.primary },
  statNumber: { fontSize: TYPOGRAPHY.xl, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary },
  addButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addButtonText: { color: COLORS.background, fontWeight: '600', fontSize: TYPOGRAPHY.md },
  formCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  input: { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.sm, padding: 10, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.md, borderWidth: 1, borderColor: COLORS.border },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  categoryChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  categoryEmoji: { fontSize: 18 },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, padding: 12, alignItems: 'center' },
  submitBtnText: { color: COLORS.background, fontWeight: '600', fontSize: TYPOGRAPHY.md },
  sectionTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: SPACING.md },
  emptyState: { alignItems: 'center', padding: SPACING.xxxl, gap: SPACING.md },
  emptyText: { fontSize: TYPOGRAPHY.md, color: COLORS.textMuted },
  expenseItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  expenseEmoji: { fontSize: 20 },
  expenseInfo: { flex: 1 },
  expenseTitle: { fontSize: TYPOGRAPHY.md, fontWeight: '600', color: COLORS.textPrimary },
  expenseDate: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, marginTop: 2 },
  expenseAmount: { fontSize: TYPOGRAPHY.md, fontWeight: '700', color: COLORS.primary },
});
