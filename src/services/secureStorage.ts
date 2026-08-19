import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

const SESSION_KEY = 'asistio_session';
const BIOMETRIC_CREDENTIALS_KEY = 'asistio_biometric_credentials';

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
};
