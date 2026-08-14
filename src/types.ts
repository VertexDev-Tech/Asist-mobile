export type Role = 'EMPLOYEE' | 'COMPANY_ADMIN' | 'SUPER_ADMIN';

export interface SystemConfig {
  office_latitude: number;
  office_longitude: number;
  geofence_radius_m: number;
}

export interface User {
  id: number;
  full_name: string;
  role: Role;
  company_id: number;
  company_name?: string | null;
  company_status?: string;
  // Empleado
  dni?: string;
  systemConfig?: SystemConfig;
  // Administrador
  email?: string;
}

export interface EmployeeLoginRequest {
  dni: string;
  pin: string;
  company_id?: number;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface MarkAttendanceRequest {
  type: 'ENTRADA' | 'SALIDA';
  latitude: number;
  longitude: number;
  device_fingerprint: string;
  selfie?: string;
}

export interface DashboardKpis {
  present: number;
  late: number;
  absent: number;
  outsideZone: number;
  totalEmployees: number;
}

export interface WeeklyStat {
  date?: string;
  day?: string | number;
  present?: number;
  onTime?: number;
  late?: number;
  absent?: number;
  punctuality_percent?: number;
}

export interface RankingItem {
  id?: number;
  name?: string;
  full_name?: string;
  position?: number;
  photo?: string | null;
  total?: number;
  punctual?: number;
  punctuality_percent?: number;
  onTimeCount?: number;
  lateCount?: number;
  score?: number;
}

export interface TopLateItem {
  id?: number;
  employee_name?: string;
  full_name?: string;
  late_count?: number;
  lateCount?: number;
  minutesLateTotal?: number;
}

export interface AlertItem {
  id: number;
  type: string;
  detail: string;
  employee_name?: string;
  employee_id?: number | null;
  employee?: { id: number; full_name: string; dni: string } | null;
  reviewed: boolean;
  reviewed_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface EmployeeItem {
  id: number;
  full_name: string;
  dni: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  photo_url?: string | null;
  active: boolean;
  schedule_id?: number | null;
}

export interface DeviceItem {
  id: number;
  employee_id: number;
  fingerprint: string;
  user_agent?: string | null;
  platform?: string | null;
  authorized: boolean;
  authorized_at?: string | null;
  created_at: string;
  employee?: { full_name: string; dni: string } | null;
}

export interface CompanyInfo {
  id: number;
  name: string;
  slug: string;
  email_admin: string;
  logo_url?: string | null;
  brand_color?: string | null;
  plan: string;
  status: string;
  ruc: string;
  sector: string;
  phone: string;
  subscription_status?: {
    is_expired: boolean;
    plan: string;
    days_remaining: number | null;
    current_period_end: string | null;
    limits?: Record<string, unknown>;
  };
}

export interface SubscriptionInfo {
  plan?: string;
  status?: string;
  current_period_end?: string | null;
  [key: string]: unknown;
}
