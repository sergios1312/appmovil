import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTaskStore } from '@/presentation/store/taskStore';

export default function TaskDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;

  const task = useTaskStore((state) =>
    taskId ? state.tasks.find((item) => item.id === taskId) : undefined
  );
  const getSubtasks = useTaskStore((state) => state.getSubtasks);
  const addTask = useTaskStore((state) => state.addTask);

  if (!taskId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Ruta inválida: falta el id de tarea.</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se encontró la tarea solicitada.</Text>
      </View>
    );
  }

  const subtasks = getSubtasks(taskId);

  const handleAddSubtask = async () => {
    await addTask({
      title: `Subtarea de ${task.title}`,
      status: 'pending',
      priority: 'medium',
      due_date: undefined,
      parent_id: taskId,
      is_synced: false,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={[styles.badge, task.status === 'completed' && styles.badgeCompleted]}>
          <Text style={styles.statusText}>{task.status}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.meta}>ID: {task.id}</Text>
        <Text style={styles.meta}>Prioridad: {task.priority}</Text>
        <Text style={styles.meta}>Vence: {task.due_date ?? 'Sin fecha'}</Text>
      </View>

      <Pressable onPress={handleAddSubtask} style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Agregar subtarea</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Subtareas ({subtasks.length})</Text>

      {subtasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Esta tarea no tiene subtareas.</Text>
        </View>
      ) : (
        subtasks.map((subtask) => (
          <Link
            key={subtask.id}
            href={{ pathname: '/task/[id]', params: { id: subtask.id } }}
            asChild
          >
            <Pressable style={styles.taskCard}>
              <Text style={styles.taskTitle}>{subtask.title}</Text>
              <Text style={styles.subtaskMeta}>Estado: {subtask.status}</Text>
            </Pressable>
          </Link>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    flex: 1,
  },
  badge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeCompleted: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    gap: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
    color: '#111',
  },
  meta: {
    color: '#6b7280',
    fontSize: 14,
  },
  subtaskMeta: {
    color: '#9ca3af',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  taskCard: {
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    gap: 4,
    backgroundColor: '#fff',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
