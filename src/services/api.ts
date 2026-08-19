import axios from 'axios';
import {
  EmployeeLoginRequest,
  AdminLoginRequest,
  LoginResponse,
  MarkAttendanceRequest,
  DashboardKpis,
  WeeklyStat,
  RankingItem,
  TopLateItem,
  AlertItem,
  EmployeeItem,
  CompanyInfo,
  SubscriptionInfo,
} from '../types';

// ── URL de Servidor (Local vs Remoto Staging/Producción) ───────────────
export const USE_REMOTE_SERVER = true; // Cambiar a true para conectar a https://ubix.vertexdev.tech

export const API_BASE_URL = USE_REMOTE_SERVER
  ? 'https://ubix.vertexdev.tech/api/v1'
  : 'http://192.168.1.34:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (cb: (() => void) | null) => {
  onUnauthorizedCallback = cb;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const authApi = {
  loginEmployee: async (data: EmployeeLoginRequest): Promise<LoginResponse> => {
    const res = await api.post('/auth/employee-login', data);
    const emp = res.data.employee;
    return {
      access_token: res.data.access_token,
      user: {
        id: emp.id,
        dni: emp.dni,
        full_name: emp.full_name,
        role: 'EMPLOYEE',
        company_id: emp.company_id,
        systemConfig: emp.systemConfig,
      },
    };
  },

  loginAdmin: async (data: AdminLoginRequest): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', data);
    const u = res.data.user;
    return {
      access_token: res.data.access_token,
      user: {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        company_id: u.company_id,
        company_name: u.company_name,
      },
    };
  },
};

export const attendanceApi = {
  mark: async (data: MarkAttendanceRequest) => {
    const res = await api.post('/attendance/mark', data);
    return res.data;
  },
  getMyToday: async () => {
    const res = await api.get('/attendance/today/me');
    return res.data;
  },
  getMyStats: async () => {
    const res = await api.get('/attendance/my-hours-stats');
    return res.data;
  },
  getHistory: async (month?: string, page = 1) => {
    const res = await api.get('/attendance/history/me', {
      params: { month, page, limit: 30 },
    });
    return res.data;
  },
  getTodayLogs: async () => {
    const res = await api.get('/attendance/today');
    return res.data;
  },
  getAlerts: async () => {
    const res = await api.get('/attendance/alerts');
    return res.data;
  },
};

export const dashboardApi = {
  getToday: async (): Promise<DashboardKpis> => {
    const res = await api.get('/dashboard/today');
    const data = res.data || {};
    return {
      present: data.presentes || data.present || 0,
      late: data.tardanzas || data.late || 0,
      absent: data.ausentes || data.absent || 0,
      outsideZone: data.fueraDeZona || data.outsideZone || 0,
      totalEmployees: data.totalEmpleados || data.totalEmployees || 0,
    };
  },

  getWeeklyStats: async (): Promise<WeeklyStat[]> => {
    const res = await api.get('/dashboard/weekly-stats');
    return res.data || [];
  },

  getRanking: async (): Promise<RankingItem[]> => {
    const res = await api.get('/dashboard/ranking');
    return res.data || [];
  },

  getTopLate: async (): Promise<TopLateItem[]> => {
    const res = await api.get('/dashboard/top-late');
    return res.data || [];
  },

  getMonthlyPunctuality: async (): Promise<WeeklyStat[]> => {
    const res = await api.get('/dashboard/monthly-punctuality');
    return res.data || [];
  },

  getAlerts: async (): Promise<AlertItem[]> => {
    const res = await api.get('/dashboard/alerts');
    return res.data || [];
  },
};

export const employeesApi = {
  list: async (): Promise<EmployeeItem[]> => {
    const res = await api.get('/employees');
    return res.data || [];
  },
  create: async (data: { full_name: string; dni: string; pin: string; position?: string; schedule_id?: number }) => {
    const res = await api.post('/employees', data);
    return res.data;
  },
  resetPin: async (employeeId: number, newPin: string) => {
    const res = await api.post(`/employees/${employeeId}/reset-pin`, { pin: newPin });
    return res.data;
  },
};

export const schedulesApi = {
  list: async () => {
    const res = await api.get('/schedules');
    return res.data || [];
  },
};

export const devicesApi = {
  getPending: async () => {
    const res = await api.get('/attendance/devices/pending');
    return res.data || [];
  },
  getAuthorized: async () => {
    const res = await api.get('/attendance/devices/authorized');
    return res.data || [];
  },
  authorize: async (deviceId: number) => {
    const res = await api.post(`/attendance/devices/${deviceId}/authorize`);
    return res.data;
  },
  revoke: async (deviceId: number) => {
    const res = await api.delete(`/attendance/devices/${deviceId}/revoke`);
    return res.data;
  },
};

export const alertsApi = {
  review: async (alertId: number, notes?: string) => {
    const res = await api.patch(`/attendance/alerts/${alertId}/review`, { notes });
    return res.data;
  },
};

export const companiesApi = {
  getMe: async (): Promise<CompanyInfo> => {
    const res = await api.get('/companies/me');
    return res.data;
  },
  getSubscription: async (): Promise<SubscriptionInfo> => {
    const res = await api.get('/companies/me/subscription');
    return res.data;
  },
};

export const reclamacionesApi = {
  create: async (data: { tipo: string; detalle: string; contacto?: string }) => {
    const res = await api.post('/v1/reclamaciones', data);
    return res.data;
  },
};
