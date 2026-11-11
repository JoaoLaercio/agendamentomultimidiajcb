import {
  CalendarDays,
  ListFilter,
  Plus,
  Printer,
  Sparkles,
  Layers,
  GraduationCap,
  Database,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { formatDateBR, getDayOfWeekName, toISODateString } from '../utils/dateUtils';

interface HeaderProps {
  currentView: 'weekly' | 'daily' | 'catalog' | 'stats';
  onViewChange: (view: 'weekly' | 'daily' | 'catalog' | 'stats') => void;
  onOpenNewBooking: () => void;
  onOpenPrintModal: () => void;
  onOpenIntegrationModal: () => void;
  isSupabaseActive: boolean;
  supabaseStatus?: 'connected' | 'offline' | 'disconnected' | 'connecting';
  totalBookingsCount: number;
  todayBookingsCount: number;
  isAdmin: boolean;
  onUnlockAdmin: () => void;
  onLockAdmin: () => void;
  onOpenChangePin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenNewBooking,
  onOpenPrintModal,
  onOpenIntegrationModal,
  isSupabaseActive,
  supabaseStatus = 'connected',
  totalBookingsCount,
  todayBookingsCount,
  isAdmin,
  onUnlockAdmin,
  onLockAdmin,
  onOpenChangePin,
}) => {
  const todayStr = toISODateString(new Date());
  const dayOfWeek = getDayOfWeekName(todayStr);
  const formattedToday = formatDateBR(todayStr);

  const isConnected = supabaseStatus === 'connected' || (isSupabaseActive && supabaseStatus !== 'offline');
  const isOffline = supabaseStatus === 'offline';

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
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Hoje: {dayOfWeek}, {formattedToday}</span>
          </div>

          {/* Admin Lock / Unlock Status Toggle */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Ativo</span>
              <button
                type="button"
                onClick={onOpenChangePin}
                className="text-slate-300 hover:text-white underline text-[10px] ml-1"
                title="Mudar senha do administrador"
              >
                Trocar Senha
              </button>
              <button
                type="button"
                onClick={onLockAdmin}
                className="bg-red-500/30 hover:bg-red-500/50 text-red-200 px-1.5 py-0.2 rounded text-[10px] ml-1 transition-colors"
                title="Bloquear configurações (Sair do Modo Admin)"
              >
                Bloquear
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onUnlockAdmin}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-400/50 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors"
              title="Apenas o administrador pode alterar configurações. Clique para entrar com senha."
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Área do Administrador</span>
            </button>
          )}

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
            onClick={() => {
              if (isAdmin) {
                onOpenIntegrationModal();
              } else {
                onUnlockAdmin();
              }
            }}
            className={`inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-colors shadow-xs ${
              isConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : isOffline
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={
              isAdmin
                ? 'Clique para configurar Supabase e chaves'
                : 'Configurações restritas: clique para entrar com a senha de administrador'
            }
          >
            <Database
              className={`w-4 h-4 ${
                isConnected
                  ? 'text-emerald-600'
                  : isOffline
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }`}
            />
            <span className="hidden sm:inline">
              {isConnected
                ? 'Supabase Conectado'
                : isOffline
                ? 'Modo Local (Supabase Offline)'
                : 'Armazenamento Local'}
            </span>
            {!isAdmin && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded font-bold" title="Bloqueado para visitantes">
                <Lock className="w-2.5 h-2.5 text-slate-500" />
                Restrito
              </span>
            )}
            {isAdmin && isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
            )}
            {isAdmin && isOffline && (
              <span className="w-2 h-2 rounded-full bg-amber-500 hidden sm:inline-block" />
            )}
          </button>

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
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm sm:text-base font-black text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md hover:shadow-lg transition-all focus:ring-4 focus:ring-emerald-500/30 active:scale-95"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>+ NOVO AGENDAMENTO</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 pt-1 overflow-x-auto">
          <button
            onClick={() => onViewChange('weekly')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold border-b-2 whitespace-nowrap transition-colors ${
              currentView === 'weekly'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Grade da Semana</span>
          </button>

          <button
            onClick={() => onViewChange('daily')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold border-b-2 whitespace-nowrap transition-colors ${
              currentView === 'daily'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>Agenda de Hoje</span>
            {todayBookingsCount > 0 && (
              <span className="ml-1 px-2 py-0.2 bg-blue-100 text-blue-700 rounded-full text-xs font-black">
                {todayBookingsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onViewChange('catalog')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold border-b-2 whitespace-nowrap transition-colors ${
              currentView === 'catalog'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Equipamentos & Espaços</span>
          </button>

          <button
            onClick={() => onViewChange('stats')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold border-b-2 whitespace-nowrap transition-colors ${
              currentView === 'stats'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Painel & Banco</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
