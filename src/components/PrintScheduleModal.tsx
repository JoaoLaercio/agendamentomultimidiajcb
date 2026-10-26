import React, { useState } from 'react';
import {
  X,
  Printer,
  Calendar,
  GraduationCap,
  Download,
  Filter,
} from 'lucide-react';
import { Booking, Resource } from '../types';
import { formatDateBR, formatDateFullBR, getDayOfWeekName, toISODateString } from '../utils/dateUtils';

interface PrintScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  resources: Resource[];
  selectedBookingForVoucher?: Booking | null;
}

export const PrintScheduleModal: React.FC<PrintScheduleModalProps> = ({
  isOpen,
  onClose,
  bookings,
  resources,
  selectedBookingForVoucher,
}) => {
  const [printDate, setPrintDate] = useState<string>(
    selectedBookingForVoucher?.date || toISODateString(new Date())
  );
  const [mode, setMode] = useState<'sheet' | 'voucher'>(
    selectedBookingForVoucher ? 'voucher' : 'sheet'
  );

  if (!isOpen) return null;

  const dayOfWeek = getDayOfWeekName(printDate);
  const formattedFull = formatDateFullBR(printDate);

  const dayBookings = bookings
    .filter(b => b.date === printDate && b.status !== 'cancelado')
    .sort((a, b) => {
      const aP = a.periods[0] || '';
      const bP = b.periods[0] || '';
      return aP.localeCompare(bP);
    });

  const getResourceNames = (resourceIds: string[], details?: Booking['resourceDetails']) => {
    return resourceIds
      .map(id => {
        const res = resources.find(r => r.id === id);
        const qty = details?.[id]?.quantity;
        return res ? `${res.name}${qty && qty > 1 ? ` (${qty}x)` : ''}` : id;
      })
      .join(', ');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden print-shadow-none">
        {/* Controls Bar (Hidden during actual print) */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-extrabold">Visualização de Impressão</h3>
              <p className="text-xs text-slate-400">
                Folha de pauta diária ou comprovante individual de retirada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setMode('sheet')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  mode === 'sheet' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                Pauta Diária Completa
              </button>
              {selectedBookingForVoucher && (
                <button
                  onClick={() => setMode('voucher')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    mode === 'voucher' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Comprovante Individual
                </button>
              )}
            </div>

            {mode === 'sheet' && (
              <input
                type="date"
                value={printDate}
                onChange={e => e.target.value && setPrintDate(e.target.value)}
                className="bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 font-semibold focus:outline-none"
              />
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Imprimir Agora
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-6 sm:p-8 bg-white text-slate-900 max-h-[80vh] overflow-y-auto">
          {mode === 'sheet' ? (
            <div className="space-y-6">
              {/* Official School Header */}
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-600">
                  SECRETARIA DE EDUCAÇÃO • REDE DE ENSINO
                </div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                  Controle Diário de Agendamento de Multimídia e Espaços
                </h1>
                <div className="text-sm font-bold text-slate-800 mt-1 capitalize">
                  {formattedFull} ({dayOfWeek})
                </div>
              </div>

              {/* Table of bookings */}
              {dayBookings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg">
                  Nenhum agendamento registrado para {dayOfWeek}, {formatDateBR(printDate)}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-extrabold border-b border-slate-300">
                        <th className="p-2 border-r border-slate-300 w-28">Horário</th>
                        <th className="p-2 border-r border-slate-300 w-24">Turma</th>
                        <th className="p-2 border-r border-slate-300 w-36">Professor(a)</th>
                        <th className="p-2 border-r border-slate-300">Recurso(s)</th>
                        <th className="p-2 border-r border-slate-300">Temática / Conteúdo</th>
                        <th className="p-2 border-r border-slate-300 w-28 text-center">Assinatura Retirada</th>
                        <th className="p-2 w-28 text-center">Assinatura Devolução</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {dayBookings.map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="p-2 font-bold text-slate-900 border-r border-slate-300 whitespace-nowrap">
                            {b.periods.join(', ')}
                          </td>
                          <td className="p-2 font-extrabold text-blue-900 border-r border-slate-300">
                            {b.classroom}
                          </td>
                          <td className="p-2 font-semibold text-slate-800 border-r border-slate-300">
                            {b.teacherName}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-medium">
                            {getResourceNames(b.resourceIds, b.resourceDetails)}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-slate-700">
                            {b.theme}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center text-slate-300">
                            ____________________
                          </td>
                          <td className="p-2 text-center text-slate-300">
                            ____________________
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
                  <span className="font-semibold text-slate-700">Coordenação Pedagógica / Direção</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
                  <span className="font-semibold text-slate-700">Responsável pela Sala de Multimídia</span>
                </div>
              </div>
            </div>
          ) : (
            /* Single Voucher View */
            selectedBookingForVoucher && (
              <div className="max-w-xl mx-auto border-2 border-slate-800 rounded-xl p-6 space-y-4">
                <div className="text-center border-b border-slate-300 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    COMPROVANTE DE RESERVA MULTIMÍDIA
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900">
                    EduMídia - Controle de Recursos Pedagógicos
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Professor(a):</span>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {selectedBookingForVoucher.teacherName}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Turma:</span>
                    <div className="font-extrabold text-blue-800 text-sm">
                      {selectedBookingForVoucher.classroom}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Data:</span>
                    <div className="font-bold text-slate-900">
                      {selectedBookingForVoucher.dayOfWeek}, {formatDateBR(selectedBookingForVoucher.date)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Horário / Aulas:</span>
                    <div className="font-bold text-slate-900">
                      {selectedBookingForVoucher.periods.join(', ')}
                    </div>
                  </div>
                </div>

                <div className="text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Recursos Autorizados:</span>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {getResourceNames(
                      selectedBookingForVoucher.resourceIds,
                      selectedBookingForVoucher.resourceDetails
                    )}
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-slate-500 font-medium">Temática da Aula:</span>
                  <div className="font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 mt-0.5">
                    {selectedBookingForVoucher.theme}
                  </div>
                </div>

                <div className="pt-6 grid grid-cols-2 gap-4 text-center text-[11px]">
                  <div>
                    <div className="border-t border-slate-400 w-36 mx-auto mb-1"></div>
                    <span>Assinatura na Retirada</span>
                  </div>
                  <div>
                    <div className="border-t border-slate-400 w-36 mx-auto mb-1"></div>
                    <span>Assinatura na Devolução</span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
