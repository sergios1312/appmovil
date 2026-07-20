/**
 * @file expenseStore.ts — Store de gastos con Supabase + Realtime (paridad con la web).
 * MIGRACIÓN: AsyncStorage local → Supabase (tabla expenses), sincronizado con la web.
 */

import { create } from 'zustand';
import uuid from 'react-native-uuid';
import { supabase } from '@/infrastructure/database/supabase';
import { useAuthStore } from '@/presentation/store/authStore';

export interface Expense {
  id: string;
  user_id?: string;
  title: string;
  amount: number;
  category: string;
  date: string; // ISO 8601
  notes?: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'alimentacion' | 'transporte' | 'entretenimiento' | 'salud'
  | 'educacion' | 'servicios' | 'compras' | 'otros';

export const EXPENSE_CATEGORIES: { key: ExpenseCategory; label: string; emoji: string }[] = [
  { key: 'alimentacion', label: 'Alimentación', emoji: '🍔' },
  { key: 'transporte', label: 'Transporte', emoji: '🚗' },
  { key: 'entretenimiento', label: 'Entretenimiento', emoji: '🎬' },
  { key: 'salud', label: 'Salud', emoji: '💊' },
  { key: 'educacion', label: 'Educación', emoji: '📚' },
  { key: 'servicios', label: 'Servicios', emoji: '💡' },
  { key: 'compras', label: 'Compras', emoji: '🛍️' },
  { key: 'otros', label: 'Otros', emoji: '📦' },
];

function generateId(): string {
  return String(uuid.v4());
}

function getUserId(): string {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('No hay usuario autenticado');
  return user.id;
}

interface ExpenseStore {
  expenses: Expense[];
  isLoading: boolean;

  loadExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'user_id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
}

let expenseChannel: ReturnType<typeof supabase.channel> | null = null;

export const useExpenseStore = create<ExpenseStore>((set, get) => ({
  expenses: [],
  isLoading: false,

  loadExpenses: async () => {
    set({ isLoading: true });
    try {
      const userId = getUserId();
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw error;
      set({ expenses: data ?? [], isLoading: false });
    } catch (err) {
      console.error('[ExpenseStore] loadExpenses:', err);
      set({ expenses: [], isLoading: false });
    }
  },

  addExpense: async (data) => {
    try {
      const userId = getUserId();
      const newExpense = {
        id: generateId(),
        user_id: userId,
        title: data.title,
        amount: data.amount,
        category: data.category,
        date: data.date,
        notes: data.notes || null,
        created_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('expenses').insert(newExpense);
      if (error) throw error;
      set((state) => ({ expenses: [newExpense as Expense, ...state.expenses] }));
    } catch (err) {
      console.error('[ExpenseStore] addExpense:', err);
      throw err;
    }
  },

  deleteExpense: async (id) => {
    try {
      const userId = getUserId();
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
    } catch (err) {
      console.error('[ExpenseStore] deleteExpense:', err);
    }
  },

  subscribeToRealtime: () => {
    const user = useAuthStore.getState().user;
    if (!user || expenseChannel) return;

    expenseChannel = supabase
      .channel('expenses-realtime-mobile')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newExp = payload.new as Expense;
            set((state) =>
              state.expenses.some((e) => e.id === newExp.id)
                ? state
                : { expenses: [newExp, ...state.expenses] }
            );
          }
          if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as Record<string, unknown>).id as string;
            set((state) => ({ expenses: state.expenses.filter((e) => e.id !== deletedId) }));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (expenseChannel) {
            supabase.removeChannel(expenseChannel);
            expenseChannel = null;
          }
          setTimeout(() => {
            if (!expenseChannel && useAuthStore.getState().user) get().subscribeToRealtime();
          }, 3000);
        }
      });
  },

  unsubscribeFromRealtime: () => {
    if (expenseChannel) {
      supabase.removeChannel(expenseChannel);
      expenseChannel = null;
    }
  },
}));

export const selectExpenseStats = (state: ExpenseStore) => {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthExpenses = state.expenses.filter((e) => e.date.startsWith(thisMonth));
  const totalMonth = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

  const byCategory: Record<string, number> = {};
  for (const e of monthExpenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }
  return { totalMonth, byCategory, monthExpenses };
};
