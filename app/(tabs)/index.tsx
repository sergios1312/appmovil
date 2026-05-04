import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from 'react-native';

import FloatingActionButton from '@/presentation/components/FloatingActionButton';
import TaskItem from '@/presentation/components/TaskItem';
import { useTaskStore } from '@/presentation/store/taskStore';
import type { Task } from '@/core/entities/Task';

export default function TasksIndexScreen() {
  const router = useRouter();
  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const loadTasks = useTaskStore((state) => state.loadTasks);
  const addTask = useTaskStore((state) => state.addTask);
  
  const rootTasks = tasks.filter((task) => !task.parent_id);

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAddSampleTask = async () => {
    await addTask({
      title: `Nueva Tarea ${rootTasks.length + 1}`,
      status: 'pending',
      priority: 'medium',
      due_date: undefined,
      parent_id: null,
      is_synced: false,
    });
  };

  const handlePressTask = (task: Task) => {
    router.push({ pathname: '/task/[id]', params: { id: task.id } });
  };

  if (isLoading && tasks.length === 0) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={rootTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Lista principal de tareas</Text>
            <Text style={styles.subtitle}>Toca una tarea para abrir sus subtareas.</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay tareas todavía.</Text>
          </View>
        }
        renderItem={({ item }) => <TaskItem task={item} onPress={handlePressTask} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FloatingActionButton onPress={handleAddSampleTask} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    paddingBottom: 96,
  },
  header: {
    gap: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 10,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
