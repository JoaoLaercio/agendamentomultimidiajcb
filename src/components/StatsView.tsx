import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  GraduationCap,
  HardDrive,
  RefreshCw,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Database,
  Cloud,
  GitBranch,
} from 'lucide-react';
import { Booking, Resource } from '../types';
import { ResourceIcon } from './ResourceIcon';

interface StatsViewProps {
  bookings: Booking[];
  resources: Resource[];
  onOpenIntegrationModal: () => void;
  onResetData: () => void;
  onClearAll: () => void;
  onExportJSON: () => void;
  isSupabaseActive: boolean;
}

export const StatsView: React.FC<StatsViewProps> = ({
  bookings,
  resources,
  onOpenIntegrationModal,
  onResetData,
  onClearAll,
  onExportJSON,
  isSupabaseActive,
}) => {
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter(b => b.status === 'em_uso').length;
  const completedBookings = bookings.filter(b => b.status === 'concluido').length;
  const scheduledBookings = bookings.filter(b => b.status === 'agendado').length;

  // Resource tally
  const resourceCounts = resources.map(res => {
    const count = bookings.filter(b => b.resourceIds.includes(res.id)).length;
    return {
      resource: res,
      count,
    };
  }).sort((a, b) => b.count - a.count);

  // Shift tally
  const shiftCounts = {
    matutino: bookings.filter(b => b.shift === 'matutino').length,
    vespertino: bookings.filter(b => b.shift === 'vespertino').length,
    noturno: bookings.filter(b => b.shift === 'noturno').length,
  };

  // Top teachers
  const teacherMap: Record<string, number> = {};
  bookings.forEach(b => {
    teacherMap[b.teacherName] = (teacherMap[b.teacherName] || 0) + 1;
  });
  const topTeachers = Object.entries(teacherMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Integration Status Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold tracking-tight">
                Status de Integração & Banco de Dados
              </h3>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  isSupabaseActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                }`}
              >
                {isSupabaseActive ? 'Supabase Conectado' : 'Armazenamento Local Ativo'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Pronto para integração com <strong>GitHub</strong>, <strong>Vercel</strong> e{' '}
              <strong>Supabase</strong> PostgreSQL.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenIntegrationModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
        >
          <Cloud className="w-4 h-4" />
          Configurar Supabase & Deploy
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total de Agendamentos
          </span>
          <div className="text-2xl font-black text-slate-900">{totalBookings}</div>
          <span className="text-xs text-slate-500 mt-1 block">Registrados no sistema</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
            Equipamentos em Uso
          </span>
          <div className="text-2xl font-black text-amber-700">{activeBookings}</div>
          <span className="text-xs text-amber-600/80 mt-1 block">Retirados nas salas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
            Devolvidos / Concluídos
          </span>
          <div className="text-2xl font-black text-emerald-700">{completedBookings}</div>
          <span className="text-xs text-emerald-600/80 mt-1 block">Aulas finalizadas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Próximos Agendados
          </span>
          <div className="text-2xl font-black text-blue-700">{scheduledBookings}</div>
          <span className="text-xs text-blue-600/80 mt-1 block">Na fila de atendimento</span>
        </div>
      </div>

      {/* Two Column Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Requested Resources */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Recursos Mais Requisitados
            </h4>
            <span className="text-xs text-slate-400 font-medium">Classificação</span>
          </div>

          <div className="space-y-3">
            {resourceCounts.map(({ resource, count }) => {
              const percentage = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
              return (
                <div key={resource.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2 text-slate-800">
                      <ResourceIcon id={resource.id} className="w-4 h-4 text-slate-500" />
                      <span>{resource.name}</span>
                    </div>
                    <span className="text-slate-600">
                      <strong>{count}</strong> {count === 1 ? 'reserva' : 'reservas'} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Turnos & Professores Mais Ativos */}
        <div className="space-y-6">
          {/* Turno Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Distribuição por Turno
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-xs font-bold text-amber-800">Matutino</div>
                <div className="text-xl font-extrabold text-amber-900 mt-1">
                  {shiftCounts.matutino}
                </div>
              </div>

              <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                <div className="text-xs font-bold text-orange-800">Vespertino</div>
                <div className="text-xl font-extrabold text-orange-900 mt-1">
                  {shiftCounts.vespertino}
                </div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                <div className="text-xs font-bold text-indigo-800">Noturno</div>
                <div className="text-xl font-extrabold text-indigo-900 mt-1">
                  {shiftCounts.noturno}
                </div>
              </div>
            </div>
          </div>

          {/* Top Teachers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-blue-600" />
              Professores com Mais Agendamentos
            </h4>

            {topTeachers.length === 0 ? (
              <p className="text-xs text-slate-400">Nenhum registro encontrado.</p>
            ) : (
              <div className="space-y-2">
                {topTeachers.map(([teacher, count], idx) => (
                  <div
                    key={teacher}
                    className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 font-semibold text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{teacher}</span>
                    </div>
                    <span className="font-bold text-blue-700">
                      {count} {count === 1 ? 'aula' : 'aulas'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backup and Maintenance Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h4 className="text-sm font-extrabold text-slate-900 mb-2">
          Gerenciamento de Dados & Backup
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          Exporte os agendamentos escolares em formato JSON para cópia de segurança ou restaure o
          estado inicial da demonstração pedagógica.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onExportJSON}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Baixar Backup (JSON)
          </button>

          <button
            onClick={onResetData}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restaurar Dados de Exemplo
          </button>

          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar Todos os Agendamentos
          </button>
        </div>
      </div>
    </div>
  );
};
