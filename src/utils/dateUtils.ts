import { Booking, ConflictInfo, Resource } from '../types';

export const DAYS_OF_WEEK_PT = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const DAYS_OF_WEEK_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Returns the day of the week in Portuguese for a date string (YYYY-MM-DD)
 */
export function getDayOfWeekName(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return DAYS_OF_WEEK_PT[date.getDay()];
}

/**
 * Formats YYYY-MM-DD into DD/MM/YYYY
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Formats a Date object to YYYY-MM-DD string with local timezone preservation
 */
export function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats date into readable Brazilian long format
 * e.g. "Segunda-feira, 22 de Outubro de 2026"
 */
export function formatDateFullBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = DAYS_OF_WEEK_PT[date.getDay()];
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${dayName}, ${day} de ${months[month - 1]} de ${year}`;
}

/**
 * Gets array of dates for Monday through Friday (or Saturday if includeSaturday is true)
 * for the week containing the given baseDate.
 */
export function getWeekDays(baseDate: Date, includeSaturday = true): { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] {
  const current = new Date(baseDate);
  const day = current.getDay();
  // Calculate distance to previous Monday (assuming Monday is start of school week)
  // Sunday is 0, Monday is 1, ..., Saturday is 6
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);

  const daysCount = includeSaturday ? 6 : 5;
  const todayStr = toISODateString(new Date());

  const result = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toISODateString(d);
    result.push({
      dateStr,
      dayName: DAYS_OF_WEEK_PT[d.getDay()],
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }
  return result;
}

/**
 * Checks if two period selections overlap
 */
export function doPeriodsOverlap(periodsA: string[], periodsB: string[]): boolean {
  if (!periodsA || !periodsB || periodsA.length === 0 || periodsB.length === 0) {
    return true; // assume conflict if unspecified
  }
  return periodsA.some(pA => periodsB.includes(pA));
}

/**
 * Checks for booking conflicts.
 * Takes new/edited booking details, existing active bookings, and resources list.
 * Evaluates quantity limits for equipment and uniqueness for single spaces (Labin, Biblioteca, Pátio).
 */
export function checkBookingConflicts(
  target: {
    id?: string;
    date: string;
    periods: string[];
    resourceIds: string[];
    resourceDetails?: Record<string, { quantity?: number }>;
  },
  existingBookings: Booking[],
  resources: Resource[]
): ConflictInfo {
  if (!target.date || !target.resourceIds || target.resourceIds.length === 0 || !target.periods || target.periods.length === 0) {
    return { hasConflict: false, conflictingBookings: [] };
  }

  // Filter existing active bookings on the same date, excluding itself if editing
  const sameDayBookings = existingBookings.filter(
    b => b.date === target.date &&
         b.status !== 'cancelado' &&
         b.id !== target.id
  );

  for (const resourceId of target.resourceIds) {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) continue;

    const requestedQty = target.resourceDetails?.[resourceId]?.quantity || 1;

    // Check each target period
    for (const period of target.periods) {
      // Find all bookings using this resource in this period
      const overlapping = sameDayBookings.filter(
        b => b.resourceIds.includes(resourceId) && b.periods.includes(period)
      );

      if (resource.category === 'space') {
        // Space is strictly exclusive: only 1 booking allowed at a time
        if (overlapping.length > 0) {
          const first = overlapping[0];
          return {
            hasConflict: true,
            conflictingBookings: overlapping,
            resourceName: resource.name,
            reason: `O espaço "${resource.name}" já está reservado no horário "${period}" pelo Prof. ${first.teacherName} (Turma: ${first.classroom}).`,
          };
        }
      } else {
        // Equipment: calculate total currently booked quantity in this period
        let bookedQty = 0;
        for (const b of overlapping) {
          const bQty = b.resourceDetails?.[resourceId]?.quantity || 1;
          bookedQty += bQty;
        }

        if (bookedQty + requestedQty > resource.totalQuantity) {
          const available = Math.max(0, resource.totalQuantity - bookedQty);
          return {
            hasConflict: true,
            conflictingBookings: overlapping,
            resourceName: resource.name,
            reason: `Quantidade insuficiente de "${resource.name}". Solicitado: ${requestedQty}, Disponível neste horário: ${available} de ${resource.totalQuantity} total.`,
          };
        }
      }
    }
  }

  return { hasConflict: false, conflictingBookings: [] };
}
