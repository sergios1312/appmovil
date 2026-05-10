import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { useExpenseStore } from '@/store/expenseStore';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { TasksPage } from '@/pages/TasksPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AuthCallback } from '@/pages/AuthCallback';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authStore = useAuthStore();

  if (authStore.status === 'loading') {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <span style={{ color: 'var(--text-secondary)' }}>Cargando...</span>
      </div>
    );
  }

  if (!authStore.accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Hook para inicializar datos y suscripciones Realtime
 * cuando el usuario está autenticado.
 */
function useRealtimeSync() {
  const user = useAuthStore((s) => s.user);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const subscribeToTasksRealtime = useTaskStore((s) => s.subscribeToRealtime);
  const unsubscribeFromTasksRealtime = useTaskStore((s) => s.unsubscribeFromRealtime);
  const loadExpenses = useExpenseStore((s) => s.loadExpenses);
  const subscribeToExpensesRealtime = useExpenseStore((s) => s.subscribeToRealtime);
  const unsubscribeFromExpensesRealtime = useExpenseStore((s) => s.unsubscribeFromRealtime);

  useEffect(() => {
    if (!user) return;

    // Cargar datos iniciales
    void loadTasks();
    void loadExpenses();

    // Suscribirse a Realtime
    subscribeToTasksRealtime();
    subscribeToExpensesRealtime();

    return () => {
      unsubscribeFromTasksRealtime();
      unsubscribeFromExpensesRealtime();
    };
  }, [user?.id]);
}

export default function App() {
  const authStore = useAuthStore();

  useEffect(() => {
    authStore.restoreSession();
  }, []);

  // Activar Realtime sync cuando hay usuario
  useRealtimeSync();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
