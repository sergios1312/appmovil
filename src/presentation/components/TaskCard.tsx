import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task } from '../../core/entities/Task';
import { useTaskStore } from '../store/useTaskStore';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  const toggleTaskCompletion = useTaskStore((state) => state.toggleTaskCompletion);

  const isCompleted = task.status === 'completed';

  return (
    <TouchableOpacity 
      style={[styles.card, isCompleted && styles.cardCompleted]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <TouchableOpacity 
        style={[styles.checkbox, isCompleted && styles.checkboxCompleted]} 
        onPress={() => toggleTaskCompletion(task.id)}
      >
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
          {task.title}
        </Text>
        {task.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}
        <View style={styles.metaContainer}>
          <Text style={[styles.priorityBadge, styles[`priority_${task.priority}`]]}>
            {task.priority.toUpperCase()}
          </Text>
          {task.due_date && (
            <Text style={styles.date}>
              {new Date(task.due_date).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0A7EA4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  checkboxCompleted: {
    backgroundColor: '#0A7EA4',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  description: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priorityBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  priority_low: {
    backgroundColor: '#2E3D30',
    color: '#4CAF50',
  },
  priority_medium: {
    backgroundColor: '#403A20',
    color: '#FFC107',
  },
  priority_high: {
    backgroundColor: '#4A2A2A',
    color: '#F44336',
  },
  priority_urgent: {
    backgroundColor: '#5A1A1A',
    color: '#FF0000',
  },
  date: {
    color: '#888',
    fontSize: 12,
  },
});
