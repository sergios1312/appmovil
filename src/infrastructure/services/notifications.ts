import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import type { Task } from '@/core/entities/Task';

const TASK_CHANNEL_ID = 'task-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function initializeNotifications(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(TASK_CHANNEL_ID, {
      name: 'Task reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }

  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleTaskDueNotification(task: Task): Promise<string | null> {
  if (!task.due_date) {
    return null;
  }

  const triggerDate = new Date(task.due_date);
  if (Number.isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const hasPermission = await initializeNotifications();
  if (!hasPermission) {
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de tarea',
      body: task.title,
      data: { taskId: task.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: Platform.OS === 'android' ? TASK_CHANNEL_ID : undefined,
    },
  });
}

export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
