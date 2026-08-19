import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ReclamacionesScreen } from '../screens/ReclamacionesScreen';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AdminEmployeesScreen } from '../screens/admin/AdminEmployeesScreen';
import { AdminReportsScreen } from '../screens/admin/AdminReportsScreen';
import { AdminProfileScreen } from '../screens/admin/AdminProfileScreen';
import { AdminSchedulesScreen } from '../screens/admin/AdminSchedulesScreen';
import { AdminDevicesScreen } from '../screens/admin/AdminDevicesScreen';
import { AdminAlertsScreen } from '../screens/admin/AdminAlertsScreen';
import { AdminCompanyScreen } from '../screens/admin/AdminCompanyScreen';
import {
  Clock,
  Calendar,
  User as UserIcon,
  LayoutDashboard,
  Users,
  BarChart2,
  ShieldCheck,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const EmployeeTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.glassBorder,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.cyan,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Marcado"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Marcado',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Historial"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Historial',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AdminTabs = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.glassBorder,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.cyan,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="AdminInicio"
        component={AdminHomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminEmpleados"
        component={AdminEmployeesScreen}
        options={{
          tabBarLabel: 'Empleados',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminReports"
        component={AdminReportsScreen}
        options={{
          tabBarLabel: 'Reportes',
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AdminPerfil"
        component={AdminProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { token, user, isInitializing } = useAuth();
  const { theme, isDark } = useTheme();

  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.cyan} />
      </View>
    );
  }

  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'SUPER_ADMIN';

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.glassBorder,
          primary: theme.colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.glassBorder,
          primary: theme.colors.primary,
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : isAdmin ? (
          <>
            <Stack.Screen name="AdminApp" component={AdminTabs} />
            <Stack.Screen name="AdminSchedules" component={AdminSchedulesScreen} />
            <Stack.Screen name="AdminDevices" component={AdminDevicesScreen} />
            <Stack.Screen name="AdminAlerts" component={AdminAlertsScreen} />
            <Stack.Screen name="AdminCompany" component={AdminCompanyScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="EmployeeApp" component={EmployeeTabs} />
            <Stack.Screen name="Reclamaciones" component={ReclamacionesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
