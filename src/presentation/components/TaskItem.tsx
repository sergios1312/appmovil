import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Task } from '@/core/entities/Task';

interface TaskItemProps {
  task: Task;
  onPress: (task: Task) => void;
}

export default function TaskItem({ task, onPress }: TaskItemProps) {
  return (
    <Pressable style={styles.container} onPress={() => onPress(task)}>
      <View style={styles.row}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={[styles.badge, task.status === 'completed' && styles.badgeCompleted]}>
          <Text style={styles.status}>{task.status}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.meta}>Vence: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Sin fecha'}</Text>
        <Text style={[styles.priority, styles[task.priority]]}>{task.priority}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#efefef',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  badge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeCompleted: {
    backgroundColor: '#d1fae5',
  },
  status: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  meta: {
    fontSize: 13,
    color: '#9ca3af',
  },
  priority: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  low: { color: '#10b981' },
  medium: { color: '#f59e0b' },
  high: { color: '#ef4444' },
  urgent: { color: '#7c3aed' },
});
