import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { TasksPage } from '@/pages/TasksPage';
import { CalendarPage } from '@/pages/CalendarPage';
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

export default function App() {
  const authStore = useAuthStore();

  useEffect(() => {
    authStore.restoreSession();
  }, []);

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
