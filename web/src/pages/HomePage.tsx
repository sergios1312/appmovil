import { useMemo } from 'react';
import { useTaskStore, selectTodayStats, selectWeeklyProgress, selectProjects } from '@/store/taskStore';
import {
  IoTodayOutline,
  IoCheckmarkCircleOutline,
  IoListOutline,
  IoTrophyOutline,
  IoFlameOutline,
  IoRocketOutline,
  IoChevronForward,
} from 'react-icons/io5';

export function HomePage() {
  // Suscribirse a la referencia ESTABLE `tasks` y derivar con useMemo.
  // Pasar estos selectores directamente a useTaskStore() (p. ej.
  // useTaskStore(selectTodayStats)) devuelve un objeto/array NUEVO en cada
  // render → getSnapshot inestable → "Maximum update depth exceeded" → la app
  // se queda en pantalla en blanco. Por eso derivamos aquí con useMemo([tasks]).
  const tasks = useTaskStore((s) => s.tasks);
  const todayStats = useMemo(() => selectTodayStats({ tasks }), [tasks]);
  const weeklyProgress = useMemo(() => selectWeeklyProgress({ tasks }), [tasks]);
  const projects = useMemo(() => selectProjects({ tasks }), [tasks]);
  const totalTasks = useMemo(() => tasks.filter((t) => !t.parent_id).length, [tasks]);

  const pendingToday = todayStats.total - todayStats.completed;

  // Determine incentive message
  const getIncentiveMessage = () => {
    if (weeklyProgress.totalCompleted === 0) return '¡Comienza tu semana completando tu primera tarea!';
    if (weeklyProgress.progress >= 100) return '🎉 ¡Felicidades! Alcanzaste tu meta semanal.';
    if (weeklyProgress.remaining <= 10) return `🔥 ¡Casi! Solo ${weeklyProgress.remaining} puntos más para tu logro.`;
    return `Para alcanzar el logro semanal, acumula ${weeklyProgress.remaining} puntos más.`;
  };

  return (
    <>
      <div className="page-header">
        <div className="label">Dashboard</div>
        <h2>Inicio</h2>
        <div className="subtitle">Resumen general de tu vida y proyectos</div>
      </div>

      {/* ─── Estadísticas Generales ─── */}
      <section className="dashboard-section">
        <h3 className="section-title">
          <IoTodayOutline size={18} />
          Estadísticas del día
        </h3>
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--warning)' }}>
              <IoListOutline size={20} color="var(--bg)" />
            </div>
            <div className="number">{pendingToday}</div>
            <div className="label">Pendientes hoy</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon" style={{ background: 'var(--success)' }}>
              <IoCheckmarkCircleOutline size={20} color="var(--bg)" />
            </div>
            <div className="number">{todayStats.completed}</div>
            <div className="label">Completadas hoy</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--primary)' }}>
              <IoListOutline size={20} color="var(--bg)" />
            </div>
            <div className="number">{totalTasks}</div>
            <div className="label">Total de tareas</div>
          </div>
        </div>
      </section>

      {/* ─── Logros y Progresión (Gamificación) ─── */}
      <section className="dashboard-section">
        <h3 className="section-title">
          <IoTrophyOutline size={18} />
          Logros y progresión
        </h3>
        <div className="gamification-card">
          <div className="gamification-header">
            <div className="gamification-stats">
              <span className="gamification-highlight">
                <IoFlameOutline size={16} />
                {weeklyProgress.totalCompleted} tareas esta semana
              </span>
              <span className="gamification-points">
                {weeklyProgress.totalWeight} / {weeklyProgress.currentMilestone} pts
              </span>
            </div>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${weeklyProgress.progress}%` }}
            />
          </div>
          <p className="gamification-incentive">
            {getIncentiveMessage()}
          </p>
          <p className="gamification-hint">
            💡 El progreso se calcula según el peso de cada tarea — las rutinas simples aportan menos que tareas grandes.
          </p>
        </div>
      </section>

      {/* ─── Progreso de Proyectos Grandes ─── */}
      <section className="dashboard-section">
        <h3 className="section-title">
          <IoRocketOutline size={18} />
          Proyectos a largo plazo
        </h3>
        {projects.length === 0 ? (
          <div className="empty-projects-card">
            <IoRocketOutline size={32} color="var(--text-muted)" />
            <p>No tienes proyectos aún.</p>
            <span>Crea un proyecto desde el módulo de Tareas para verlo aquí.</span>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <span className="project-title">{project.title}</span>
                  <span className="project-percent">{project.progress}%</span>
                </div>
                <div className="progress-bar-container small">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${project.progress}%`,
                      background: project.progress >= 100
                        ? 'var(--success)'
                        : project.progress >= 50
                          ? 'var(--warning)'
                          : 'var(--primary)',
                    }}
                  />
                </div>
                <div className="project-meta">
                  <span>{project.completedSubtasks} / {project.totalSubtasks} subtareas</span>
                  <IoChevronForward size={14} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
