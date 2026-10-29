import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Booking } from '../types';

const STORAGE_KEY_URL = 'edumidia_supabase_url';
const STORAGE_KEY_ANON = 'edumidia_supabase_anon_key';
export const DEFAULT_URL = 'https://mgxjjybtojprstdgiluj.supabase.co';
export const DEFAULT_ANON_KEY = 'sb_publishable_Vn5vcxsRUbBwbrqFuULLQA_1m8B5PGo';

export function normalizeSupabaseUrl(input: string): string {
  let trimmed = input.trim();
  if (!trimmed) return '';

  // If user pasted dashboard link: https://supabase.com/dashboard/project/<ref>
  const dashboardMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Remove trailing /rest/v1 or trailing slashes
  trimmed = trimmed.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

  // If user pasted just project ref (e.g. 20 lowercase letters)
  if (!trimmed.includes('.') && !trimmed.includes('/') && trimmed.length >= 10) {
    return `https://${trimmed}.supabase.co`;
  }

  // If user typed without https://
  if (trimmed.includes('.supabase.co') && !trimmed.startsWith('http')) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) || '' : '';

  return {
    url: normalizeSupabaseUrl(storedUrl || envUrl || DEFAULT_URL),
    anonKey: storedKey || envKey || DEFAULT_ANON_KEY,
  };
}

export function saveSupabaseCredentials(rawUrl: string, rawAnonKey: string): void {
  const url = normalizeSupabaseUrl(rawUrl);
  const anonKey = rawAnonKey.trim() || DEFAULT_ANON_KEY;

  if (typeof window !== 'undefined') {
    if (url.trim()) {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
    }

    if (anonKey.trim()) {
      localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_ANON);
    }
  }
  cachedClient = null; // reset cached client
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export async function testSupabaseConnection(
  rawUrl: string,
  rawAnonKey: string
): Promise<{ success: boolean; message: string; normalizedUrl?: string }> {
  try {
    const url = normalizeSupabaseUrl(rawUrl);
    const anonKey = rawAnonKey.trim() || DEFAULT_ANON_KEY;

    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      return {
        success: false,
        message: 'Por favor, informe a Project URL do Supabase (ex: https://seu-projeto.supabase.co ou o link do dashboard)',
      };
    }
    const client = createClient(url, anonKey);
    const { data, error } = await client.from('resources').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message:
            'Conectado com sucesso ao Supabase! Mas a tabela "resources" ainda não existe. Execute o script SQL no Supabase para criá-la.',
        };
      }
      return { success: false, message: `Erro ao testar: ${error.message}` };
    }

    return {
      success: true,
      message: 'Conectado com sucesso ao Supabase! Tabelas prontas para sincronização.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro de conexão: ${err?.message || 'Falha de rede'}`,
    };
  }
}

export async function fetchBookingsFromSupabase(): Promise<Booking[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('bookings')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.warn('Erro ao buscar do Supabase:', error.message);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      teacherName: row.teacher_name,
      classroom: row.classroom,
      date: row.date,
      dayOfWeek: row.day_of_week,
      shift: row.shift,
      periods: Array.isArray(row.periods) ? row.periods : [],
      startTime: row.start_time,
      endTime: row.end_time,
      resourceIds: Array.isArray(row.resource_ids) ? row.resource_ids : [],
      resourceDetails: row.resource_details || {},
      theme: row.theme,
      observations: row.observations || '',
      status: row.status,
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.error('Falha ao sincronizar com Supabase:', err);
    return null;
  }
}

export async function saveBookingToSupabase(booking: Booking): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: booking.id,
      teacher_name: booking.teacherName,
      classroom: booking.classroom,
      date: booking.date,
      day_of_week: booking.dayOfWeek,
      shift: booking.shift,
      periods: booking.periods,
      start_time: booking.startTime || null,
      end_time: booking.endTime || null,
      resource_ids: booking.resourceIds,
      resource_details: booking.resourceDetails || {},
      theme: booking.theme,
      observations: booking.observations || null,
      status: booking.status,
      created_at: booking.createdAt,
    };

    const { error } = await client.from('bookings').upsert(payload);
    if (error) {
      console.error('Erro ao salvar no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao salvar no Supabase:', err);
    return false;
  }
}

export async function deleteBookingFromSupabase(bookingId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('bookings').delete().eq('id', bookingId);
    if (error) {
      console.error('Erro ao deletar do Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao deletar do Supabase:', err);
    return false;
  }
}

export async function syncAllBookingsToSupabase(
  bookings: Booking[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, error: 'Cliente Supabase não configurado' };
  }

  try {
    const payload = bookings.map(booking => ({
      id: booking.id,
      teacher_name: booking.teacherName,
      classroom: booking.classroom,
      date: booking.date,
      day_of_week: booking.dayOfWeek,
      shift: booking.shift,
      periods: booking.periods,
      start_time: booking.startTime || null,
      end_time: booking.endTime || null,
      resource_ids: booking.resourceIds,
      resource_details: booking.resourceDetails || {},
      theme: booking.theme,
      observations: booking.observations || null,
      status: booking.status,
      created_at: booking.createdAt,
    }));

    const { error } = await client.from('bookings').upsert(payload, { onConflict: 'id' });
    if (error) {
      return { success: false, count: 0, error: error.message };
    }
    return { success: true, count: payload.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Erro inesperado' };
  }
}

export function subscribeToBookingsRealtime(
  onDataChange: () => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          onDataChange();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription not supported or failed:', err);
    return null;
  }
}

