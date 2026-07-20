import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWeightStore, selectLatestWeight, type WeightLog } from '@/presentation/store/weightStore';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/utils/constants';

/** Limita el peso a 2 dígitos enteros y 1 decimal (ej. "78.5"). */
function sanitizeWeight(raw: string): string {
  let v = raw.replace(/[^\d.]/g, '');
  const dot = v.indexOf('.');
  if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '');
  const [intPart = '', decPart = ''] = v.split('.');
  let out = intPart.slice(0, 2);
  if (v.includes('.')) out += '.' + decPart.slice(0, 1);
  return out;
}

function formatLoggedAt(iso: string): string {
  return new Date(iso).toLocaleString('es', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function GymScreen() {
  const store = useWeightStore();
  const latest = useWeightStore(selectLatestWeight);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { store.loadWeights(); }, []);

  const parsed = parseFloat(weight);
  const canSave = !Number.isNaN(parsed) && parsed > 0;

  const openAdd = () => { setEditingId(null); setWeight(''); setModalOpen(true); };
  const openEdit = (log: WeightLog) => { setEditingId(log.id); setWeight(String(log.weight_kg)); setModalOpen(true); };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      if (editingId) {
        await store.updateWeight(editingId, { weight_kg: parsed });
      } else {
        await store.addWeight({ weight_kg: parsed, logged_at: new Date().toISOString() });
      }
      setModalOpen(false);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el registro. Revisa tu conexión.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar registro', '¿Eliminar este registro de peso?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => store.deleteWeight(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>ENTRENAMIENTO</Text>
        <Text style={styles.title}>Gym</Text>
        <Text style={styles.subtitle}>Registro de peso corporal</Text>
      </View>

      {/* Último registro */}
      <View style={styles.latestCard}>
        <View style={styles.latestIcon}>
          <Ionicons name="trending-up-outline" size={26} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.latestLabel}>Último registro</Text>
          {latest ? (
            <>
              <Text style={styles.latestValue}>
                {latest.weight_kg.toFixed(1)} <Text style={styles.kg}>kg</Text>
              </Text>
              <Text style={styles.latestDate}>{formatLoggedAt(latest.logged_at)}</Text>
            </>
          ) : (
            <Text style={styles.latestMuted}>Sin registros</Text>
          )}
        </View>
      </View>

      {/* Historial */}
      <Text style={styles.sectionTitle}>HISTORIAL DE PESO</Text>
      <FlatList
        data={store.weights}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => openEdit(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemValue}>
                {item.weight_kg.toFixed(1)} <Text style={styles.kgSmall}>kg</Text>
              </Text>
              <Text style={styles.itemDate}>{formatLoggedAt(item.logged_at)}</Text>
            </View>
            <Pressable hitSlop={8} onPress={() => openEdit(item)} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={18} color={COLORS.textSecondary} />
            </Pressable>
            <Pressable hitSlop={8} onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.accent} />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="barbell-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>Aún no registraste tu peso. Pulsa + para empezar.</Text>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={openAdd}>
        <Ionicons name="add" size={28} color={COLORS.textInverse} />
      </Pressable>

      {/* Modal de alta / edición */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>{editingId ? 'Editar registro' : 'Registrar peso'}</Text>
            <Text style={styles.fieldLabel}>Peso (kg)</Text>
            <TextInput
              style={styles.weightInput}
              value={weight}
              onChangeText={(t) => setWeight(sanitizeWeight(t))}
              placeholder="00.0"
              placeholderTextColor={COLORS.textMuted}
              inputMode="decimal"
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.mBtn, styles.ghost]} onPress={() => setModalOpen(false)}>
                <Text style={styles.ghostText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.mBtn, styles.primary, (!canSave || saving) && styles.disabled]}
                disabled={!canSave || saving}
                onPress={handleSave}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.textInverse} size="small" />
                ) : (
                  <Text style={styles.primaryText}>Guardar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  label: { fontSize: TYPOGRAPHY.xs, color: COLORS.primary, fontWeight: '800', letterSpacing: 3 },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, marginTop: 2 },

  latestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  latestIcon: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: `${COLORS.primary}60`,
  },
  latestLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  latestValue: { fontSize: TYPOGRAPHY.xxxl, fontWeight: '800', color: COLORS.textPrimary },
  kg: { fontSize: TYPOGRAPHY.md, color: COLORS.textSecondary, fontWeight: '600' },
  latestDate: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted },
  latestMuted: { fontSize: TYPOGRAPHY.xl, color: COLORS.textMuted, fontWeight: '600' },

  sectionTitle: {
    fontSize: TYPOGRAPHY.xs, fontWeight: '800', color: COLORS.textSecondary,
    letterSpacing: 1.5, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  itemValue: { fontSize: TYPOGRAPHY.lg, fontWeight: '700', color: COLORS.textPrimary },
  kgSmall: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary, fontWeight: '600' },
  itemDate: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, marginTop: 2 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  empty: { alignItems: 'center', paddingTop: SPACING.huge, gap: SPACING.sm },
  emptyText: { fontSize: TYPOGRAPHY.md, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: SPACING.xl },

  fab: {
    position: 'absolute', right: SPACING.lg, bottom: SPACING.xl,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.glowCyan,
  },

  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1, borderColor: COLORS.borderLight,
    padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.md,
    ...SHADOWS.elevated,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.borderLight },
  modalTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: '800', color: COLORS.textPrimary },
  fieldLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  weightInput: {
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: SPACING.md, fontSize: TYPOGRAPHY.xxxl, fontWeight: '800',
    color: COLORS.textPrimary, textAlign: 'center',
  },
  modalActions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  mBtn: { flex: 1, height: 48, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  ghost: { borderWidth: 1, borderColor: COLORS.border },
  ghostText: { color: COLORS.textSecondary, fontWeight: '700' },
  primary: { backgroundColor: COLORS.primary, ...SHADOWS.glowCyan },
  primaryText: { color: COLORS.textInverse, fontWeight: '800', letterSpacing: 0.5 },
  disabled: { opacity: 0.4 },
});
