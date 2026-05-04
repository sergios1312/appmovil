import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  /**
   * Solicita permisos para mostrar notificaciones push locales.
   */
  static async requestPermissionsAsync(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Las notificaciones push solo funcionan en dispositivos físicos.');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permiso denegado para notificaciones push.');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  }

  /**
   * Programa una notificación local para una tarea específica.
   */
  static async scheduleTaskNotification(
    taskId: string,
    title: string,
    body: string,
    triggerDate: Date
  ): Promise<string | null> {
    const hasPermission = await this.requestPermissionsAsync();
    if (!hasPermission) return null;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { taskId },
          sound: true,
        },
        trigger: triggerDate,
      });
      return notificationId;
    } catch (error) {
      console.error('Error al programar notificación:', error);
      return null;
    }
  }

  /**
   * Cancela una notificación programada previamente.
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error al cancelar notificación:', error);
    }
  }
}
