import React from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Sparkles,
  Printer,
  Edit2,
  Trash2,
  CheckCircle,
  PlayCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Booking, BookingStatus, Resource } from '../types';
import { formatDateBR, formatDateFullBR } from '../utils/dateUtils';
import { ResourceBadge } from './ResourceBadge';

interface BookingDetailsModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
  onUpdateStatus: (bookingId: string, newStatus: BookingStatus) => void;
  onPrintVoucher: (booking: Booking) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  isOpen,
  onClose,
  resources,
  onEdit,
  onDelete,
  onUpdateStatus,
  onPrintVoucher,
}) => {
  if (!isOpen || !booking) return null;

  const getStatusDisplay = (status: BookingStatus) => {
    switch (status) {
      case 'em_uso':
        return {
          label: 'Em Uso (Equipamento Retirado)',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
        };
      case 'concluido':
        return {
          label: 'Concluído (Equipamento Devolvido)',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
        };
      default:
        return {
          label: 'Agendado (Aguardando Retirada)',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
        };
    }
  };

  const statusInfo = getStatusDisplay(booking.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg}`}
              >
                {statusInfo.label}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Detalhes do Agendamento
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Main Booking Highlights */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Turma & Professor
              </div>
              <span className="text-xs bg-white text-blue-800 font-extrabold px-2 py-0.5 rounded border border-blue-200">
                Turno {booking.shift.toUpperCase()}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900">
                {booking.classroom}
              </span>
              <span className="text-slate-400 font-medium">•</span>
              <span className="text-base font-bold text-slate-800">
                {booking.teacherName}
              </span>
            </div>
          </div>

          {/* Date & Periods Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Data & Dia da Semana:
              </span>
              <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                {booking.dayOfWeek}, {formatDateBR(booking.date)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Horário / Aulas:
              </span>
              <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                {booking.periods.join(', ')}
              </div>
            </div>
          </div>

          {/* Theme */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Temática / Objetivo Pedagógico:
            </span>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-900 text-sm">
              {booking.theme}
            </div>
          </div>

          {/* Resources */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Recursos & Espaços Reservados:
            </span>
            <div className="flex flex-wrap gap-2">
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

          {/* Observations */}
          {booking.observations && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Observações:
              </span>
              <div className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 text-xs text-amber-900 font-medium">
                {booking.observations}
              </div>
            </div>
          )}

          {/* Status Controls */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Controle de Retirada e Devolução:
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              <button
                onClick={() => onUpdateStatus(booking.id, 'agendado')}
                className={`py-2 px-1 rounded-lg border text-center transition-colors ${
                  booking.status === 'agendado'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                1. Agendado
              </button>
              <button
                onClick={() => onUpdateStatus(booking.id, 'em_uso')}
                className={`py-2 px-1 rounded-lg border text-center transition-colors ${
                  booking.status === 'em_uso'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                2. Em Uso (Retirado)
              </button>
              <button
                onClick={() => onUpdateStatus(booking.id, 'concluido')}
                className={`py-2 px-1 rounded-lg border text-center transition-colors ${
                  booking.status === 'concluido'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                3. Devolvido
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintVoucher(booking)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Comprovante
            </button>
            <button
              onClick={() => onDelete(booking.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(booking)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar Agendamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
