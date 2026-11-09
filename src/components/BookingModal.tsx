import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Check,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Users,
  Copy,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Booking, Resource, ShiftType } from '../types';
import {
  checkBookingConflicts,
  getDayOfWeekName,
  formatDateBR,
  toISODateString,
} from '../utils/dateUtils';
import {
  CLASSES_BY_SHIFT,
  COMMON_TEACHERS,
  PERIOD_SLOTS,
  getShiftForClass,
} from '../data/initialData';
import { ResourceIcon } from './ResourceIcon';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (booking: Booking | Booking[]) => void;
  resources: Resource[];
  existingBookings: Booking[];
  bookingToEdit?: Booking | null;
  defaultDate?: string;
  defaultResourceId?: string;
}

const QUICK_THEMES = [
  'Exibição de Filme / Vídeo',
  'Pesquisa na Internet',
  'Apresentação de Trabalho',
  'Leitura / Biblioteca',
  'Atividade Prática no Labin',
  'Evento / Apresentação no Pátio',
];

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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [shift, setShift] = useState<ShiftType>('matutino');
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>(['13.01']);
  const [multiBookingMode, setMultiBookingMode] = useState<'separate' | 'joint'>('separate');
  const [date, setDate] = useState<string>('');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  
  // Custom period selection per classroom (when multi-class is chosen)
  const [customSchedulePerClass, setCustomSchedulePerClass] = useState<boolean>(false);
  const [periodsByClass, setPeriodsByClass] = useState<Record<string, string[]>>({});
  const [activeClassTab, setActiveClassTab] = useState<string>('13.01');

  const [teacherName, setTeacherName] = useState<string>('');
  const [theme, setTheme] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingToEdit) {
      setSelectedResourceIds(bookingToEdit.resourceIds);
      setShift(bookingToEdit.shift);
      
      const parsedClasses = bookingToEdit.classroom
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const initialClasses = parsedClasses.length > 0 ? parsedClasses : ['13.01'];
      setSelectedClassrooms(initialClasses);
      setMultiBookingMode(parsedClasses.length > 1 ? 'joint' : 'separate');
      setCustomSchedulePerClass(false);
      setPeriodsByClass({ [initialClasses[0]]: bookingToEdit.periods });
      setActiveClassTab(initialClasses[0]);

      setDate(bookingToEdit.date);
      setSelectedPeriods(bookingToEdit.periods);
      setTeacherName(bookingToEdit.teacherName);
      setTheme(bookingToEdit.theme);
      setObservations(bookingToEdit.observations || '');
      setStep(1);
    } else {
      const todayStr = defaultDate || toISODateString(new Date());
      setDate(todayStr);
      setShift('matutino');
      setSelectedClassrooms(['13.01']);
      setMultiBookingMode('separate');
      setCustomSchedulePerClass(false);
      setSelectedResourceIds(defaultResourceId ? [defaultResourceId] : ['datashow']);
      const initialPeriod = ['1ª Aula (07:00 - 07:50)'];
      setSelectedPeriods(initialPeriod);
      setPeriodsByClass({ '13.01': initialPeriod });
      setActiveClassTab('13.01');
      setTeacherName('');
      setTheme('');
      setObservations('');
      setStep(1);
    }
    setFormError(null);
  }, [bookingToEdit, defaultDate, defaultResourceId, isOpen]);

  if (!isOpen) return null;

  const dayOfWeek = getDayOfWeekName(date);

  // Toggle resource
  const toggleResource = (id: string) => {
    if (selectedResourceIds.includes(id)) {
      if (selectedResourceIds.length > 1) {
        setSelectedResourceIds(selectedResourceIds.filter(rId => rId !== id));
      }
    } else {
      setSelectedResourceIds([...selectedResourceIds, id]);
    }
  };

  // Switch shift and pick first class of that shift
  const handleShiftSelect = (newShift: ShiftType) => {
    setShift(newShift);
    const classes = CLASSES_BY_SHIFT[newShift];
    const defaultCls = classes && classes.length > 0 ? classes[0] : '13.01';
    setSelectedClassrooms([defaultCls]);
    setActiveClassTab(defaultCls);
    setCustomSchedulePerClass(false);

    // Update period default for that shift
    const slots = PERIOD_SLOTS.filter(s => s.shift === newShift);
    const defaultPeriods = slots.length > 0 ? [`${slots[0].label} (${slots[0].timeRange})`] : [];
    setSelectedPeriods(defaultPeriods);
    setPeriodsByClass({ [defaultCls]: defaultPeriods });
  };

  // Toggle class selection for multi-class booking
  const toggleClassSelect = (cls: string) => {
    let nextClasses: string[];
    if (selectedClassrooms.includes(cls)) {
      // Don't deselect the last remaining class
      if (selectedClassrooms.length > 1) {
        nextClasses = selectedClassrooms.filter(c => c !== cls);
      } else {
        nextClasses = selectedClassrooms;
      }
    } else {
      nextClasses = [...selectedClassrooms, cls];
    }
    setSelectedClassrooms(nextClasses);

    // If adding a class, make sure it has an entry in periodsByClass
    if (!selectedClassrooms.includes(cls)) {
      setPeriodsByClass(prev => ({
        ...prev,
        [cls]: prev[cls] && prev[cls].length > 0 ? prev[cls] : [...selectedPeriods],
      }));
    }

    if (!nextClasses.includes(activeClassTab)) {
      setActiveClassTab(nextClasses[0] || '13.01');
    }
  };

  // Helper: Select all classes in current shift
  const handleSelectAllInShift = () => {
    const shiftClasses = CLASSES_BY_SHIFT[shift] || [];
    setSelectedClassrooms([...shiftClasses]);
    setPeriodsByClass(prev => {
      const updated = { ...prev };
      shiftClasses.forEach(c => {
        if (!updated[c] || updated[c].length === 0) {
          updated[c] = [...selectedPeriods];
        }
      });
      return updated;
    });
    if (shiftClasses.length > 0 && !shiftClasses.includes(activeClassTab)) {
      setActiveClassTab(shiftClasses[0]);
    }
  };

  // Helper: Select only a single class
  const handleSelectOnlyClass = (cls: string) => {
    setSelectedClassrooms([cls]);
    setActiveClassTab(cls);
    setCustomSchedulePerClass(false);
  };

  // Global toggle period (unified mode)
  const togglePeriod = (label: string) => {
    let nextPeriods: string[];
    if (selectedPeriods.includes(label)) {
      if (selectedPeriods.length > 1) {
        nextPeriods = selectedPeriods.filter(p => p !== label);
      } else {
        nextPeriods = selectedPeriods;
      }
    } else {
      nextPeriods = [...selectedPeriods, label];
    }
    setSelectedPeriods(nextPeriods);

    // Keep all classes in sync if unified mode is active
    if (!customSchedulePerClass) {
      setPeriodsByClass(prev => {
        const updated = { ...prev };
        selectedClassrooms.forEach(c => {
          updated[c] = [...nextPeriods];
        });
        return updated;
      });
    }
  };

  // Specific period toggle for a single class (custom schedule mode)
  const togglePeriodForClass = (cls: string, label: string) => {
    const current = periodsByClass[cls] || [];
    const updated = current.includes(label)
      ? current.filter(p => p !== label)
      : [...current, label];

    setPeriodsByClass(prev => ({
      ...prev,
      [cls]: updated,
    }));
  };

  // Helper: Copy active class's schedule to all selected classes
  const handleCopyScheduleToAll = (sourceClass: string) => {
    const sourcePeriods = periodsByClass[sourceClass] || selectedPeriods;
    if (sourcePeriods.length === 0) return;
    const newMap: Record<string, string[]> = {};
    selectedClassrooms.forEach(c => {
      newMap[c] = [...sourcePeriods];
    });
    setPeriodsByClass(newMap);
  };

  // Helper: Auto-distribute slots in sequence (1ª aula para turma 1, 2ª aula para turma 2, etc.)
  const handleDistributeSequentially = () => {
    const slots = PERIOD_SLOTS.filter(s => s.shift === shift);
    const newMap: Record<string, string[]> = {};
    selectedClassrooms.forEach((cls, idx) => {
      const slot = slots[idx % slots.length];
      if (slot) {
        newMap[cls] = [`${slot.label} (${slot.timeRange})`];
      }
    });
    setPeriodsByClass(newMap);
  };

  // Conflict detection supporting both unified schedule and per-classroom customized schedules
  const conflictInfo = useMemo(() => {
    if (!customSchedulePerClass || selectedClassrooms.length <= 1) {
      return checkBookingConflicts(
        {
          id: bookingToEdit?.id,
          date,
          periods: selectedPeriods,
          resourceIds: selectedResourceIds,
        },
        existingBookings,
        resources
      );
    }

    // Check each class in the custom schedule batch
    const tempBatchBookings: Booking[] = [];
    for (const cls of selectedClassrooms) {
      const clsPeriods = periodsByClass[cls] || [];
      if (clsPeriods.length === 0) continue;

      const conflict = checkBookingConflicts(
        {
          id: undefined,
          date,
          periods: clsPeriods,
          resourceIds: selectedResourceIds,
        },
        [...existingBookings, ...tempBatchBookings],
        resources
      );

      if (conflict.hasConflict) {
        return {
          ...conflict,
          reason: `Turma ${cls}: ${conflict.reason}`,
        };
      }

      tempBatchBookings.push({
        id: `batch-${cls}`,
        teacherName: teacherName || 'Professor',
        classroom: cls,
        date,
        dayOfWeek,
        shift,
        periods: clsPeriods,
        resourceIds: selectedResourceIds,
        theme: theme || 'Aula',
        status: 'agendado',
        createdAt: new Date().toISOString(),
      });
    }

    return { hasConflict: false, conflictingBookings: [] };
  }, [
    customSchedulePerClass,
    selectedClassrooms,
    periodsByClass,
    selectedPeriods,
    bookingToEdit,
    date,
    selectedResourceIds,
    existingBookings,
    resources,
    teacherName,
    dayOfWeek,
    shift,
    theme,
  ]);

  // Handler to safely move from Step 3 to Step 4
  const handleGoToStep4 = () => {
    setFormError(null);
    if (!date) {
      setFormError('Por favor selecione a data do agendamento.');
      return;
    }

    if (customSchedulePerClass && selectedClassrooms.length > 1) {
      const emptyClass = selectedClassrooms.find(
        cls => !periodsByClass[cls] || periodsByClass[cls].length === 0
      );
      if (emptyClass) {
        setFormError(`A Turma ${emptyClass} precisa ter pelo menos 1 aula selecionada.`);
        setActiveClassTab(emptyClass);
        return;
      }
    } else {
      if (selectedPeriods.length === 0) {
        setFormError('Selecione pelo menos uma aula.');
        return;
      }
    }

    if (conflictInfo.hasConflict) {
      setFormError(conflictInfo.reason || 'Conflito de agendamento detectado!');
      return;
    }

    setStep(4);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (selectedResourceIds.length === 0) {
      setFormError('Escolha pelo menos 1 equipamento ou espaço.');
      setStep(1);
      return;
    }

    if (selectedClassrooms.length === 0) {
      setFormError('Selecione pelo menos uma turma.');
      setStep(2);
      return;
    }

    if (!date) {
      setFormError('Selecione a data do agendamento.');
      setStep(3);
      return;
    }

    if (customSchedulePerClass && selectedClassrooms.length > 1) {
      const emptyClass = selectedClassrooms.find(
        cls => !periodsByClass[cls] || periodsByClass[cls].length === 0
      );
      if (emptyClass) {
        setFormError(`A Turma ${emptyClass} precisa ter pelo menos 1 aula selecionada.`);
        setActiveClassTab(emptyClass);
        setStep(3);
        return;
      }
    } else {
      if (selectedPeriods.length === 0) {
        setFormError('Selecione pelo menos uma aula.');
        setStep(3);
        return;
      }
    }

    if (!teacherName.trim()) {
      setFormError('Informe o nome do professor.');
      setStep(4);
      return;
    }

    if (!theme.trim()) {
      setFormError('Informe o tema da aula.');
      setStep(4);
      return;
    }

    if (conflictInfo.hasConflict) {
      setFormError(conflictInfo.reason || 'Conflito de agendamento!');
      return;
    }

    // MULTI-CLASS LOGIC:
    // If user selected multiple classes and chose "separate" OR chose customized schedules per class
    if (selectedClassrooms.length > 1 && (multiBookingMode === 'separate' || customSchedulePerClass) && !bookingToEdit) {
      const bookingsList: Booking[] = selectedClassrooms.map((cls, idx) => {
        const clsPeriods = (customSchedulePerClass && periodsByClass[cls] && periodsByClass[cls].length > 0)
          ? periodsByClass[cls]
          : selectedPeriods;

        return {
          id: `book-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          teacherName: teacherName.trim(),
          classroom: cls,
          date,
          dayOfWeek,
          shift,
          periods: clsPeriods,
          resourceIds: selectedResourceIds,
          resourceDetails: Object.fromEntries(selectedResourceIds.map(id => [id, { quantity: 1 }])),
          theme: theme.trim(),
          observations: observations.trim(),
          status: 'agendado',
          createdAt: new Date().toISOString(),
        };
      });

      onSave(bookingsList);
    } else {
      // Single booking (either 1 class or joint multi-class "13.01, 14.01")
      const newBooking: Booking = {
        id: bookingToEdit ? bookingToEdit.id : `book-${Date.now()}`,
        teacherName: teacherName.trim(),
        classroom: selectedClassrooms.join(', '),
        date,
        dayOfWeek,
        shift,
        periods: selectedPeriods,
        resourceIds: selectedResourceIds,
        resourceDetails: Object.fromEntries(selectedResourceIds.map(id => [id, { quantity: 1 }])),
        theme: theme.trim(),
        observations: observations.trim(),
        status: bookingToEdit ? bookingToEdit.status : 'agendado',
        createdAt: bookingToEdit ? bookingToEdit.createdAt : new Date().toISOString(),
      };

      onSave(newBooking);
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // ignore
    }

    onClose();
  };

  const availableSlots = PERIOD_SLOTS.filter(s => s.shift === shift);
  const currentShiftClasses = CLASSES_BY_SHIFT[shift] || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Simple Header */}
        <div className="bg-blue-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Simples & Rápido
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              {bookingToEdit ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step indicator bar */}
        <div className="bg-blue-50/60 px-4 py-2.5 border-b border-blue-100 flex items-center justify-between text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5 sm:gap-3 overflow-x-auto">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                step === 1 ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-blue-100 text-slate-700'
              }`}
            >
              <span>1. Equipamento</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                step === 2 ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-blue-100 text-slate-700'
              }`}
            >
              <span>2. Turma(s)</span>
              {selectedClassrooms.length > 1 && (
                <span className="bg-white text-blue-700 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {selectedClassrooms.length}
                </span>
              )}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                step === 3 ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-blue-100 text-slate-700'
              }`}
            >
              <span>3. Dia e Aula</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setStep(4)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                step === 4 ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-blue-100 text-slate-700'
              }`}
            >
              <span>4. Professor</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {formError && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Conflict warning in real time */}
          {conflictInfo.hasConflict && (
            <div className="p-3 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs sm:text-sm font-semibold flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Atenção: Esse horário já está ocupado!</strong>
                <p className="text-xs mt-0.5">{conflictInfo.reason}</p>
              </div>
            </div>
          )}

          {/* ================= STEP 1: O QUE VOCÊ PRECISA? ================= */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-black text-slate-900">
                  Passo 1: O que você vai usar?
                </h3>
                <p className="text-xs text-slate-500">
                  Clique no que você precisa (pode escolher mais de um):
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {resources.map(res => {
                  const isSelected = selectedResourceIds.includes(res.id);
                  return (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => toggleResource(res.id)}
                      className={`p-3.5 rounded-2xl border-2 text-center flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <ResourceIcon id={res.id} className="w-6 h-6" />
                      </div>
                      <span className="text-xs sm:text-sm font-extrabold leading-tight">
                        {res.name.split('(')[0].trim()}
                      </span>
                      {isSelected && (
                        <span className="mt-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-200/80 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Selecionado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm"
                >
                  <span>Continuar para Turma</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: QUAL A SUA TURMA? (SUPPORTS MULTI-CLASS) ================= */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Passo 2: Qual é o Turno e Turma(s)?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Você pode marcar <strong>mais de uma turma</strong> ao mesmo tempo:
                  </p>
                </div>
                {selectedClassrooms.length > 1 && (
                  <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-black bg-blue-100 text-blue-900 px-3 py-1 rounded-full border border-blue-200">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    {selectedClassrooms.length} Turmas Marcadas
                  </span>
                )}
              </div>

              {/* 3 Big Shift Buttons */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => handleShiftSelect('matutino')}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    shift === 'matutino'
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-md ring-2 ring-amber-400/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Sun className="w-6 h-6 text-amber-500 mb-1" />
                  <span className="font-extrabold text-sm sm:text-base">Manhã</span>
                  <span className="text-[10px] text-slate-500">Matutino</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShiftSelect('vespertino')}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    shift === 'vespertino'
                      ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-md ring-2 ring-orange-400/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Sunset className="w-6 h-6 text-orange-500 mb-1" />
                  <span className="font-extrabold text-sm sm:text-base">Tarde</span>
                  <span className="text-[10px] text-slate-500">Vespertino</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShiftSelect('noturno')}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    shift === 'noturno'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md ring-2 ring-indigo-400/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Moon className="w-6 h-6 text-indigo-500 mb-1" />
                  <span className="font-extrabold text-sm sm:text-base">Noite</span>
                  <span className="text-[10px] text-slate-500">Noturno</span>
                </button>
              </div>

              {/* Class Selection Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    Toque nas turmas do turno{' '}
                    <span className="uppercase text-blue-700 font-extrabold">{shift}</span> para selecionar:
                  </span>

                  {/* Quick Select All or Reset */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAllInShift}
                      className="text-[11px] font-extrabold text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      Marcar Todas do Turno
                    </button>
                    {selectedClassrooms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleSelectOnlyClass(selectedClassrooms[0])}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2 py-1 rounded-lg transition-colors"
                      >
                        Apenas 1 Turma
                      </button>
                    )}
                  </div>
                </div>

                {/* Turmas Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {currentShiftClasses.map(cls => {
                    const isSelected = selectedClassrooms.includes(cls);
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleClassSelect(cls)}
                        className={`p-3 rounded-xl border-2 font-black text-base sm:text-lg transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30'
                            : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center border ${
                              isSelected ? 'bg-white text-blue-600 border-white' : 'border-slate-400 bg-slate-50'
                            }`}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </div>
                          <span>Turma {cls}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* MULTI-CLASS MODE TOGGLE (When 2+ classes are chosen) */}
                {selectedClassrooms.length > 1 && (
                  <div className="mt-3 p-3.5 bg-white rounded-xl border-2 border-blue-200 shadow-xs space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        Opção de Agendamento Múltiplo ({selectedClassrooms.join(', ')}):
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                      {/* Separate Bookings */}
                      <button
                        type="button"
                        onClick={() => setMultiBookingMode('separate')}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-start text-left ${
                          multiBookingMode === 'separate'
                            ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-400/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                            <Copy className="w-4 h-4 text-blue-600" />
                            Agendamentos Separados
                          </span>
                          {multiBookingMode === 'separate' && (
                            <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">
                              Ativo
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 leading-snug">
                          Cria {selectedClassrooms.length} agendamentos individuais (1 para cada turma) no mesmo horário.
                        </span>
                      </button>

                      {/* Joint Class Booking */}
                      <button
                        type="button"
                        onClick={() => setMultiBookingMode('joint')}
                        className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-start text-left ${
                          multiBookingMode === 'joint'
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-400/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs sm:text-sm font-black flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            Aula Conjunta (Turmas Juntas)
                          </span>
                          {multiBookingMode === 'joint' && (
                            <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                              Ativo
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 leading-snug">
                          Cria 1 único agendamento reunindo as turmas no mesmo local (ex: no pátio ou labin).
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-slate-600 font-semibold text-xs sm:text-sm"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm"
                >
                  <span>Continuar para Data e Aula</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: DIA E AULAS ================= */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Passo 3: Qual é o Dia e a Aula?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Escolha a data e o horário das aulas:
                  </p>
                </div>
                {selectedClassrooms.length > 1 && (
                  <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-black bg-blue-100 text-blue-900 px-3 py-1 rounded-full border border-blue-200">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    {selectedClassrooms.length} Turmas: {selectedClassrooms.join(', ')}
                  </span>
                )}
              </div>

              {/* Date selection */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Data do Agendamento:
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="px-3.5 py-2.5 text-base font-extrabold border-2 border-slate-300 rounded-xl bg-white focus:border-blue-600 focus:outline-none flex-1"
                  />
                  <div className="px-4 py-2.5 rounded-xl bg-blue-100 text-blue-900 font-black text-sm flex items-center justify-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>{dayOfWeek || 'Escolha a data'}</span>
                  </div>
                </div>
              </div>

              {/* MULTI-CLASS SCHEDULE MODE (Shown when 2+ classes are chosen) */}
              {selectedClassrooms.length > 1 && (
                <div className="bg-blue-50/70 border-2 border-blue-200 rounded-2xl p-3.5 space-y-2.5">
                  <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Como você quer definir os horários das {selectedClassrooms.length} turmas?
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {/* Option A: Unified schedule */}
                    <button
                      type="button"
                      onClick={() => setCustomSchedulePerClass(false)}
                      className={`p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 ${
                        !customSchedulePerClass
                          ? 'border-blue-600 bg-white text-blue-950 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white/60 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                          !customSchedulePerClass
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {!customSchedulePerClass && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <p className="font-extrabold text-xs sm:text-sm">Mesmo horário para todas</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Todas as turmas usarão a mesma aula.
                        </p>
                      </div>
                    </button>

                    {/* Option B: Custom schedule per class */}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomSchedulePerClass(true);
                        setMultiBookingMode('separate');
                        if (!selectedClassrooms.includes(activeClassTab)) {
                          setActiveClassTab(selectedClassrooms[0]);
                        }
                      }}
                      className={`p-3 rounded-xl border-2 transition-all flex items-start gap-2.5 ${
                        customSchedulePerClass
                          ? 'border-blue-600 bg-white text-blue-950 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white/60 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                          customSchedulePerClass
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-400 bg-white'
                        }`}
                      >
                        {customSchedulePerClass && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-extrabold text-xs sm:text-sm">Escolher horário para cada turma</p>
                          <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                            Personalizado
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Ex: 1ª aula para a Turma {selectedClassrooms[0]}, 2ª aula para a Turma {selectedClassrooms[1] || 'seguinte'}.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* PERIOD SELECTION: BRANCH A - CUSTOM PER CLASS */}
              {customSchedulePerClass && selectedClassrooms.length > 1 ? (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Classroom Tabs & Quick Tools */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      1. Toque na turma para definir o horário dela:
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleDistributeSequentially}
                        className="text-[11px] font-extrabold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                        title="Atribui aulas sequenciais automaticamente (1ª aula para turma 1, 2ª para turma 2, etc.)"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        Distribuir em Sequência
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyScheduleToAll(activeClassTab)}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                        title="Copia os horários da turma ativa para as outras"
                      >
                        <Copy className="w-3 h-3 text-blue-600" />
                        Copiar da Turma {activeClassTab}
                      </button>
                    </div>
                  </div>

                  {/* Classroom Pills / Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedClassrooms.map(cls => {
                      const isActive = activeClassTab === cls;
                      const clsPeriods = periodsByClass[cls] || [];
                      const count = clsPeriods.length;

                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setActiveClassTab(cls)}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all relative ${
                            isActive
                              ? 'border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-500/30'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sm">Turma {cls}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : count > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {count === 0 ? 'Sem aula' : count === 1 ? '1 aula' : `${count} aulas`}
                            </span>
                          </div>
                          <p
                            className={`text-[11px] mt-1 font-medium truncate ${
                              isActive ? 'text-blue-100' : 'text-slate-500'
                            }`}
                          >
                            {count > 0
                              ? clsPeriods.map(p => p.split('(')[0].trim()).join(', ')
                              : 'Toque para escolher'}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Period Slot Buttons for Active Classroom */}
                  <div className="bg-slate-50 p-4 rounded-2xl border-2 border-blue-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-600" />
                        2. Aulas da <strong className="text-blue-700 uppercase font-black">Turma {activeClassTab}</strong>:
                      </span>
                      <span className="text-[11px] text-slate-500">
                        (Toque na aula para marcar ou desmarcar)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableSlots.map(slot => {
                        const label = `${slot.label} (${slot.timeRange})`;
                        const currentPeriods = periodsByClass[activeClassTab] || [];
                        const isSelected = currentPeriods.includes(label);

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => togglePeriodForClass(activeClassTab, label)}
                            className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/20'
                                : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-black">{slot.label}</span>
                              {isSelected && <Check className="w-4 h-4 stroke-[3] text-white" />}
                            </div>
                            <span
                              className={`text-xs block mt-0.5 ${
                                isSelected ? 'text-blue-100 font-medium' : 'text-slate-500'
                              }`}
                            >
                              {slot.timeRange}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary of assigned periods for all classes */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                      Horários configurados para cada turma:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {selectedClassrooms.map(cls => {
                        const clsPeriods = periodsByClass[cls] || [];
                        const isCurrent = activeClassTab === cls;
                        return (
                          <div
                            key={cls}
                            onClick={() => setActiveClassTab(cls)}
                            className={`p-2 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                              isCurrent
                                ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="font-extrabold">Turma {cls}:</span>
                            <span className="font-extrabold text-blue-700">
                              {clsPeriods.length > 0
                                ? clsPeriods.map(p => p.split('(')[0].trim()).join(', ')
                                : '⚠️ Nenhuma aula'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* PERIOD SELECTION: BRANCH B - UNIFIED SCHEDULE */
                <div>
                  <span className="block text-xs font-bold text-slate-700 mb-2">
                    Em qual(is) aula(s) vai usar? (Pode marcar mais de uma):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableSlots.map(slot => {
                      const label = `${slot.label} (${slot.timeRange})`;
                      const isSelected = selectedPeriods.includes(label);
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => togglePeriod(label)}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black">{slot.label}</span>
                            {isSelected && <Check className="w-4 h-4 stroke-[3] text-white" />}
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${
                              isSelected ? 'text-blue-100 font-medium' : 'text-slate-500'
                            }`}
                          >
                            {slot.timeRange}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-slate-600 font-semibold text-xs sm:text-sm hover:text-slate-900"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleGoToStep4}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm"
                >
                  <span>Continuar para Professor</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: PROFESSOR E TEMA ================= */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Passo 4: Quem é o Professor e o Tema?
                </h3>
                <p className="text-xs text-slate-500">
                  Preencha o nome do professor e o que será feito na aula:
                </p>
              </div>

              {/* Teacher field with quick autocomplete */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Professor(a):
                </label>
                <input
                  type="text"
                  list="teachers-quick-list"
                  placeholder="Ex: Prof. Marcos Oliveira"
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base font-bold border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-slate-50/50"
                />
                <datalist id="teachers-quick-list">
                  {COMMON_TEACHERS.map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>

                {/* Quick teacher chips */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {COMMON_TEACHERS.slice(0, 4).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTeacherName(t.split('(')[0].trim())}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-lg transition-colors"
                    >
                      {t.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme field with quick buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tema da Aula / Objetivo:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Exibição de documentário ou pesquisa no computador"
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base font-bold border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none bg-slate-50/50"
                />

                {/* 1-click Theme Suggestions */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2">
                  {QUICK_THEMES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className="text-left text-xs bg-slate-100 hover:bg-blue-100 hover:text-blue-900 text-slate-700 p-2 rounded-xl transition-colors font-medium border border-slate-200"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary card before confirm */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 text-xs text-emerald-950 space-y-2">
                <span className="font-extrabold text-emerald-900 text-xs uppercase tracking-wider block">
                  Resumo do seu Agendamento:
                </span>
                <p>
                  <strong>
                    {selectedClassrooms.length > 1 ? 'Turmas Selecionadas:' : 'Turma:'}
                  </strong>{' '}
                  <span className="font-black text-emerald-800">
                    {selectedClassrooms.join(', ')}
                  </span>{' '}
                  ({shift})
                  {selectedClassrooms.length > 1 && (
                    <span className="ml-2 inline-block bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold">
                      {customSchedulePerClass || multiBookingMode === 'separate'
                        ? `Serão gerados ${selectedClassrooms.length} agendamentos separados`
                        : 'Aula conjunta (mesmo agendamento)'}
                    </span>
                  )}
                </p>
                <p>
                  <strong>Data:</strong> {dayOfWeek}, {date ? formatDateBR(date) : ''}
                </p>

                {/* Schedule Breakdown */}
                {customSchedulePerClass && selectedClassrooms.length > 1 ? (
                  <div className="space-y-1">
                    <strong className="block text-emerald-950">Horário Definido por Turma:</strong>
                    <div className="bg-white/80 rounded-xl p-2.5 space-y-1.5 border border-emerald-200">
                      {selectedClassrooms.map(cls => {
                        const clsPeriods = periodsByClass[cls] || selectedPeriods;
                        return (
                          <div key={cls} className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-emerald-950">Turma {cls}:</span>
                            <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              {clsPeriods.length > 0 ? clsPeriods.join(', ') : 'Nenhuma aula selecionada'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p>
                    <strong>Aula(s):</strong> {selectedPeriods.join(', ')}
                  </p>
                )}

                <p>
                  <strong>Recurso(s):</strong>{' '}
                  {selectedResourceIds
                    .map(id => resources.find(r => r.id === id)?.name.split('(')[0].trim())
                    .join(', ')}
                </p>
              </div>

              {/* Final Confirm Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-slate-600 font-semibold text-xs sm:text-sm hover:text-slate-900"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={conflictInfo.hasConflict}
                  className={`px-8 py-3.5 text-base sm:text-lg font-black text-white rounded-2xl shadow-lg transition-all flex items-center gap-2 ${
                    conflictInfo.hasConflict
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {selectedClassrooms.length > 1 && (multiBookingMode === 'separate' || customSchedulePerClass)
                      ? `Confirmar ${selectedClassrooms.length} Agendamentos`
                      : 'Confirmar Agendamento'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
