import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

const SESSION_KEY = 'asistio_session';
const BIOMETRIC_CREDENTIALS_KEY = 'asistio_biometric_credentials';
const DEVICE_ID_KEY = 'asistio_device_id';

export interface SavedBiometricCreds {
  mode: 'employee' | 'admin';
  dni?: string;
  pin?: string;
  email?: string;
  password?: string;
}

export interface StoredSession {
  token: string;
  user: User;
}

export const secureStorage = {
  saveSession: async (session: StoredSession): Promise<void> => {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  },

  getSession: async (): Promise<StoredSession | null> => {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredSession;
    } catch {
      return null;
    }
  },

  clearSession: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },

  saveBiometricCredentials: async (creds: SavedBiometricCreds): Promise<void> => {
    await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify(creds));
  },

  getBiometricCredentials: async (): Promise<SavedBiometricCreds | null> => {
    const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SavedBiometricCreds;
    } catch {
      return null;
    }
  },

  clearBiometricCredentials: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
  },

  // UUID fijo por instalación física, usado como device_fingerprint para el
  // flujo anti-fraude "un dispositivo por empleado" (independiente del usuario logueado).
  getOrCreateDeviceId: async (): Promise<string> => {
    let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!id) {
      id = 'MOBILE-' + Array.from({ length: 32 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    }
    return id;
  },
};
