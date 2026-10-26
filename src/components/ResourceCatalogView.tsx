import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Plus,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Booking, Resource } from '../types';
import { ResourceIcon } from './ResourceIcon';
import { formatDateBR } from '../utils/dateUtils';

interface ResourceCatalogViewProps {
  resources: Resource[];
  bookings: Booking[];
  onNewBookingForResource: (resourceId: string) => void;
  onSelectBooking: (booking: Booking) => void;
}

export const ResourceCatalogView: React.FC<ResourceCatalogViewProps> = ({
  resources,
  bookings,
  onNewBookingForResource,
  onSelectBooking,
}) => {
  // Sort resources: Equipment first, then Spaces
  const equipmentList = resources.filter(r => r.category === 'equipment');
  const spaceList = resources.filter(r => r.category === 'space');

  const renderResourceCard = (res: Resource) => {
    // Find active and upcoming bookings for this resource
    const resourceBookings = bookings
      .filter(b => b.status !== 'cancelado' && b.resourceIds.includes(res.id))
      .slice(0, 3);

    const activeNow = bookings.filter(
      b => b.status === 'em_uso' && b.resourceIds.includes(res.id)
    ).length;

    return (
      <div
        key={res.id}
        className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
      >
        <div className="p-5">
          {/* Card Top */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <ResourceIcon id={res.id} className="w-6 h-6" />
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-800 block">
                {res.category === 'space' ? 'Espaço Escolar' : 'Equipamento'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {res.category === 'space'
                  ? 'Capacidade Única'
                  : `Total: ${res.totalQuantity} unidades`}
              </span>
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="text-base font-extrabold text-slate-900 mb-1">
            {res.name}
          </h3>
          <p className="text-xs text-slate-600 line-clamp-2 mb-3">
            {res.description}
          </p>

          {/* Location & Rules Info */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {res.location && (
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{res.location}</span>
              </div>
            )}
            {res.rules && (
              <div className="flex items-start gap-1.5 text-slate-500 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{res.rules}</span>
              </div>
            )}
          </div>

          {/* Upcoming Reservations Snippet */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Próximos Agendamentos ({resourceBookings.length}):
            </span>
            {resourceBookings.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-1">
                Nenhum agendamento pendente. Livre para uso!
              </div>
            ) : (
              <div className="space-y-1.5">
                {resourceBookings.map(b => (
                  <div
                    key={b.id}
                    onClick={() => onSelectBooking(b)}
                    className="p-1.5 bg-slate-50 hover:bg-blue-50 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors border border-slate-100"
                  >
                    <div className="truncate font-medium text-slate-800">
                      <span className="font-bold text-blue-700">{formatDateBR(b.date)}:</span> {b.teacherName} ({b.classroom})
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                      {b.periods[0]?.split('(')[0].trim()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card Footer */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] font-semibold text-slate-600">
            {activeNow > 0 ? (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                {activeNow} em uso agora
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Disponível
              </span>
            )}
          </div>

          <button
            onClick={() => onNewBookingForResource(res.id)}
            className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Agendar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-teal-300" />
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Catálogo de Mídias e Espaços Pedagógicos
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-blue-200 max-w-2xl">
            Acompanhe a disponibilidade, regras de conservação e localização física dos 8 recursos
            principais da escola. Clique em &quot;Agendar&quot; para reservar com detecção automática de conflitos.
          </p>
        </div>
      </div>

      {/* Equipment Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <h3 className="text-base font-extrabold text-slate-900">
            Equipamentos Multimídia ({equipmentList.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Data Show, Cabos, TV, Caixa de Som e Chromebooks
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipmentList.map(renderResourceCard)}
        </div>
      </div>

      {/* Spaces Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <div className="w-3 h-3 rounded-full bg-teal-600"></div>
          <h3 className="text-base font-extrabold text-slate-900">
            Ambientes e Espaços Escolares ({spaceList.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Biblioteca, Pátio Central e Labin (Laboratório de Informática)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaceList.map(renderResourceCard)}
        </div>
      </div>
    </div>
  );
};
