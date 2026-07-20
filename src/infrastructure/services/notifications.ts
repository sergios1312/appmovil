import { Platform } from 'react-native';
// import * as Notifications from 'expo-notifications';
import type { Task } from '@/core/entities/Task';

const TASK_CHANNEL_ID = 'task-reminders';

// Deshabilitamos expo-notifications temporalmente para que la app no crashee en Expo Go.
// Expo SDK 53 eliminó el soporte de notificaciones push en Expo Go.

export async function initializeNotifications(): Promise<boolean> {
  console.log('[Notifications] Notificaciones deshabilitadas para compatibilidad con Expo Go');
  return false;
}

export async function scheduleTaskDueNotification(task: Task): Promise<string | null> {
  console.log(`[Notifications] Simulación: Notificación programada para tarea ${task.id}`);
  return null;
}

export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  console.log(`[Notifications] Simulación: Notificación cancelada ${notificationId}`);
}
