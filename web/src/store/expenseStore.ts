/**
 * @file expenseStore.ts — Web expense store for financial tracking
 */

import { create } from 'zustand';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string; // ISO 8601
  notes?: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'alimentacion'
  | 'transporte'
  | 'entretenimiento'
  | 'salud'
  | 'educacion'
  | 'servicios'
  | 'compras'
  | 'otros';

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

const STORAGE_KEY = 'taskflow_expenses';

interface ExpenseStore {
  expenses: Expense[];
  isLoading: boolean;

  loadExpenses: () => void;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
  deleteExpense: (id: string) => void;
}

function generateId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: [],
  isLoading: false,

  loadExpenses: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const expenses = raw ? JSON.parse(raw) : [];
      set({ expenses });
    } catch {
      set({ expenses: [] });
    }
  },

  addExpense: (data) => {
    const newExpense: Expense = {
      ...data,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    set((state) => {
      const updated = [newExpense, ...state.expenses];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { expenses: updated };
    });
  },

  deleteExpense: (id) => {
    set((state) => {
      const updated = state.expenses.filter(e => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { expenses: updated };
    });
  },
}));

export const selectExpenseStats = (state: ExpenseStore) => {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthExpenses = state.expenses.filter(e => e.date.startsWith(thisMonth));
  const totalMonth = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

  const byCategory: Record<string, number> = {};
  for (const e of monthExpenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  return { totalMonth, byCategory, monthExpenses };
};
