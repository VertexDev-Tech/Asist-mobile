import { additionalShiftsApi, attendanceApi } from './api';
import { AdditionalShiftItem } from '../types';

export interface MonthlyBalanceSummary {
  approvedExtraMinutes: number;
  approvedExtraFormatted: string;
  tardinessMinutes: number;
  tardinessFormatted: string;
  netBalanceMinutes: number;
  netBalanceFormatted: string;
  status: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  approvedShiftsCount: number;
  tardinessCount: number;
  onTimeCount: number;
  monthName: string;
  year: number;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const formatMinutesToDuration = (minutes: number, withSign = false): string => {
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = Math.round(abs % 60);
  const sign = minutes < 0 ? '-' : minutes > 0 && withSign ? '+' : '';
  return `${sign}${h}h ${String(m).padStart(2, '0')}m`;
};

/**
 * Calcula el balance neto del mes actual:
 * (Horas Extra Aprobadas) - (Minutos de Tardanza Acumulados)
 */
export const getMyMonthlyBalance = async (): Promise<MonthlyBalanceSummary> => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Ene, 8 = Sep)

  // Ejecutamos las consultas en paralelo
  const [shiftsRes, statsRes] = await Promise.all([
    additionalShiftsApi.list().catch(() => [] as AdditionalShiftItem[]),
    attendanceApi.getMyStats().catch(() => null),
  ]);

  const shifts: AdditionalShiftItem[] = Array.isArray(shiftsRes) ? shiftsRes : [];

  // Filtrar turnos adicionales aprobados correspondientes al mes y año actual
  let approvedExtraMinutes = 0;
  let approvedShiftsCount = 0;

  for (const shift of shifts) {
    if (shift.status !== 'APPROVED') continue;

    // Obtener fecha del turno
    const shiftDate = new Date(shift.date);
    const sYear = shiftDate.getFullYear();
    const sMonth = shiftDate.getMonth();

    // Validar si pertenece al mes actual (o si no tiene fecha, asumir actual)
    const isCurrentPeriod =
      !isNaN(sYear) && !isNaN(sMonth)
        ? sYear === currentYear && sMonth === currentMonth
        : true;

    if (isCurrentPeriod && shift.start_time && shift.end_time) {
      const [h1, m1] = shift.start_time.split(':').map(Number);
      const [h2, m2] = shift.end_time.split(':').map(Number);
      let diff = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
      if (diff < 0) diff += 24 * 60; // Cruza medianoche

      if (diff > 0) {
        approvedExtraMinutes += diff;
        approvedShiftsCount++;
      }
    }
  }

  // Minutos de tardanza y conteos desde las estadísticas de asistencia del mes
  let tardinessMinutes = 0;
  let tardinessCount = 0;
  let onTimeCount = 0;

  if (statsRes) {
    if (typeof statsRes.tardanza_fmt === 'string') {
      const match = statsRes.tardanza_fmt.match(/(\d+)\s*h\s*(\d+)\s*m/i);
      if (match) {
        tardinessMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      } else {
        tardinessMinutes = Math.round(Number(statsRes.tardanza || 0) * 60);
      }
    } else {
      tardinessMinutes = Math.round(Number(statsRes.tardanza || 0) * 60);
    }
    tardinessCount = Number(statsRes.late || 0);
    onTimeCount = Number(statsRes.onTime || 0);
  }

  // Balance Neto
  const netBalanceMinutes = approvedExtraMinutes - tardinessMinutes;

  let status: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
  if (netBalanceMinutes > 0) {
    status = 'POSITIVE';
  } else if (netBalanceMinutes < 0) {
    status = 'NEGATIVE';
  }

  return {
    approvedExtraMinutes,
    approvedExtraFormatted: formatMinutesToDuration(approvedExtraMinutes),
    tardinessMinutes,
    tardinessFormatted: formatMinutesToDuration(tardinessMinutes),
    netBalanceMinutes,
    netBalanceFormatted: formatMinutesToDuration(netBalanceMinutes, true),
    status,
    approvedShiftsCount,
    tardinessCount,
    onTimeCount,
    monthName: MONTH_NAMES[currentMonth],
    year: currentYear,
  };
};
