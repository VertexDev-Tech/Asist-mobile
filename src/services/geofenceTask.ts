import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const GEOFENCE_TASK_NAME = 'UBIX_GEOFENCE_EXIT_TASK';

// Configuración de visualización de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Definición de la tarea en segundo plano
TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }: { data: any; error: any }) => {
  if (error) {
    console.error('[GeofenceTask] Error en tarea de segundo plano:', error);
    return;
  }

  const { eventType } = data;
  if (eventType === Location.GeofencingEventType.Exit) {
    console.log('[GeofenceTask] Dispositivo salió de la zona de trabajo');
    
    // Disparar notificación local urgente al usuario
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ ¿Olvidaste marcar tu salida?',
        body: 'Detectamos que saliste de la zona de trabajo hace unos minutos. Recuerda ingresar a UBIX y registrar tu salida.',
        data: { action: 'MARK_SALIDA' },
        sound: 'default',
      },
      trigger: null, // Envío inmediato
    });
  }
});

/**
 * Solicita permisos de notificaciones y ubicación en segundo plano
 */
export const requestGeofencePermissions = async (): Promise<boolean> => {
  try {
    // 1. Permisos de Notificación
    const { status: notifStatus } = await Notifications.requestPermissionsAsync();
    if (notifStatus !== 'granted') {
      console.warn('[GeofenceTask] Permisos de notificación denegados');
    }

    // 2. Permisos de Ubicación Foreground
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      return false;
    }

    // 3. Permisos de Ubicación Background (Requerido para Android/iOS en 2do plano)
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        console.warn('[GeofenceTask] Permiso de ubicación en segundo plano denegado');
      }
    }

    return true;
  } catch (err) {
    console.error('[GeofenceTask] Error solicitando permisos:', err);
    return false;
  }
};

/**
 * Inicia el monitoreo de la zona al marcar ENTRADA
 */
export const startGeofenceMonitoring = async (
  latitude: number | string,
  longitude: number | string,
  radiusM: number | string = 150
) => {
  try {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const rad = Number(radiusM) || 150;

    if (isNaN(lat) || isNaN(lng)) {
      console.warn('[GeofenceTask] Coordenadas inválidas para Geofencing:', latitude, longitude);
      return;
    }

    const hasPermissions = await requestGeofencePermissions();
    if (!hasPermissions) {
      console.warn('[GeofenceTask] No hay permisos suficientes para Geofencing');
      return;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    }

    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, [
      {
        identifier: 'workplace-geofence',
        latitude: lat,
        longitude: lng,
        radius: rad,
        notifyOnExit: true,
        notifyOnEnter: false,
      },
    ]);

    console.log(`[GeofenceTask] Geofencing activado para (${lat}, ${lng}) radio: ${rad}m`);
  } catch (err) {
    console.error('[GeofenceTask] Error iniciando Geofencing:', err);
  }
};

/**
 * Detiene el monitoreo de la zona al marcar SALIDA
 */
export const stopGeofenceMonitoring = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      console.log('[GeofenceTask] Geofencing desactivado con éxito');
    }
  } catch (err) {
    console.error('[GeofenceTask] Error deteniendo Geofencing:', err);
  }
};
