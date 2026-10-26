import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  GraduationCap,
  BookOpen,
  CheckCircle,
  PlayCircle,
  RotateCcw,
  Plus,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Booking, BookingStatus, Resource } from '../types';
import {
  formatDateBR,
  formatDateFullBR,
  getDayOfWeekName,
  toISODateString,
} from '../utils/dateUtils';
import { ResourceBadge } from './ResourceBadge';

interface DailyAgendaViewProps {
  bookings: Booking[];
  resources: Resource[];
  onSelectBooking: (booking: Booking) => void;
  onUpdateStatus: (bookingId: string, newStatus: BookingStatus) => void;
  onNewBookingWithDate: (dateStr: string) => void;
}

export const DailyAgendaView: React.FC<DailyAgendaViewProps> = ({
  bookings,
  resources,
  onSelectBooking,
  onUpdateStatus,
  onNewBookingWithDate,
}) => {
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    toISODateString(new Date())
  );

  const handlePrevDay = () => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    setSelectedDateStr(toISODateString(date));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    setSelectedDateStr(toISODateString(date));
  };

  const handleToday = () => {
    setSelectedDateStr(toISODateString(new Date()));
  };

  const dayOfWeek = getDayOfWeekName(selectedDateStr);
  const formattedFullDate = formatDateFullBR(selectedDateStr);

  const dayBookings = bookings
    .filter(b => b.date === selectedDateStr)
    .sort((a, b) => {
      const aPeriod = a.periods[0] || '';
      const bPeriod = b.periods[0] || '';
      return aPeriod.localeCompare(bPeriod);
    });

  const matutinoBookings = dayBookings.filter(b => b.shift === 'matutino');
  const vespertinoBookings = dayBookings.filter(b => b.shift === 'vespertino');
  const noturnoBookings = dayBookings.filter(b => b.shift === 'noturno');

  // Resource usage tally for this specific day
  const resourceTally = resources.map(res => {
    let usedCount = 0;
    dayBookings.forEach(b => {
      if (b.status !== 'cancelado' && b.resourceIds.includes(res.id)) {
        usedCount += b.resourceDetails?.[res.id]?.quantity || 1;
      }
    });
    return {
      resource: res,
      usedCount,
      isAvailable: res.category === 'space' ? usedCount === 0 : usedCount < res.totalQuantity,
    };
  });

  const renderBookingCard = (booking: Booking) => {
    return (
      <div
        key={booking.id}
        className={`bg-white rounded-xl border p-4 shadow-xs transition-all hover:shadow-md ${
          booking.status === 'em_uso'
            ? 'border-amber-300 ring-2 ring-amber-200/50'
            : booking.status === 'concluido'
            ? 'border-emerald-200 bg-emerald-50/20'
            : booking.status === 'cancelado'
            ? 'border-slate-200 opacity-60 bg-slate-50'
            : 'border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              {booking.periods.join(' • ')}
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-md">
              <GraduationCap className="w-3.5 h-3.5" />
              Turma: {booking.classroom}
            </span>
            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 ml-1">
              <User className="w-4 h-4 text-slate-400" />
              {booking.teacherName}
            </span>
          </div>

          {/* Status badge & Quick Status Changer */}
          <div className="flex items-center gap-2">
            {booking.status === 'agendado' && (
              <button
                onClick={() => onUpdateStatus(booking.id, 'em_uso')}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg transition-colors border border-amber-300"
                title="Registrar entrega do equipamento ao professor"
              >
                <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
                Registrar Retirada
              </button>
            )}

            {booking.status === 'em_uso' && (
              <button
                onClick={() => onUpdateStatus(booking.id, 'concluido')}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-lg transition-colors border border-emerald-300"
                title="Registrar devolução e encerramento do agendamento"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Registrar Devolução
              </button>
            )}

            {booking.status === 'concluido' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Devolvido / Concluído
              </span>
            )}

            <button
              onClick={() => onSelectBooking(booking)}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            >
              Detalhes / Editar
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 space-y-2">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Temática da Aula:
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {booking.theme}
              </p>
            </div>

            {booking.observations && (
              <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-600 border border-slate-100">
                <span className="font-bold text-slate-500">Observações:</span> {booking.observations}
              </div>
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Recursos e Espaços Solicitados:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {booking.resourceIds.map(rId => {
                const res = resources.find(r => r.id === rId);
                const qty = booking.resourceDetails?.[rId]?.quantity;
                return (
                  <ResourceBadge
                    key={rId}
                    resource={res}
                    resourceId={rId}
                    quantity={qty}
                    size="md"
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation & Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Dia Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Próximo Dia"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Quick Native Datepicker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDateStr}
              onChange={e => e.target.value && setSelectedDateStr(e.target.value)}
              className="pl-3 pr-2 py-1.5 text-xs sm:text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
            />
          </div>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 capitalize">
            {formattedFullDate}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {dayBookings.length} {dayBookings.length === 1 ? 'agendamento registrado' : 'agendamentos registrados'} para esta data
          </p>
        </div>

        <button
          onClick={() => onNewBookingWithDate(selectedDateStr)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Agendar para este Dia</span>
        </button>
      </div>

      {/* Quick Resource Availability for Selected Date */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
          Disponibilidade Geral no Dia ({dayOfWeek}, {formatDateBR(selectedDateStr)}):
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {resourceTally.map(({ resource, usedCount }) => (
            <div
              key={resource.id}
              className={`p-2.5 rounded-lg border text-center ${
                usedCount > 0
                  ? 'bg-blue-50/50 border-blue-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-800 truncate" title={resource.name}>
                {resource.name.split('(')[0]}
              </div>
              <div className="text-xs font-extrabold text-blue-700 mt-0.5">
                {usedCount > 0 ? `${usedCount} em uso` : 'Totalmente livre'}
              </div>
              <div className="text-[10px] text-slate-500">
                {resource.category === 'space' ? '1 espaço' : `${resource.totalQuantity} unid.`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bookings grouped by shift */}
      <div className="space-y-6">
        {dayBookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Nenhum agendamento para {dayOfWeek}, {formatDateBR(selectedDateStr)}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Todos os recursos multimídia (Data Show, TV, Chromebooks, Cabos, Caixa de Som) e espaços (Biblioteca, Pátio e Labin) estão disponíveis.
            </p>
            <button
              onClick={() => onNewBookingWithDate(selectedDateStr)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Fazer Primeiro Agendamento
            </button>
          </div>
        ) : (
          <>
            {/* Matutino */}
            {matutinoBookings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    Turno Matutino ({matutinoBookings.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {matutinoBookings.map(renderBookingCard)}
                </div>
              </div>
            )}

            {/* Vespertino */}
            {vespertinoBookings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    Turno Vespertino ({vespertinoBookings.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {vespertinoBookings.map(renderBookingCard)}
                </div>
              </div>
            )}

            {/* Noturno */}
            {noturnoBookings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    Turno Noturno ({noturnoBookings.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {noturnoBookings.map(renderBookingCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
