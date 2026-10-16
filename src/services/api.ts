import axios from 'axios';
import {
  EmployeeLoginRequest,
  AdminLoginRequest,
  RegisterCompanyRequest,
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
  HourlyCount,
  EmployeeRankingRow,
  MyRanking,
  MyPhotoItem,
  ExceptionItem,
  AdditionalShiftItem,
  OvertimeBankSummary,
  HolidayItem,
  NotificationItem,
  NotificationStatus,
  AttendanceLogItem,
  ManualMarkDto,
  UpdateAttendanceDto,
  GeofenceConfigDto,
  BrandingConfigDto,
  UserScheduleDto,
  CreateScheduleDto,
} from '../types';

// ── URL de Servidor (Local vs Remoto Staging/Producción) ───────────────
export const USE_REMOTE_SERVER = true;

export const API_BASE_URL = USE_REMOTE_SERVER
  ? 'https://ubix.vertexdev.tech/api/v1'
  : 'http://192.168.1.34:3000/api/v1';

// Origen del servidor (sin /api/v1) para resolver rutas relativas como /uploads/...
export const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const assetUrl = (path?: string | null): string | null => {
  if (!path) return null;
  return /^https?:\/\//i.test(path) ? path : `${SERVER_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
};

const buildImageForm = (field: string, uri: string, mimeType?: string | null) => {
  const ext = (uri.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
  const type = mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');
  const form = new FormData();
  form.append(field, { uri, name: `${field}.${ext}`, type } as any);
  return form;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
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

  registerCompany: async (data: RegisterCompanyRequest): Promise<LoginResponse> => {
    // 1. Enviar registro con prueba gratuita (TRIAL)
    await api.post('/auth/register', {
      company_name: data.company_name.trim(),
      ruc: data.ruc.trim(),
      sector: data.sector.trim(),
      phone: data.phone?.trim() || undefined,
      admin_name: data.admin_name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password.trim(),
      latitude: data.latitude ?? -12.046374,
      longitude: data.longitude ?? -77.042793,
      geofence_radius: data.geofence_radius ?? 100,
    });

    // 2. Autenticar inmediatamente para ingresar sin fricciones
    return authApi.loginAdmin({
      email: data.email.trim().toLowerCase(),
      password: data.password.trim(),
    });
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
    return res.data || [];
  },
  getAlerts: async () => {
    const res = await api.get('/attendance/alerts');
    return res.data || [];
  },
  // Admin / RRHH report logs with filters
  getLogs: async (params: {
    from?: string;
    to?: string;
    employeeId?: string | number;
    type?: string;
  }): Promise<AttendanceLogItem[]> => {
    const res = await api.get('/attendance/logs', { params });
    return res.data || [];
  },
  // Marcación manual por Administrador
  manualMark: async (data: ManualMarkDto) => {
    const res = await api.post('/attendance/manual-mark', data);
    return res.data;
  },
  // Editar timestamp / nota de un registro
  update: async (id: number, data: UpdateAttendanceDto) => {
    const res = await api.put(`/attendance/${id}`, data);
    return res.data;
  },
  // Eliminar registro de asistencia
  delete: async (id: number) => {
    const res = await api.delete(`/attendance/${id}`);
    return res.data;
  },
  // Galería de fotos
  getPhotos: async (params: { month?: string; employee_id?: string | number }): Promise<any[]> => {
    const res = await api.get('/attendance/photos', { params });
    const raw = res.data;
    if (raw && Array.isArray(raw.data)) return raw.data;
    if (raw && Array.isArray(raw.photos)) return raw.photos;
    if (Array.isArray(raw)) return raw;
    return [];
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

  getHourlyDistribution: async (): Promise<HourlyCount[]> => {
    const res = await api.get('/dashboard/hourly-distribution');
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
  uploadPhoto: async (id: number, uri: string, mimeType?: string | null) => {
    const res = await api.post(`/employees/${id}/photo`, buildImageForm('photo', uri, mimeType), {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return res.data;
  },
  create: async (data: {
    full_name: string;
    dni: string;
    email?: string;
    phone?: string;
    position?: string;
    schedule_id?: number | null;
    pin?: string;
  }) => {
    const res = await api.post('/employees', data);
    return res.data;
  },
  update: async (
    id: number,
    data: {
      full_name?: string;
      dni?: string;
      email?: string;
      phone?: string;
      position?: string;
      schedule_id?: number | null;
      active?: boolean;
    },
  ) => {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
  },
  updatePin: async (id: number, pin: string) => {
    const res = await api.put(`/employees/${id}/pin`, { pin });
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/employees/${id}`);
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
  getUserSchedule: async (userId: number): Promise<UserScheduleDto> => {
    const res = await api.get(`/schedules/user/${userId}`);
    return res.data;
  },
  upsertUserSchedule: async (userId: number, data: UserScheduleDto) => {
    const res = await api.post(`/schedules/user/${userId}`, data);
    return res.data;
  },
  create: async (data: CreateScheduleDto) => {
    const res = await api.post('/schedules', data);
    return res.data;
  },
  update: async (id: number, data: Partial<CreateScheduleDto>) => {
    const res = await api.put(`/schedules/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/schedules/${id}`);
    return res.data;
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
  updateGeofence: async (data: GeofenceConfigDto) => {
    const res = await api.put('/companies/me/geofence', data);
    return res.data;
  },
  updateBranding: async (data: BrandingConfigDto) => {
    const res = await api.put('/companies/me/branding', data);
    return res.data;
  },
  uploadLogo: async (uri: string, mimeType?: string | null) => {
    const res = await api.post('/companies/me/logo', buildImageForm('logo', uri, mimeType), {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return res.data;
  },
};

export const exceptionsApi = {
  list: async (): Promise<ExceptionItem[]> => {
    const res = await api.get('/exceptions');
    return res.data || [];
  },
  listPending: async (all = false): Promise<ExceptionItem[]> => {
    const res = await api.get('/exceptions/pending', { params: all ? { status: 'all' } : {} });
    return res.data || [];
  },
  create: async (data: {
    date: string;
    date_end?: string;
    type: string;
    hours?: number;
    minutes?: number;
    note?: string;
  }) => {
    const res = await api.post('/exceptions', data);
    return res.data;
  },
  approve: async (id: number) => {
    const res = await api.put(`/exceptions/${id}/approve`);
    return res.data;
  },
  reject: async (id: number, note?: string) => {
    const res = await api.put(`/exceptions/${id}/reject`, { note });
    return res.data;
  },
};

export const additionalShiftsApi = {
  list: async (): Promise<AdditionalShiftItem[]> => {
    const res = await api.get('/additional-shifts');
    return res.data || [];
  },
  listPending: async (all = false): Promise<AdditionalShiftItem[]> => {
    const res = await api.get('/additional-shifts/pending', {
      params: all ? { status: 'all' } : {},
    });
    return res.data || [];
  },
  create: async (data: {
    date: string;
    start_time: string;
    end_time: string;
    type: string;
    note?: string;
  }) => {
    const res = await api.post('/additional-shifts', data);
    return res.data;
  },
  approve: async (id: number) => {
    const res = await api.put(`/additional-shifts/${id}/approve`);
    return res.data;
  },
  reject: async (id: number, note?: string) => {
    const res = await api.put(`/additional-shifts/${id}/reject`, { note });
    return res.data;
  },
};

export const overtimeBankApi = {
  getMine: async (): Promise<OvertimeBankSummary> => {
    const res = await api.get('/overtime-bank/me');
    return res.data;
  },
  getForEmployee: async (employeeId: number): Promise<OvertimeBankSummary> => {
    const res = await api.get(`/overtime-bank/${employeeId}`);
    return res.data;
  },
  setPreviousMonth: async (
    employeeId: number,
    data: { hours: number; minutes: number; note?: string },
  ) => {
    const res = await api.put(`/overtime-bank/${employeeId}/previous`, data);
    return res.data;
  },
};

export const holidaysApi = {
  list: async (): Promise<HolidayItem[]> => {
    const res = await api.get('/holidays');
    return res.data || [];
  },
  create: async (data: { date: string; name: string; is_national?: boolean }) => {
    const res = await api.post('/holidays', data);
    return res.data;
  },
  importNational: async (year: number) => {
    const res = await api.post(`/holidays/import-national/${year}`);
    return res.data;
  },
  remove: async (id: number) => {
    const res = await api.delete(`/holidays/${id}`);
    return res.data;
  },
};

export const rankingApi = {
  getAll: async (): Promise<EmployeeRankingRow[]> => {
    const res = await api.get('/ranking');
    return res.data || [];
  },
  getMine: async (): Promise<MyRanking> => {
    const res = await api.get('/ranking/me');
    return res.data;
  },
};

export const myPhotosApi = {
  list: async (yearMonth: string): Promise<MyPhotoItem[]> => {
    const res = await api.get(`/attendance/my-photos/${yearMonth}`);
    return res.data || [];
  },
};

export const notificationsApi = {
  getMine: async (): Promise<NotificationItem[]> => {
    const res = await api.get('/notifications/me');
    return res.data || [];
  },
  markRead: async (id: number) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
  getStatus: async (): Promise<NotificationStatus> => {
    const res = await api.get('/notifications/status');
    return res.data;
  },
  broadcast: async (title: string, message: string) => {
    const res = await api.post('/notifications/broadcast', { title, message });
    return res.data;
  },
};

export const reclamacionesApi = {
  create: async (data: { tipo: string; detalle: string; contacto?: string }) => {
    const res = await api.post('/v1/reclamaciones', data);
    return res.data;
  },
};

export const superAdminApi = {
  getStats: async (): Promise<any> => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
  getCompanies: async (): Promise<any[]> => {
    const res = await api.get('/admin/companies');
    return res.data || [];
  },
  getCompanyDetail: async (id: number): Promise<any> => {
    const res = await api.get(`/admin/companies/${id}`);
    return res.data;
  },
  updateCompanyStatus: async (id: number, status: string) => {
    const res = await api.put(`/admin/companies/${id}/status`, { status });
    return res.data;
  },
  changePlan: async (id: number, plan: string) => {
    const res = await api.put(`/admin/companies/${id}/plan`, { plan });
    return res.data;
  },
  suspendCompany: async (id: number) => {
    const res = await api.put(`/admin/companies/${id}/suspend`);
    return res.data;
  },
  reactivateCompany: async (id: number) => {
    const res = await api.put(`/admin/companies/${id}/reactivate`);
    return res.data;
  },
  impersonate: async (companyId: number): Promise<{ access_token: string }> => {
    const res = await api.post(`/admin/impersonate/${companyId}`);
    return res.data;
  },
  notifyExpiring: async (id: number) => {
    const res = await api.post(`/admin/companies/${id}/notify-expiring`);
    return res.data;
  },
  notifyExpired: async (id: number) => {
    const res = await api.post(`/admin/companies/${id}/notify-expired`);
    return res.data;
  },
  notifyPayment: async (id: number) => {
    const res = await api.post(`/admin/companies/${id}/notify-payment`);
    return res.data;
  },
};
