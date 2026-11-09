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
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'offline' | 'disconnected' | 'connecting'>('connecting');
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

  // In-app confirmation dialog (replaces window.confirm for iframe safety)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmStyle?: 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);

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
      console.warn('Erro ao salvar no localStorage:', e);
    }
  }, [bookings]);

  // Online / Offline window listeners
  useEffect(() => {
    const handleOnline = () => {
      if (isSupabaseConfigured()) {
        fetchBookingsFromSupabase().then(remoteBookings => {
          if (remoteBookings) {
            setIsSupabaseActive(true);
            setSupabaseStatus('connected');
          }
        });
      }
    };
    const handleOffline = () => {
      setIsSupabaseActive(false);
      setSupabaseStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check Supabase status and subscribe to realtime updates
  useEffect(() => {
    const configured = isSupabaseConfigured();
    if (!configured) {
      setIsSupabaseActive(false);
      setSupabaseStatus('disconnected');
      return;
    }

    setSupabaseStatus('connecting');
    let unsubscribe: (() => void) | null = null;

    fetchBookingsFromSupabase()
      .then(async remoteBookings => {
        if (remoteBookings !== null) {
          setIsSupabaseActive(true);
          setSupabaseStatus('connected');
          if (remoteBookings.length > 0) {
            setBookings(remoteBookings);
            showToast('Conectado ao Supabase! Dados sincronizados.', 'success');
          } else if (bookings.length > 0) {
            // Send initial bookings to Supabase so table has data
            await syncAllBookingsToSupabase(bookings);
          }
        } else {
          // Supabase is unreachable/offline or paused
          setIsSupabaseActive(false);
          setSupabaseStatus('offline');
          console.warn('[EduMídia] Supabase offline/inacessível no início. Operando em modo de dados local.');
        }
      })
      .catch(err => {
        setIsSupabaseActive(false);
        setSupabaseStatus('offline');
        console.warn('[EduMídia] Falha de conexão inicial com Supabase:', err);
      });

    unsubscribe = subscribeToBookingsRealtime(() => {
      fetchBookingsFromSupabase().then(remoteBookings => {
        if (remoteBookings) {
          setBookings(remoteBookings);
          showToast('Banco de dados atualizado em tempo real!', 'info');
        }
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleCredentialsUpdated = () => {
    const configured = isSupabaseConfigured();
    if (!configured) {
      setIsSupabaseActive(false);
      setSupabaseStatus('disconnected');
      return;
    }

    setSupabaseStatus('connecting');
    fetchBookingsFromSupabase().then(remoteBookings => {
      if (remoteBookings !== null) {
        setIsSupabaseActive(true);
        setSupabaseStatus('connected');
        if (remoteBookings.length > 0) {
          setBookings(remoteBookings);
          showToast('Dados do Supabase carregados com sucesso!', 'success');
        }
      } else {
        setIsSupabaseActive(false);
        setSupabaseStatus('offline');
      }
    });
  };

  // Create or Update Booking (single or multiple classes at once)
  // Local-first: immediately persists to state & LocalStorage, then syncs remotely
  const handleSaveBooking = async (saved: Booking | Booking[]) => {
    const itemsToSave = Array.isArray(saved) ? saved : [saved];
    let updatedList = [...bookings];

    for (const item of itemsToSave) {
      const existsIndex = updatedList.findIndex(b => b.id === item.id);
      if (existsIndex >= 0) {
        updatedList[existsIndex] = item;
      } else {
        updatedList.unshift(item);
      }
    }

    // 1. Immediately commit locally for instant responsiveness & reliability
    setBookings(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
    }

    // 2. Clear visual confirmation for user
    if (itemsToSave.length > 1) {
      showToast(`${itemsToSave.length} agendamentos criados com sucesso para as turmas selecionadas!`, 'success');
    } else {
      const single = itemsToSave[0];
      const isExisting = bookings.some(b => b.id === single.id);
      if (isExisting) {
        showToast(`Agendamento de ${single.teacherName} atualizado com sucesso!`, 'success');
      } else {
        showToast(`Agendamento realizado para Turma ${single.classroom} (${single.teacherName})!`, 'success');
      }
    }

    // 3. Background remote sync (failsafe, never throws or halts user experience)
    if (isSupabaseConfigured() && supabaseStatus !== 'disconnected') {
      (async () => {
        let allSuccess = true;
        for (const item of itemsToSave) {
          const res = await saveBookingToSupabase(item);
          if (!res.success) {
            allSuccess = false;
          }
        }
        if (allSuccess) {
          setIsSupabaseActive(true);
          setSupabaseStatus('connected');
        } else {
          setIsSupabaseActive(false);
          setSupabaseStatus('offline');
        }
      })().catch(err => {
        console.warn('[EduMídia] Sincronização em segundo plano adiada:', err);
      });
    }
  };

  // Update Status (agendado -> em_uso -> concluido)
  const handleUpdateStatus = (bookingId: string, newStatus: BookingStatus) => {
    const target = bookings.find(b => b.id === bookingId);
    if (!target) return;

    const updated = { ...target, status: newStatus };
    const updatedList = bookings.map(b => (b.id === bookingId ? updated : b));
    setBookings(updatedList);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Erro localStorage:', e);
    }

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

    if (isSupabaseConfigured() && supabaseStatus !== 'disconnected') {
      saveBookingToSupabase(updated).catch(err => {
        console.warn('[EduMídia] Falha silenciosa ao sincronizar status:', err);
      });
    }
  };

  // Delete Booking
  const handleDeleteBooking = async (bookingId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Agendamento',
      message: 'Tem certeza que deseja cancelar e excluir este agendamento? Esta ação não pode ser desfeita.',
      confirmText: 'Sim, Excluir',
      confirmStyle: 'danger',
      onConfirm: async () => {
        const updatedList = bookings.filter(b => b.id !== bookingId);
        setBookings(updatedList);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
        } catch (e) {
          console.warn('Erro localStorage:', e);
        }
        if (selectedBookingForDetails?.id === bookingId) {
          setSelectedBookingForDetails(null);
        }
        showToast('Agendamento excluído com sucesso.', 'info');

        if (isSupabaseConfigured() && supabaseStatus !== 'disconnected') {
          deleteBookingFromSupabase(bookingId).catch(err => {
            console.warn('[EduMídia] Falha silenciosa ao deletar remoto:', err);
          });
        }
      },
    });
  };

  // Reset to Initial Mock Data
  const handleResetData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restaurar Dados de Exemplo',
      message: 'Deseja restaurar os agendamentos e horários padrão do calendário escolar?',
      confirmText: 'Restaurar',
      confirmStyle: 'primary',
      onConfirm: () => {
        const initial = generateInitialBookings();
        setBookings(initial);
        showToast('Dados de exemplo restaurados com sucesso!', 'success');
      },
    });
  };

  // Clear All Data
  const handleClearAll = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Apagar Todos os Agendamentos',
      message: 'ATENÇÃO: Deseja apagar todos os agendamentos registrados no sistema?',
      confirmText: 'Apagar Tudo',
      confirmStyle: 'danger',
      onConfirm: () => {
        setBookings([]);
        showToast('Todos os agendamentos foram removidos.', 'info');
      },
    });
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
        supabaseStatus={supabaseStatus}
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

      {/* In-App Confirmation Dialog (Replaces window.confirm for iframe safety) */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    confirmDialog.confirmStyle === 'danger'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {confirmDialog.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-1">
                {confirmDialog.message}
              </p>
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const action = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    action();
                  }}
                  className={`px-4 py-2 text-xs sm:text-sm font-bold text-white rounded-xl shadow-xs transition-colors ${
                    confirmDialog.confirmStyle === 'danger'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {confirmDialog.confirmText || 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
