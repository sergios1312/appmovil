/**
 * @file weightStore.ts — Store de peso corporal con Supabase + Realtime (paridad con la web).
 * Tabla: body_weight_logs (logged_at editable, created_at auditoría).
 */

import { create } from 'zustand';
import uuid from 'react-native-uuid';
import { supabase } from '@/infrastructure/database/supabase';
import { useAuthStore } from '@/presentation/store/authStore';

export interface WeightLog {
  id: string;
  user_id?: string;
  weight_kg: number;
  logged_at: string; // ISO 8601
  created_at: string;
}

function generateId(): string {
  return String(uuid.v4());
}

function getUserId(): string {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('No hay usuario autenticado');
  return user.id;
}

// PostgREST puede devolver numeric como string; normalizamos a number.
function normalize(row: Record<string, unknown>): WeightLog {
  return { ...(row as unknown as WeightLog), weight_kg: Number(row.weight_kg) };
}

function sortByLoggedAt(list: WeightLog[]): WeightLog[] {
  return [...list].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
  );
}

interface WeightStore {
  weights: WeightLog[];
  isLoading: boolean;

  loadWeights: () => Promise<void>;
  addWeight: (data: { weight_kg: number; logged_at: string }) => Promise<void>;
  updateWeight: (id: string, data: { weight_kg?: number; logged_at?: string }) => Promise<void>;
  deleteWeight: (id: string) => Promise<void>;

  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
}

let weightChannel: ReturnType<typeof supabase.channel> | null = null;

export const useWeightStore = create<WeightStore>((set, get) => ({
  weights: [],
  isLoading: false,

  loadWeights: async () => {
    set({ isLoading: true });
    try {
      const userId = getUserId();
      const { data, error } = await supabase
        .from('body_weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      set({ weights: (data ?? []).map(normalize), isLoading: false });
    } catch (err) {
      console.error('[WeightStore] loadWeights:', err);
      set({ weights: [], isLoading: false });
    }
  },

  addWeight: async ({ weight_kg, logged_at }) => {
    try {
      const userId = getUserId();
      const row: WeightLog = {
        id: generateId(),
        user_id: userId,
        weight_kg,
        logged_at,
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('body_weight_logs').insert(row);
      if (error) throw error;
      set((state) => ({ weights: sortByLoggedAt([row, ...state.weights]) }));
    } catch (err) {
      console.error('[WeightStore] addWeight:', err);
      throw err;
    }
  },

  updateWeight: async (id, data) => {
    try {
      const userId = getUserId();
      const { error } = await supabase
        .from('body_weight_logs')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      set((state) => ({
        weights: sortByLoggedAt(state.weights.map((w) => (w.id === id ? { ...w, ...data } : w))),
      }));
    } catch (err) {
      console.error('[WeightStore] updateWeight:', err);
      throw err;
    }
  },

  deleteWeight: async (id) => {
    try {
      const userId = getUserId();
      const { error } = await supabase
        .from('body_weight_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      set((state) => ({ weights: state.weights.filter((w) => w.id !== id) }));
    } catch (err) {
      console.error('[WeightStore] deleteWeight:', err);
    }
  },

  subscribeToRealtime: () => {
    const user = useAuthStore.getState().user;
    if (!user || weightChannel) return;

    weightChannel = supabase
      .channel('body-weight-realtime-mobile')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'body_weight_logs', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = normalize(payload.new);
            set((state) =>
              state.weights.some((w) => w.id === row.id)
                ? state
                : { weights: sortByLoggedAt([row, ...state.weights]) }
            );
          }
          if (payload.eventType === 'UPDATE') {
            const row = normalize(payload.new);
            set((state) => ({
              weights: sortByLoggedAt(state.weights.map((w) => (w.id === row.id ? row : w))),
            }));
          }
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as Record<string, unknown>).id as string;
            set((state) => ({ weights: state.weights.filter((w) => w.id !== deletedId) }));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (weightChannel) {
            supabase.removeChannel(weightChannel);
            weightChannel = null;
          }
          setTimeout(() => {
            if (!weightChannel && useAuthStore.getState().user) get().subscribeToRealtime();
          }, 3000);
        }
      });
  },

  unsubscribeFromRealtime: () => {
    if (weightChannel) {
      supabase.removeChannel(weightChannel);
      weightChannel = null;
    }
  },
}));

/** El registro más reciente (la lista se mantiene ordenada desc por logged_at). */
export const selectLatestWeight = (state: WeightStore): WeightLog | null =>
  state.weights[0] ?? null;
