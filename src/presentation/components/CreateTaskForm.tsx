/**
 * @file CreateTaskForm.tsx
 * @layer presentation/components
 * @description Modal para crear tareas/subtareas (paridad con el formulario de la web).
 * Soporta tipo, prioridad, peso, días de repetición, fecha rápida y ocultar del calendario.
 * Las fechas se guardan en hora LOCAL (sin Z), coherente con el resto de la app.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';
import { useTaskStore } from '@/presentation/store/taskStore';
import type { TaskPriority, TaskType } from '@/core/entities/Task';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Si se pasa, se crea una subtarea (tipo forzado a 'single'). */
  parentId?: string | null;
}

const TASK_TYPES: { key: TaskType; label: string; icon: IconName }[] = [
  { key: 'single', label: 'Única', icon: 'flash-outline' },
  { key: 'routine', label: 'Rutina', icon: 'repeat-outline' },
  { key: 'project', label: 'Proyecto', icon: 'folder-outline' },
  { key: 'habit_group', label: 'Grupo', icon: 'layers-outline' },
];

const PRIORITIES: { key: TaskPriority; label: string; color: string }[] = [
  { key: 'low', label: 'Baja', color: COLORS.priorityLow },
  { key: 'medium', label: 'Media', color: COLORS.priorityMedium },
  { key: 'high', label: 'Alta', color: COLORS.priorityHigh },
  { key: 'urgent', label: 'Urgente', color: COLORS.priorityUrgent },
];

const DAYS = [
  { k: 1, l: 'L' }, { k: 2, l: 'M' }, { k: 3, l: 'X' }, { k: 4, l: 'J' },
  { k: 5, l: 'V' }, { k: 6, l: 'S' }, { k: 0, l: 'D' },
];

const DATE_OPTIONS: { key: 'none' | 'today' | 'tomorrow'; label: string }[] = [
  { key: 'none', label: 'Sin fecha' },
  { key: 'today', label: 'Hoy' },
  { key: 'tomorrow', label: 'Mañana' },
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Construye un due_date ISO local (sin Z) a partir de una fecha y una hora "HH:mm". */
function localISO(date: Date, time: string): string {
  const [h, m] = (time || '12:00').split(':');
  const hh = Number.isNaN(Number(h)) ? 12 : Math.min(23, Math.max(0, Number(h)));
  const mm = Number.isNaN(Number(m)) ? 0 : Math.min(59, Math.max(0, Number(m)));
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hh)}:${pad(mm)}:00`;
}

export function CreateTaskForm({ visible, onClose, parentId = null }: Props) {
  const addTask = useTaskStore((s) => s.addTask);
  const isSubtask = !!parentId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('single');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [weight, setWeight] = useState(3);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [dateOpt, setDateOpt] = useState<'none' | 'today' | 'tomorrow'>('none');
  const [time, setTime] = useState('');
  const [hideFromCalendar, setHideFromCalendar] = useState(false);
  const [saving, setSaving] = useState(false);

  const effectiveType: TaskType = isSubtask ? 'single' : taskType;
  const showRepeat = !isSubtask && (effectiveType === 'routine' || effectiveType === 'habit_group');

  const reset = () => {
    setTitle(''); setDescription(''); setTaskType('single'); setPriority('medium');
    setWeight(3); setRepeatDays([]); setDateOpt('none'); setTime(''); setHideFromCalendar(false);
  };

  const close = () => { reset(); onClose(); };

  const toggleDay = (d: number) =>
    setRepeatDays((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));

  const buildDueDate = (): string | undefined => {
    if (dateOpt === 'none') return undefined;
    const base = new Date();
    if (dateOpt === 'tomorrow') base.setDate(base.getDate() + 1);
    return localISO(base, time);
  };

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await addTask({
        parent_id: parentId,
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'pending',
        priority,
        task_type: effectiveType,
        weight,
        repeat_days: showRepeat && repeatDays.length > 0 ? repeatDays : undefined,
        hide_from_calendar: hideFromCalendar,
        due_date: buildDueDate(),
        is_synced: false,
      });
      reset();
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo crear la tarea. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const weightHint =
    weight <= 2 ? 'Rutina simple' : weight <= 5 ? 'Normal' : weight <= 8 ? 'Importante' : 'Proyecto grande';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.heading}>{isSubtask ? 'Nueva sub-misión' : 'Nueva misión'}</Text>
            <Pressable onPress={close} hitSlop={10}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Título */}
            <TextInput
              style={styles.input}
              placeholder="Título de la tarea..."
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            {/* Descripción */}
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Descripción (opcional)"
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />

            {/* Tipo (solo tareas raíz) */}
            {!isSubtask && (
              <>
                <Text style={styles.label}>Tipo</Text>
                <View style={styles.chipRow}>
                  {TASK_TYPES.map((t) => {
                    const active = taskType === t.key;
                    return (
                      <Pressable
                        key={t.key}
                        onPress={() => setTaskType(t.key)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Ionicons name={t.icon} size={14} color={active ? COLORS.textInverse : COLORS.textMuted} />
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Días de repetición (rutinas y grupos) */}
            {showRepeat && (
              <>
                <Text style={styles.label}>Repetir en</Text>
                <View style={styles.daysRow}>
                  {DAYS.map((d) => {
                    const active = repeatDays.includes(d.k);
                    return (
                      <Pressable
                        key={d.k}
                        onPress={() => toggleDay(d.k)}
                        style={[styles.dayChip, active && styles.dayChipActive]}
                      >
                        <Text style={[styles.dayText, active && styles.dayTextActive]}>{d.l}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* Prioridad */}
            <Text style={styles.label}>Prioridad</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((p) => {
                const active = priority === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setPriority(p.key)}
                    style={[
                      styles.chip,
                      active && { backgroundColor: `${p.color}20`, borderColor: p.color },
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: p.color }]} />
                    <Text style={[styles.chipText, active && { color: p.color }]}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Fecha rápida */}
            <Text style={styles.label}>Fecha límite</Text>
            <View style={styles.chipRow}>
              {DATE_OPTIONS.map((o) => {
                const active = dateOpt === o.key;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => setDateOpt(o.key)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
                  </Pressable>
                );
              })}
              {dateOpt !== 'none' && (
                <TextInput
                  style={styles.timeInput}
                  placeholder="HH:mm"
                  placeholderTextColor={COLORS.textMuted}
                  value={time}
                  onChangeText={setTime}
                  maxLength={5}
                  keyboardType="numbers-and-punctuation"
                />
              )}
            </View>

            {/* Peso (stepper) */}
            <Text style={styles.label}>Peso: {weight} · {weightHint}</Text>
            <View style={styles.weightRow}>
              <Pressable
                onPress={() => setWeight((w) => Math.max(1, w - 1))}
                style={styles.weightBtn}
              >
                <Ionicons name="remove" size={20} color={COLORS.primary} />
              </Pressable>
              <View style={styles.weightTrack}>
                <View style={[styles.weightFill, { width: `${(weight / 10) * 100}%` }]} />
              </View>
              <Pressable
                onPress={() => setWeight((w) => Math.min(10, w + 1))}
                style={styles.weightBtn}
              >
                <Ionicons name="add" size={20} color={COLORS.primary} />
              </Pressable>
            </View>

            {/* Ocultar del calendario */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Ocultar del calendario</Text>
              <Switch
                value={hideFromCalendar}
                onValueChange={setHideFromCalendar}
                trackColor={{ false: COLORS.surfaceHigh, true: COLORS.primaryDim }}
                thumbColor={hideFromCalendar ? COLORS.primary : COLORS.textMuted}
              />
            </View>
          </ScrollView>

          {/* Acciones */}
          <View style={styles.actions}>
            <Pressable onPress={close} style={[styles.actionBtn, styles.ghostBtn]}>
              <Text style={styles.ghostText}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!title.trim() || saving}
              style={[styles.actionBtn, styles.primaryBtn, (!title.trim() || saving) && styles.btnDisabled]}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.textInverse} size="small" />
              ) : (
                <Text style={styles.primaryText}>Crear</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
    maxHeight: '90%',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    ...SHADOWS.elevated,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderLight,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  heading: { fontSize: TYPOGRAPHY.xl, fontWeight: '800', color: COLORS.textPrimary },
  body: { gap: SPACING.md, paddingBottom: SPACING.md },
  label: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
  },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: TYPOGRAPHY.sm, fontWeight: '600', color: COLORS.textMuted },
  chipTextActive: { color: COLORS.textInverse },
  dot: { width: 8, height: 8, borderRadius: 4 },
  daysRow: { flexDirection: 'row', gap: SPACING.xs },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayText: { fontSize: TYPOGRAPHY.sm, fontWeight: '700', color: COLORS.textMuted },
  dayTextActive: { color: COLORS.textInverse },
  timeInput: {
    width: 72,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  weightBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDim,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  weightTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceHigh,
    overflow: 'hidden',
  },
  weightFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  switchLabel: { fontSize: TYPOGRAPHY.md, color: COLORS.textPrimary },
  actions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  ghostText: { color: COLORS.textSecondary, fontWeight: '700' },
  primaryBtn: { backgroundColor: COLORS.primary, ...SHADOWS.glowCyan },
  primaryText: { color: COLORS.textInverse, fontWeight: '800', letterSpacing: 0.5 },
  btnDisabled: { opacity: 0.4 },
});
