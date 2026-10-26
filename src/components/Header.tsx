import React from 'react';
import {
  CalendarDays,
  ListFilter,
  Plus,
  Printer,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { formatDateBR, getDayOfWeekName, toISODateString } from '../utils/dateUtils';

interface HeaderProps {
  currentView: 'weekly' | 'daily' | 'catalog' | 'stats';
  onViewChange: (view: 'weekly' | 'daily' | 'catalog' | 'stats') => void;
  onOpenNewBooking: () => void;
  onOpenPrintModal: () => void;
  totalBookingsCount: number;
  todayBookingsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenNewBooking,
  onOpenPrintModal,
  totalBookingsCount,
  todayBookingsCount,
}) => {
  const todayStr = toISODateString(new Date());
  const dayOfWeek = getDayOfWeekName(todayStr);
  const formattedToday = formatDateBR(todayStr);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      {/* Top Notification / School Bar */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white tracking-wide">
            AMBIENTE PEDAGÓGICO INTEGRADO
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">
            Controle de Mídias, Equipamentos e Ambientes de Aprendizagem
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Hoje: {dayOfWeek}, {formattedToday}</span>
          </div>
          <span className="hidden md:inline bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
            {todayBookingsCount} {todayBookingsCount === 1 ? 'agendamento hoje' : 'agendamentos hoje'}
          </span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Edu<span className="text-blue-600">Mídia</span>
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                Agendamento Escolar
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Data Show, TV, Chromebooks, Cabos, Som, Biblioteca, Pátio e Labin
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            title="Imprimir folha de controle e retiradas"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Imprimir Pauta</span>
          </button>

          <button
            onClick={onOpenNewBooking}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm hover:shadow transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 pt-1 overflow-x-auto">
          <button
            onClick={() => onViewChange('weekly')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              currentView === 'weekly'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Grade Semanal</span>
          </button>

          <button
            onClick={() => onViewChange('daily')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              currentView === 'daily'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Agenda do Dia</span>
            {todayBookingsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                {todayBookingsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onViewChange('catalog')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              currentView === 'catalog'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Recursos & Espaços (8)</span>
          </button>

          <button
            onClick={() => onViewChange('stats')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              currentView === 'stats'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Painel & Relatórios</span>
            <span className="text-xs text-slate-400 font-normal">
              ({totalBookingsCount} no total)
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
