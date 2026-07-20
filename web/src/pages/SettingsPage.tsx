import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import {
  IoKeyOutline,
  IoSyncOutline,
  IoMoonOutline,
  IoInformationCircleOutline,
  IoLogOutOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5';

export function SettingsPage() {
  const authStore = useAuthStore();
  const taskStore = useTaskStore();

  const handleSync = async () => {
    if (!authStore.accessToken) {
      alert('Debes iniciar sesión para sincronizar.');
      return;
    }
    await taskStore.loadTasks();
    alert('Datos recargados desde Supabase.');
  };

  const handleSeedRoutines = async () => {
    if (!authStore.user) return;
    if (confirm('¿Estás seguro de que deseas generar las rutinas diarias? (Esto agregará tareas a tu cuenta)')) {
      import('@/utils/seedRoutines').then(async ({ seedDailyRoutines }) => {
        try {
          await seedDailyRoutines(taskStore.addTask);
          alert('Rutinas generadas exitosamente. Revisa tu lista de tareas.');
        } catch (error) {
          console.error(error);
          alert('Error al generar las rutinas.');
        }
      });
    }
  };

  const handleResetRoutines = async () => {
    if (!authStore.user) return;
    if (!confirm('⚠️ Esto eliminará TODAS tus rutinas actuales y las recreará correctamente para hoy. ¿Continuar?')) return;

    try {
      // 1. Eliminar todas las tareas de tipo rutina/habit_group de la BD
      const routineTasks = taskStore.tasks.filter(
        (t) => t.task_type === 'routine' || t.task_type === 'habit_group'
      );
      for (const t of routineTasks) {
        await taskStore.deleteTask(t.id);
      }

      // 2. Limpiar el flag del día para forzar re-proceso
      localStorage.removeItem('taskflow_recurrence_date');

      // 3. Re-seedear rutinas desde cero
      const { seedDailyRoutines } = await import('@/utils/seedRoutines');
      await seedDailyRoutines(taskStore.addTask);

      // 4. Recargar tareas
      await taskStore.loadTasks();
      alert('✅ Rutinas reiniciadas correctamente.');
    } catch (error) {
      console.error(error);
      alert('Error al reiniciar las rutinas.');
    }
  };

  const handleSignOut = () => {
    if (confirm('Estas seguro de que deseas cerrar sesion?')) {
      authStore.signOut();
      window.location.href = '/login';
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Ajustes</h2>
      </div>

      {authStore.user && (
        <div className="profile-card">
          {authStore.user.avatar_url ? (
            <img src={authStore.user.avatar_url} alt={authStore.user.name} />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 20, color: 'var(--bg)',
            }}>
              {authStore.user.name[0]?.toUpperCase()}
            </div>
          )}
          <div className="profile-info">
            <div className="profile-name">{authStore.user.name}</div>
            <div className="profile-email">{authStore.user.email}</div>
            <div className="sync-badge">
              <IoCheckmarkCircle size={14} /> Google conectado
            </div>
          </div>
        </div>
      )}

      <div className="settings-group">
        <div className="setting-row">
          <div className="setting-left">
            <span className="setting-icon"><IoKeyOutline size={18} /></span>
            <span className="setting-label">Cuenta de Google</span>
          </div>
          <span className="setting-value">{authStore.user?.email ?? 'No conectado'}</span>
        </div>

        <div className="setting-row" onClick={handleSync} style={{ cursor: 'pointer' }}>
          <div className="setting-left">
            <span className="setting-icon"><IoSyncOutline size={18} /></span>
            <span className="setting-label">Sincronizacion</span>
          </div>
          <span className="setting-value">{taskStore.isLoading ? 'Sincronizando...' : 'Tiempo real'}</span>
        </div>

        <div className="setting-row">
          <div className="setting-left">
            <span className="setting-icon"><IoMoonOutline size={18} /></span>
            <span className="setting-label">Tema</span>
          </div>
          <span className="setting-value">Oscuro</span>
        </div>

        <div className="setting-row" onClick={handleSeedRoutines} style={{ cursor: 'pointer' }}>
          <div className="setting-left">
            <span className="setting-icon"><IoCheckmarkCircle size={18} /></span>
            <span className="setting-label" style={{ color: 'var(--primary)' }}>Generar Rutinas Básicas</span>
          </div>
        </div>

        <div className="setting-row" onClick={handleResetRoutines} style={{ cursor: 'pointer' }}>
          <div className="setting-left">
            <span className="setting-icon"><IoSyncOutline size={18} /></span>
            <span className="setting-label" style={{ color: '#FF9F0A' }}>⚠️ Reiniciar Rutinas (Reparar)</span>
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-left">
            <span className="setting-icon"><IoInformationCircleOutline size={18} /></span>
            <span className="setting-label">Version</span>
          </div>
          <span className="setting-value">1.0.0 Web</span>
        </div>

        <div className="setting-row" onClick={handleSignOut} style={{ cursor: 'pointer' }}>
          <div className="setting-left">
            <span className="setting-icon"><IoLogOutOutline size={18} /></span>
            <span className="setting-label danger">Cerrar sesion</span>
          </div>
        </div>
      </div>
    </>
  );
}
