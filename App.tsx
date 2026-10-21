import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider } from './src/context/AlertContext';
import { RootNavigator } from './src/navigation/RootNavigator';

// Nota: expo-notifications no se importa aquí porque, desde el SDK 53,
// su sola importación registra un listener de push remoto que lanza una
// excepción fatal en Android dentro de Expo Go (el backend tampoco soporta
// push nativo hoy, solo web-push). Reintroducir solo con un development build.

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AlertProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

