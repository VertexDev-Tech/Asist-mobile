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

export interface RegisterCompanyRequest {
  company_name: string;
  ruc: string;
  sector: string;
  phone?: string;
  admin_name: string;
  email: string;
  password: string;
  latitude?: number;
  longitude?: number;
  geofence_radius?: number;
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
  justification?: string;
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

export interface EmployeeRankingRow {
  position: number;
  employeeId: number;
  name: string;
  positionName?: string | null;
  score: number;
  onTime: number;
  late: number;
  missed: number;
}

export interface MyRanking {
  position: number | null;
  totalEmployees: number;
  score: number;
  onTime: number;
  late: number;
  missed: number;
}

export interface MyPhotoItem {
  id: number;
  type: 'ENTRADA' | 'SALIDA' | string;
  timestamp: string;
  selfie_url: string;
  within_zone?: boolean | null;
  is_late?: boolean | null;
}

export interface HourlyCount {
  hour: string;
  count: number;
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
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius_m?: number | null;
  primary_color?: string | null;
  secondary_color?: string | null;
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
  plan_name?: string;
  max_employees?: number;
  used_employees?: number;
  trial?: boolean;
  expires_at?: string | null;
  [key: string]: unknown;
}

// ─── ASISTENCIA & AUDITORÍA DE REPORTES ─────────────────────────────
export interface AttendanceLogItem {
  id: number;
  company_id: number;
  employee_id: number;
  type: 'ENTRADA' | 'SALIDA';
  timestamp: string;
  latitude?: number | null;
  longitude?: number | null;
  selfie_url?: string | null;
  is_late: boolean;
  is_manual?: boolean;
  manual_by?: number | null;
  justification?: string | null;
  device_fingerprint?: string | null;
  ip_address?: string | null;
  employee?: {
    id: number;
    full_name: string;
    dni: string;
    position?: string | null;
    photo_url?: string | null;
  } | null;
}

export interface ManualMarkDto {
  employee_id: number;
  type: 'ENTRADA' | 'SALIDA';
  timestamp: string;
  justification?: string;
}

export interface UpdateAttendanceDto {
  timestamp: string;
  note?: string;
}

export interface GeofenceConfigDto {
  latitude: number;
  longitude: number;
  radius_m: number;
}

export interface BrandingConfigDto {
  primary_color?: string;
  secondary_color?: string;
}

export interface ShiftSegment {
  start_time: string;
  end_time: string;
}

export interface UserScheduleDay {
  day_of_week: string;
  is_workday: boolean;
  shift_type: 'PRESENTIAL' | 'REMOTE' | 'GUARD' | 'FLEXIBLE';
  segments: ShiftSegment[];
  tolerance_min?: number;
}

export interface UserScheduleDto {
  tolerance_min?: number;
  days: UserScheduleDay[];
}

export interface CreateScheduleDto {
  name: string;
  tolerance_min?: number;
  shifts: Array<{
    day_of_week: string;
    start_time: string;
    end_time: string;
    type?: string;
  }>;
}

export interface PhotoGalleryItem {
  id?: number | string;
  timestamp?: string;
  created_at?: string;
  date?: string;
  type?: 'ENTRADA' | 'SALIDA' | string;
  selfie_url?: string;
  url?: string;
  employee_name?: string;
  employee?: { full_name?: string; position?: string };
  dni?: string;
  position?: string;
  distance_m?: number | null;
  within_zone?: boolean | null;
  justification?: string | null;
}

// ─── SOLICITUDES: EXCEPCIONES, TURNOS ADICIONALES, BANCO DE HORAS, FERIADOS ───

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ExceptionType =
  | 'VACATION'
  | 'PERMISSION_PAID'
  | 'PERMISSION_UNPAID'
  | 'COMPENSATED_HE'
  | 'FERIADO';

export interface ExceptionItem {
  id: number;
  employee_id: number;
  date: string;
  date_end?: string | null;
  schedule_id?: number | null;
  type: ExceptionType;
  hours?: number | null;
  minutes?: number | null;
  note?: string | null;
  status: RequestStatus;
  created_at: string;
  approved_at?: string | null;
  employee?: { full_name: string; dni: string } | null;
}

export type AdditionalShiftType = 'EXTRA_HOURS' | 'WEEKEND_WORK' | 'SPECIAL_MEETING' | 'OTHER';

export interface AdditionalShiftItem {
  id: number;
  employee_id: number;
  date: string;
  start_time: string;
  end_time: string;
  type: AdditionalShiftType;
  note?: string | null;
  status: RequestStatus;
  created_at: string;
  approved_at?: string | null;
  employee?: { full_name: string; dni: string } | null;
}

export interface OvertimeBankPeriod {
  year: number;
  month: number;
  minutes: number;
  formatted: string;
}

export interface OvertimeBankSummary {
  employeeId: number;
  prevMonth: OvertimeBankPeriod;
  currentMonth: OvertimeBankPeriod;
  compensated: { minutes: number; formatted: string };
  total: { minutes: number; formatted: string };
  canCompensate: boolean;
}

export interface HolidayItem {
  id: number;
  date: string;
  name: string;
  is_national: boolean;
}

export interface NotificationItem {
  id: number;
  employeeId: number;
  type: string;
  message: string;
  isRead: boolean;
  sentAt: string;
}

export interface NotificationStatus {
  total: number;
  withToken: number;
  withoutToken: number;
}

// ─── SUPER ADMIN TYPES ───────────────────────────────────────
export interface SuperAdminStats {
  total: number;
  byStatus: Array<{ status: string; _count: number }>;
  expiringSoon: Array<{
    id: number;
    company_id: number;
    plan: string;
    current_period_end: string;
    company: CompanyInfo;
  }>;
}

export interface SuperAdminCompanyItem {
  id: number;
  name: string;
  slug: string;
  email_admin: string;
  plan: string;
  status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED';
  ruc?: string;
  sector?: string;
  phone?: string;
  created_at: string;
  subscriptions?: Array<{
    id: number;
    plan: string;
    status: string;
    started_at: string;
    current_period_end: string;
  }>;
  _count?: {
    employees?: number;
    users?: number;
    attendance?: number;
  };
}
