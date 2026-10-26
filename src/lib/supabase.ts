import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Booking } from '../types';

const STORAGE_KEY_URL = 'edumidia_supabase_url';
const STORAGE_KEY_ANON = 'edumidia_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) || '' : '';

  return {
    url: storedUrl || envUrl,
    anonKey: storedKey || envKey,
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
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
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      return { success: false, message: 'URL deve começar com https://' };
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
