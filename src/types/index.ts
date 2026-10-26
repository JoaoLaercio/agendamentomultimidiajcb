export type ResourceCategory = 'equipment' | 'space';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  totalQuantity: number;
  icon: string;
  color: string;
  location?: string;
  rules?: string;
}

export type ShiftType = 'matutino' | 'vespertino' | 'noturno' | 'integral';

export type BookingStatus = 'agendado' | 'em_uso' | 'concluido' | 'cancelado';

export interface Booking {
  id: string;
  teacherName: string;
  classroom: string; // e.g. "9º Ano B"
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // e.g. "Segunda-feira"
  shift: ShiftType;
  periods: string[]; // e.g. ["1ª Aula (07:00 - 07:50)", "2ª Aula (07:50 - 08:40)"]
  startTime?: string; // e.g. "07:00"
  endTime?: string; // e.g. "08:40"
  resourceIds: string[]; // e.g. ["datashow", "cabos", "caixa_som"]
  resourceDetails?: Record<string, { quantity?: number; notes?: string }>;
  theme: string; // Temática da aula / Conteúdo pedagógico
  observations?: string;
  status: BookingStatus;
  createdAt: string;
}

export interface ConflictInfo {
  hasConflict: boolean;
  conflictingBookings: Booking[];
  reason?: string;
  resourceName?: string;
}

export interface PeriodSlot {
  id: string;
  label: string;
  timeRange: string;
  shift: ShiftType;
}
