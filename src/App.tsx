import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, Resource } from './types';
import { INITIAL_RESOURCES, generateInitialBookings } from './data/initialData';
import { Header } from './components/Header';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { DailyAgendaView } from './components/DailyAgendaView';
import { ResourceCatalogView } from './components/ResourceCatalogView';
import { StatsView } from './components/StatsView';
import { BookingModal } from './components/BookingModal';
import { BookingDetailsModal } from './components/BookingDetailsModal';
import { PrintScheduleModal } from './components/PrintScheduleModal';
import { IntegrationModal } from './components/IntegrationModal';
import {
  fetchBookingsFromSupabase,
  isSupabaseConfigured,
  saveBookingToSupabase,
  deleteBookingFromSupabase,
  subscribeToBookingsRealtime,
  syncAllBookingsToSupabase,
} from './lib/supabase';
import { toISODateString } from './utils/dateUtils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'edumidia_bookings_data';

export default function App() {
  const [resources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Falha ao ler dados locais:', e);
    }
    return generateInitialBookings();
  });

  const [currentView, setCurrentView] = useState<'weekly' | 'daily' | 'catalog' | 'stats'>('weekly');
  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(false);

  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);
  const [defaultDateForNewBooking, setDefaultDateForNewBooking] = useState<string | undefined>(undefined);
  const [defaultResourceForNewBooking, setDefaultResourceForNewBooking] = useState<string | undefined>(undefined);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [bookingForVoucher, setBookingForVoucher] = useState<Booking | null>(null);

  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookings));
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
    }
  }, [bookings]);

  // Check Supabase status and subscribe to realtime updates
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsSupabaseActive(configured);

    let unsubscribe: (() => void) | null = null;

    if (configured) {
      fetchBookingsFromSupabase().then(async remoteBookings => {
        if (remoteBookings && remoteBookings.length > 0) {
          setBookings(remoteBookings);
          showToast('Sincronizado com Supabase em tempo real!', 'success');
        } else if (remoteBookings && remoteBookings.length === 0 && bookings.length > 0) {
          // Send initial bookings to Supabase so table has data
          await syncAllBookingsToSupabase(bookings);
          showToast('Agendamentos salvos no seu Supabase!', 'success');
        }
      });

      unsubscribe = subscribeToBookingsRealtime(() => {
        fetchBookingsFromSupabase().then(remoteBookings => {
          if (remoteBookings) {
            setBookings(remoteBookings);
            showToast('Banco de dados atualizado em tempo real!', 'info');
          }
        });
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSupabaseActive]);

  const handleCredentialsUpdated = () => {
    const configured = isSupabaseConfigured();
    setIsSupabaseActive(configured);
    if (configured) {
      fetchBookingsFromSupabase().then(remoteBookings => {
        if (remoteBookings && remoteBookings.length > 0) {
          setBookings(remoteBookings);
          showToast('Dados do Supabase carregados com sucesso!', 'success');
        }
      });
    }
  };

  // Create or Update Booking
  const handleSaveBooking = async (savedBooking: Booking) => {
    const exists = bookings.some(b => b.id === savedBooking.id);
    let updatedList: Booking[];

    if (exists) {
      updatedList = bookings.map(b => (b.id === savedBooking.id ? savedBooking : b));
      showToast(`Agendamento de ${savedBooking.teacherName} atualizado com sucesso!`, 'success');
    } else {
      updatedList = [savedBooking, ...bookings];
      showToast(`Agendamento realizado para ${savedBooking.classroom} (${savedBooking.teacherName})!`, 'success');
    }

    setBookings(updatedList);

    // Sync with Supabase if active
    if (isSupabaseActive) {
      saveBookingToSupabase(savedBooking);
    }
  };

  // Update Status (agendado -> em_uso -> concluido)
  const handleUpdateStatus = (bookingId: string, newStatus: BookingStatus) => {
    const target = bookings.find(b => b.id === bookingId);
    if (!target) return;

    const updated = { ...target, status: newStatus };
    const updatedList = bookings.map(b => (b.id === bookingId ? updated : b));
    setBookings(updatedList);

    if (selectedBookingForDetails?.id === bookingId) {
      setSelectedBookingForDetails(updated);
    }

    const statusLabels: Record<BookingStatus, string> = {
      agendado: 'Agendado',
      em_uso: 'Em uso (Equipamento Retirado)',
      concluido: 'Concluído (Equipamento Devolvido)',
      cancelado: 'Cancelado',
    };

    showToast(`Status alterado: ${statusLabels[newStatus]}`, 'info');

    if (isSupabaseActive) {
      saveBookingToSupabase(updated);
    }
  };

  // Delete Booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('Tem certeza que deseja cancelar e excluir este agendamento?')) {
      const updatedList = bookings.filter(b => b.id !== bookingId);
      setBookings(updatedList);
      if (selectedBookingForDetails?.id === bookingId) {
        setSelectedBookingForDetails(null);
      }
      showToast('Agendamento excluído com sucesso.', 'info');

      if (isSupabaseActive) {
        deleteBookingFromSupabase(bookingId);
      }
    }
  };

  // Reset to Initial Mock Data
  const handleResetData = () => {
    if (window.confirm('Restaurar dados de exemplo do calendário escolar?')) {
      const initial = generateInitialBookings();
      setBookings(initial);
      showToast('Dados de exemplo restaurados com sucesso!', 'success');
    }
  };

  // Clear All Data
  const handleClearAll = () => {
    if (window.confirm('ATENÇÃO: Deseja apagar todos os agendamentos registrados?')) {
      setBookings([]);
      showToast('Todos os agendamentos foram removidos.', 'info');
    }
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bookings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `edumidia-agendamentos-${toISODateString(new Date())}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Arquivo de backup exportado com sucesso!', 'success');
  };

  // Modal triggers
  const handleOpenNewBooking = (date?: string, resourceId?: string) => {
    setBookingToEdit(null);
    setDefaultDateForNewBooking(date);
    setDefaultResourceForNewBooking(resourceId);
    setIsBookingModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBookingForDetails(null);
    setBookingToEdit(booking);
    setIsBookingModalOpen(true);
  };

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBookingForDetails(booking);
  };

  const handlePrintVoucher = (booking: Booking) => {
    setBookingForVoucher(booking);
    setIsPrintModalOpen(true);
  };

  const todayStr = toISODateString(new Date());
  const todayBookingsCount = bookings.filter(b => b.date === todayStr && b.status !== 'cancelado').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 animate-in slide-in-from-bottom-3 duration-200 text-xs sm:text-sm font-semibold">
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenNewBooking={() => handleOpenNewBooking()}
        onOpenPrintModal={() => {
          setBookingForVoucher(null);
          setIsPrintModalOpen(true);
        }}
        onOpenIntegrationModal={() => setIsIntegrationModalOpen(true)}
        isSupabaseActive={isSupabaseActive}
        totalBookingsCount={bookings.length}
        todayBookingsCount={todayBookingsCount}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'weekly' && (
          <WeeklyScheduleView
            bookings={bookings}
            resources={resources}
            onSelectBooking={handleSelectBooking}
            onNewBookingWithDate={date => handleOpenNewBooking(date)}
          />
        )}

        {currentView === 'daily' && (
          <DailyAgendaView
            bookings={bookings}
            resources={resources}
            onSelectBooking={handleSelectBooking}
            onUpdateStatus={handleUpdateStatus}
            onNewBookingWithDate={date => handleOpenNewBooking(date)}
          />
        )}

        {currentView === 'catalog' && (
          <ResourceCatalogView
            resources={resources}
            bookings={bookings}
            onNewBookingForResource={resId => handleOpenNewBooking(undefined, resId)}
            onSelectBooking={handleSelectBooking}
          />
        )}

        {currentView === 'stats' && (
          <StatsView
            bookings={bookings}
            resources={resources}
            onOpenIntegrationModal={() => setIsIntegrationModalOpen(true)}
            onResetData={handleResetData}
            onClearAll={handleClearAll}
            onExportJSON={handleExportJSON}
            isSupabaseActive={isSupabaseActive}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>EduMídia</strong> • Sistema Escolar de Agendamento Multimídia e Espaços Pedagógicos
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsIntegrationModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              GitHub • Vercel • Supabase
            </button>
            <span>•</span>
            <span>Versão 1.0</span>
          </div>
        </div>
      </footer>

      {/* Booking Form Modal (Create / Edit) */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSave={handleSaveBooking}
        resources={resources}
        existingBookings={bookings}
        bookingToEdit={bookingToEdit}
        defaultDate={defaultDateForNewBooking}
        defaultResourceId={defaultResourceForNewBooking}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBookingForDetails}
        isOpen={Boolean(selectedBookingForDetails)}
        onClose={() => setSelectedBookingForDetails(null)}
        resources={resources}
        onEdit={handleEditBooking}
        onDelete={handleDeleteBooking}
        onUpdateStatus={handleUpdateStatus}
        onPrintVoucher={handlePrintVoucher}
      />

      {/* Print Schedule & Voucher Modal */}
      <PrintScheduleModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        bookings={bookings}
        resources={resources}
        selectedBookingForVoucher={bookingForVoucher}
      />

      {/* Supabase, GitHub & Vercel Integration Modal */}
      <IntegrationModal
        isOpen={isIntegrationModalOpen}
        onClose={() => setIsIntegrationModalOpen(false)}
        onCredentialsUpdated={handleCredentialsUpdated}
        bookings={bookings}
        onBookingsUpdated={setBookings}
      />
    </div>
  );
}
