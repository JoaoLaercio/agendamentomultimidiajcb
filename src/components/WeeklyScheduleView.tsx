import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  GraduationCap,
  BookOpenCheck,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Booking, Resource, ShiftType } from '../types';
import { getWeekDays, formatDateBR, formatDateFullBR } from '../utils/dateUtils';
import { ResourceBadge } from './ResourceBadge';

interface WeeklyScheduleViewProps {
  bookings: Booking[];
  resources: Resource[];
  onSelectBooking: (booking: Booking) => void;
  onNewBookingWithDate: (dateStr: string) => void;
}

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  bookings,
  resources,
  onSelectBooking,
  onNewBookingWithDate,
}) => {
  const [currentWeekBaseDate, setCurrentWeekBaseDate] = useState<Date>(new Date());
  const [selectedResourceId, setSelectedResourceId] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const weekDays = getWeekDays(currentWeekBaseDate, true);
  const firstDayStr = weekDays[0]?.dateStr;
  const lastDayStr = weekDays[weekDays.length - 1]?.dateStr;

  const handlePrevWeek = () => {
    const nextDate = new Date(currentWeekBaseDate);
    nextDate.setDate(currentWeekBaseDate.getDate() - 7);
    setCurrentWeekBaseDate(nextDate);
  };

  const handleNextWeek = () => {
    const nextDate = new Date(currentWeekBaseDate);
    nextDate.setDate(currentWeekBaseDate.getDate() + 7);
    setCurrentWeekBaseDate(nextDate);
  };

  const handleCurrentWeek = () => {
    setCurrentWeekBaseDate(new Date());
  };

  // Filter bookings based on filters
  const filteredBookings = bookings.filter(b => {
    // Resource filter
    if (selectedResourceId !== 'all' && !b.resourceIds.includes(selectedResourceId)) {
      return false;
    }

    // Shift filter
    if (selectedShift !== 'all' && b.shift !== selectedShift) {
      return false;
    }

    // Search term (teacher name, class, theme)
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchTeacher = b.teacherName.toLowerCase().includes(q);
      const matchClass = b.classroom.toLowerCase().includes(q);
      const matchTheme = b.theme.toLowerCase().includes(q);
      const matchObs = b.observations?.toLowerCase().includes(q) || false;
      if (!matchTeacher && !matchClass && !matchTheme && !matchObs) {
        return false;
      }
    }

    return true;
  });

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'em_uso':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            Em Uso
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Concluído
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full line-through">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
            Agendado
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Week Navigator & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Week navigation buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Semana Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleCurrentWeek}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Semana Atual
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Próxima Semana"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="ml-2">
              <span className="text-xs font-medium text-slate-500 block">
                Período exibido:
              </span>
              <span className="text-sm font-bold text-slate-800">
                {firstDayStr ? formatDateBR(firstDayStr) : ''} até {lastDayStr ? formatDateBR(lastDayStr) : ''}
              </span>
            </div>
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px] sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar professor, turma ou temática..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Filters Pill Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar Recurso:
          </span>
          <button
            onClick={() => setSelectedResourceId('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedResourceId === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos os Recursos
          </button>
          {resources.map(res => (
            <button
              key={res.id}
              onClick={() => setSelectedResourceId(res.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedResourceId === res.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {res.name}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Turno:</span>
            <select
              value={selectedShift}
              onChange={e => setSelectedShift(e.target.value)}
              className="bg-slate-100 text-slate-700 font-medium py-1 px-2 rounded-md border-0 text-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Todos os Turnos</option>
              <option value="matutino">Matutino</option>
              <option value="vespertino">Vespertino</option>
              <option value="noturno">Noturno</option>
            </select>
          </div>
        </div>
      </div>

      {/* 6-Day Weekly Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {weekDays.map(day => {
          const dayBookings = filteredBookings
            .filter(b => b.date === day.dateStr && b.status !== 'cancelado')
            .sort((a, b) => {
              const aPeriod = a.periods[0] || '';
              const bPeriod = b.periods[0] || '';
              return aPeriod.localeCompare(bPeriod);
            });

          return (
            <div
              key={day.dateStr}
              className={`flex flex-col rounded-xl border transition-all ${
                day.isToday
                  ? 'bg-white border-blue-400 ring-2 ring-blue-400/30 shadow-md'
                  : 'bg-white/90 border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3 border-b rounded-t-xl flex items-center justify-between ${
                  day.isToday
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : 'bg-slate-50/80 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold tracking-tight uppercase">
                      {day.dayName.replace('-feira', '')}
                    </span>
                    {day.isToday && (
                      <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">
                        Hoje
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-sm font-extrabold ${
                      day.isToday ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {formatDateBR(day.dateStr).slice(0, 5)}
                  </div>
                </div>

                <button
                  onClick={() => onNewBookingWithDate(day.dateStr)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    day.isToday
                      ? 'bg-white/20 hover:bg-white/30 text-white'
                      : 'bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 shadow-2xs'
                  }`}
                  title={`Novo agendamento para ${day.dayName} (${formatDateBR(day.dateStr)})`}
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Day Bookings List */}
              <div className="p-2 space-y-2.5 flex-1 min-h-[320px] bg-slate-50/30">
                {dayBookings.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-slate-300 mb-1.5" />
                    <span className="text-xs text-slate-400 font-medium">
                      Livre
                    </span>
                    <button
                      onClick={() => onNewBookingWithDate(day.dateStr)}
                      className="mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      + Agendar
                    </button>
                  </div>
                ) : (
                  dayBookings.map(booking => (
                    <div
                      key={booking.id}
                      onClick={() => onSelectBooking(booking)}
                      className="p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group text-left relative overflow-hidden"
                    >
                      {/* Left accent bar matching status */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          booking.status === 'em_uso'
                            ? 'bg-amber-500'
                            : booking.status === 'concluido'
                            ? 'bg-emerald-500'
                            : 'bg-blue-600'
                        }`}
                      />

                      {/* Header with Period & Status */}
                      <div className="flex items-start justify-between gap-1 mb-1.5 pl-1">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                          <Clock className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <span className="truncate">
                            {booking.periods[0]
                              ? booking.periods[0].split('(')[0].trim()
                              : 'Horário definido'}
                            {booking.periods.length > 1 && ` (+${booking.periods.length - 1})`}
                          </span>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>

                      {/* Turma & Teacher */}
                      <div className="pl-1 mb-2">
                        <div className="inline-block bg-slate-100 text-slate-800 text-[11px] font-extrabold px-1.5 py-0.5 rounded border border-slate-200 mb-1">
                          {booking.classroom}
                        </div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                          <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{booking.teacherName}</span>
                        </div>
                      </div>

                      {/* Theme / Subject */}
                      <div className="pl-1 text-xs text-slate-600 font-medium line-clamp-2 mb-2.5 bg-slate-50 p-1.5 rounded border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Tema:
                        </span>
                        {booking.theme}
                      </div>

                      {/* Resources Badges */}
                      <div className="pl-1 flex flex-wrap gap-1">
                        {booking.resourceIds.map(rId => {
                          const resObj = resources.find(r => r.id === rId);
                          const qty = booking.resourceDetails?.[rId]?.quantity;
                          return (
                            <ResourceBadge
                              key={rId}
                              resource={resObj}
                              resourceId={rId}
                              quantity={qty}
                              size="sm"
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
