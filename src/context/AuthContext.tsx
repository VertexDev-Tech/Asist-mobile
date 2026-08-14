import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  setAuthToken,
  setOnUnauthorized,
  authApi,
} from '../services/api';
import {
  secureStorage,
  SavedBiometricCreds,
} from '../services/secureStorage';
import { User, EmployeeLoginRequest, AdminLoginRequest } from '../types';
import * as LocalAuthentication from 'expo-local-authentication';

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  loginEmployee: (credentials: EmployeeLoginRequest) => Promise<void>;
  loginAdmin: (credentials: AdminLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  authenticateWithBiometrics: () => Promise<boolean>;
  enableBiometrics: (creds: SavedBiometricCreds) => Promise<void>;
  disableBiometrics: () => Promise<void>;
  isBiometricAvailable: boolean;
  hasSavedBiometrics: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState<boolean>(false);
  const [hasSavedBiometrics, setHasSavedBiometrics] = useState<boolean>(false);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      // 1. Setup 401 Unauthorized handler
      setOnUnauthorized(() => {
        logout();
      });

      // 2. Check Biometric Hardware
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(compatible && enrolled);

      const savedCreds = await secureStorage.getBiometricCredentials();
      setHasSavedBiometrics(!!savedCreds);

      // 3. Restore Session from SecureStore
      const savedSession = await secureStorage.getSession();
      if (savedSession && savedSession.token) {
        setToken(savedSession.token);
        setUser(savedSession.user);
        setAuthToken(savedSession.token);
      }
    } catch (e) {
      console.error('Init Auth error:', e);
    } finally {
      setIsInitializing(false);
    }
  };

  const loginEmployee = async (credentials: EmployeeLoginRequest) => {
    setIsLoading(true);
    try {
      const res = await authApi.loginEmployee(credentials);
      if (res.access_token && res.user) {
        setToken(res.access_token);
        setUser(res.user);
        setAuthToken(res.access_token);
        await secureStorage.saveSession({ token: res.access_token, user: res.user });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginAdmin = async (credentials: AdminLoginRequest) => {
    setIsLoading(true);
    try {
      const res = await authApi.loginAdmin(credentials);
      if (res.access_token && res.user) {
        setToken(res.access_token);
        setUser(res.user);
        setAuthToken(res.access_token);
        await secureStorage.saveSession({ token: res.access_token, user: res.user });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    await secureStorage.clearSession();
  };

  const enableBiometrics = async (creds: SavedBiometricCreds) => {
    await secureStorage.saveBiometricCredentials(creds);
    setHasSavedBiometrics(true);
  };

  const disableBiometrics = async () => {
    await secureStorage.clearBiometricCredentials();
    setHasSavedBiometrics(false);
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    if (!isBiometricAvailable || !hasSavedBiometrics) return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autentícate para ingresar a Asist.io',
        fallbackLabel: 'Usar Credenciales',
        cancelLabel: 'Cancelar',
      });

      if (!result.success) return false;

      // 1. Fetch saved encrypted biometric credentials
      const savedCreds = await secureStorage.getBiometricCredentials();
      if (!savedCreds) return false;

      // 2. Perform real login with saved credentials
      if (savedCreds.mode === 'employee' && savedCreds.dni && savedCreds.pin) {
        await loginEmployee({ dni: savedCreds.dni, pin: savedCreds.pin });
        return true;
      } else if (savedCreds.mode === 'admin' && savedCreds.email && savedCreds.password) {
        await loginAdmin({ email: savedCreds.email, password: savedCreds.password });
        return true;
      }

      return false;
    } catch (e) {
      console.error('Biometric authentication error:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        isInitializing,
        loginEmployee,
        loginAdmin,
        logout,
        authenticateWithBiometrics,
        enableBiometrics,
        disableBiometrics,
        isBiometricAvailable,
        hasSavedBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
