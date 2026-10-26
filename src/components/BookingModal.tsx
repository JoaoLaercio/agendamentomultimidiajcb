import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Booking, PeriodSlot, Resource, ShiftType } from '../types';
import {
  checkBookingConflicts,
  getDayOfWeekName,
  formatDateBR,
  toISODateString,
} from '../utils/dateUtils';
import { COMMON_CLASSES, COMMON_TEACHERS, PERIOD_SLOTS } from '../data/initialData';
import { ResourceIcon } from './ResourceIcon';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Booking) => void;
  resources: Resource[];
  existingBookings: Booking[];
  bookingToEdit?: Booking | null;
  defaultDate?: string;
  defaultResourceId?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  resources,
  existingBookings,
  bookingToEdit,
  defaultDate,
  defaultResourceId,
}) => {
  const [teacherName, setTeacherName] = useState('');
  const [classroom, setClassroom] = useState('');
  const [date, setDate] = useState('');
  const [shift, setShift] = useState<ShiftType>('matutino');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [resourceQuantities, setResourceQuantities] = useState<Record<string, number>>({});
  const [theme, setTheme] = useState('');
  const [observations, setObservations] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form state
  useEffect(() => {
    if (bookingToEdit) {
      setTeacherName(bookingToEdit.teacherName);
      setClassroom(bookingToEdit.classroom);
      setDate(bookingToEdit.date);
      setShift(bookingToEdit.shift);
      setSelectedPeriods(bookingToEdit.periods);
      setSelectedResourceIds(bookingToEdit.resourceIds);
      const qtyMap: Record<string, number> = {};
      bookingToEdit.resourceIds.forEach(id => {
        qtyMap[id] = bookingToEdit.resourceDetails?.[id]?.quantity || 1;
      });
      setResourceQuantities(qtyMap);
      setTheme(bookingToEdit.theme);
      setObservations(bookingToEdit.observations || '');
    } else {
      const initialDate = defaultDate || toISODateString(new Date());
      setDate(initialDate);
      setShift('matutino');
      // Default to 1st and 2nd period of morning
      setSelectedPeriods(['1ª Aula (07:00 - 07:50)']);
      if (defaultResourceId) {
        setSelectedResourceIds([defaultResourceId]);
        setResourceQuantities({ [defaultResourceId]: 1 });
      } else {
        setSelectedResourceIds(['datashow']);
        setResourceQuantities({ datashow: 1 });
      }
      setTeacherName('');
      setClassroom('');
      setTheme('');
      setObservations('');
    }
    setFormError(null);
  }, [bookingToEdit, defaultDate, defaultResourceId, isOpen]);

  if (!isOpen) return null;

  // Auto-computed Day of Week in Portuguese
  const dayOfWeek = getDayOfWeekName(date);

  // Filter periods by current shift
  const availableSlots = PERIOD_SLOTS.filter(s => s.shift === shift);

  // Handle period toggle
  const togglePeriod = (labelWithTime: string) => {
    if (selectedPeriods.includes(labelWithTime)) {
      setSelectedPeriods(selectedPeriods.filter(p => p !== labelWithTime));
    } else {
      setSelectedPeriods([...selectedPeriods, labelWithTime]);
    }
  };

  // Handle resource toggle
  const toggleResource = (resourceId: string) => {
    if (selectedResourceIds.includes(resourceId)) {
      setSelectedResourceIds(selectedResourceIds.filter(id => id !== resourceId));
    } else {
      setSelectedResourceIds([...selectedResourceIds, resourceId]);
      if (!resourceQuantities[resourceId]) {
        setResourceQuantities(prev => ({ ...prev, [resourceId]: 1 }));
      }
    }
  };

  const handleQuantityChange = (resourceId: string, qty: number) => {
    const resource = resources.find(r => r.id === resourceId);
    const max = resource?.totalQuantity || 1;
    const clamped = Math.max(1, Math.min(max, qty));
    setResourceQuantities(prev => ({ ...prev, [resourceId]: clamped }));
  };

  // Real-time conflict validation
  const conflictInfo = checkBookingConflicts(
    {
      id: bookingToEdit?.id,
      date,
      periods: selectedPeriods,
      resourceIds: selectedResourceIds,
      resourceDetails: Object.fromEntries(
        selectedResourceIds.map(id => [id, { quantity: resourceQuantities[id] || 1 }])
      ),
    },
    existingBookings,
    resources
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!teacherName.trim()) {
      setFormError('Por favor, informe o nome do professor.');
      return;
    }

    if (!classroom.trim()) {
      setFormError('Por favor, informe a turma.');
      return;
    }

    if (!date) {
      setFormError('Por favor, selecione a data do agendamento.');
      return;
    }

    if (selectedPeriods.length === 0) {
      setFormError('Por favor, selecione pelo menos um horário/aula.');
      return;
    }

    if (selectedResourceIds.length === 0) {
      setFormError('Selecione pelo menos um recurso ou espaço multimídia.');
      return;
    }

    if (!theme.trim()) {
      setFormError('Por favor, informe a temática ou objetivo pedagógico da aula.');
      return;
    }

    if (conflictInfo.hasConflict) {
      setFormError(conflictInfo.reason || 'Conflito de agendamento detectado.');
      return;
    }

    const resourceDetailsMap: Record<string, { quantity?: number; notes?: string }> = {};
    selectedResourceIds.forEach(id => {
      resourceDetailsMap[id] = {
        quantity: resourceQuantities[id] || 1,
      };
    });

    const newBooking: Booking = {
      id: bookingToEdit ? bookingToEdit.id : `book-${Date.now()}`,
      teacherName: teacherName.trim(),
      classroom: classroom.trim(),
      date,
      dayOfWeek,
      shift,
      periods: selectedPeriods,
      resourceIds: selectedResourceIds,
      resourceDetails: resourceDetailsMap,
      theme: theme.trim(),
      observations: observations.trim(),
      status: bookingToEdit ? bookingToEdit.status : 'agendado',
      createdAt: bookingToEdit ? bookingToEdit.createdAt : new Date().toISOString(),
    };

    onSave(newBooking);

    // Fire celebratory confetti if creating fresh
    if (!bookingToEdit) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                {bookingToEdit ? 'Editar Agendamento Multimídia' : 'Novo Agendamento Multimídia'}
              </h2>
              <p className="text-xs text-blue-100">
                Preencha os dados da turma, professor, horários e recursos necessários
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 font-semibold animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Conflict Live Warning Alert */}
          {conflictInfo.hasConflict && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs text-amber-900 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold block mb-0.5">Aviso de Conflito de Horário!</strong>
                <p>{conflictInfo.reason}</p>
                <p className="mt-1 text-[11px] text-amber-800">
                  Por favor, escolha outro horário, outra data ou recurso disponível.
                </p>
              </div>
            </div>
          )}

          {!conflictInfo.hasConflict && selectedPeriods.length > 0 && selectedResourceIds.length > 0 && (
            <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Horário e recursos <strong>100% disponíveis</strong> para este agendamento!
              </span>
            </div>
          )}

          {/* Row 1: Professor & Turma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Nome do Professor(a) *
                </span>
              </label>
              <input
                type="text"
                list="teachers-list"
                placeholder="Ex: Prof. Marcos Oliveira"
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 font-medium"
              />
              <datalist id="teachers-list">
                {COMMON_TEACHERS.map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  Turma *
                </span>
              </label>
              <input
                type="text"
                list="classes-list"
                placeholder="Ex: 9º Ano B, 1ª Série EM"
                value={classroom}
                onChange={e => setClassroom(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 font-medium"
              />
              <datalist id="classes-list">
                {COMMON_CLASSES.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {/* Quick turma selection chips */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {['6º A', '7º B', '8º A', '9º B', '1º EM', '2º EM', '3º EM'].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setClassroom(chip)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Data do Mês & Dia da Semana sincronizados */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Data do Dia do Mês *
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Dia da Semana Calculado:
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm font-extrabold border border-blue-200">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  {dayOfWeek || 'Selecione a data'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({date ? formatDateBR(date) : '--/--/----'})
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Turno & Horários / Aulas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Turno e Aulas / Horários *
                </span>
              </label>

              {/* Turno Selector tabs */}
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                {(['matutino', 'vespertino', 'noturno'] as ShiftType[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setShift(s);
                      // Clear and select first slot of new shift
                      const firstInShift = PERIOD_SLOTS.find(slot => slot.shift === s);
                      if (firstInShift) {
                        setSelectedPeriods([`${firstInShift.label} (${firstInShift.timeRange})`]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                      shift === s
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Period Selection Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableSlots.map(slot => {
                const fullLabel = `${slot.label} (${slot.timeRange})`;
                const isSelected = selectedPeriods.includes(fullLabel);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => togglePeriod(fullLabel)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{slot.label}</div>
                    <div className={`text-[11px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {slot.timeRange}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedPeriods.length > 0 && (
              <div className="mt-2 text-xs text-slate-500 font-medium">
                Selecionado(s): <strong className="text-slate-800">{selectedPeriods.join(', ')}</strong>
              </div>
            )}
          </div>

          {/* Row 4: Recursos Solicitados (Multimídia e Espaços) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Recursos e Espaços Pedagógicos *
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Pode selecionar múltiplos recursos simultâneos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {resources.map(res => {
                const isSelected = selectedResourceIds.includes(res.id);
                const qty = resourceQuantities[res.id] || 1;
                return (
                  <div
                    key={res.id}
                    onClick={() => toggleResource(res.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-400/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <ResourceIcon id={res.id} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {res.name}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">
                          {res.category === 'space' ? 'Espaço Escolar' : `Disponíveis: ${res.totalQuantity}`}
                        </div>
                      </div>
                    </div>

                    {/* Quantity controller for equipment */}
                    {isSelected && res.category === 'equipment' && res.totalQuantity > 1 && (
                      <div
                        className="mt-2.5 pt-2 border-t border-blue-200 flex items-center justify-between"
                        onClick={e => e.stopPropagation()}
                      >
                        <span className="text-[10px] font-bold text-blue-900">Qtd:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(res.id, qty - 1)}
                            className="w-5 h-5 bg-white border border-blue-300 rounded text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="text-xs font-extrabold text-blue-900 w-4 text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(res.id, qty + 1)}
                            className="w-5 h-5 bg-white border border-blue-300 rounded text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 5: Temática da Aula (Obrigatório) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Temática / Conteúdo Pedagógico da Aula *
              </span>
            </label>
            <input
              type="text"
              placeholder="Ex: Exibição do filme Ilha das Flores e debate sobre sustentabilidade"
              value={theme}
              onChange={e => setTheme(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50 font-medium"
            />
            {/* Quick theme suggestions */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[
                'Documentário com debate',
                'Pesquisa guiada na Web',
                'Simulações e jogos educativos',
                'Apresentação de seminário',
                'Oficina prática de robótica',
              ].map(sug => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setTheme(sug)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Row 6: Observações / Necessidades extras */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações Adicionais (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Necessidade de tomada 220V, microfone reserva, apoio para posicionamento do suporte..."
              value={observations}
              onChange={e => setObservations(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={conflictInfo.hasConflict}
              className={`px-5 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all ${
                conflictInfo.hasConflict
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow'
              }`}
            >
              {bookingToEdit ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
