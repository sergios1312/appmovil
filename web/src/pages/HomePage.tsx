import { useEffect, useMemo } from 'react';
import { useTaskStore } from '@/store/taskStore';
import type { Task } from '@/core/entities/Task';
import {
  IoTodayOutline,
  IoCheckmarkCircleOutline,
  IoListOutline,
  IoTrophyOutline,
  IoFlameOutline,
  IoRocketOutline,
  IoChevronForward,
} from 'react-icons/io5';

function getDescendants(tasks: Task[], parentId: string): Task[] {
  const children = tasks.filter(t => t.parent_id === parentId);
  let all = [...children];
  for (const child of children) {
    all = [...all, ...getDescendants(tasks, child.id)];
  }
  return all;
}

export function HomePage() {
  const tasks = useTaskStore((s) => s.tasks);
  const loadTasks = useTaskStore((s) => s.loadTasks);

  const rootTasks = useMemo(() => tasks.filter((t) => !t.parent_id), [tasks]);

  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter((t) => t.due_date?.startsWith(today));
    const total = todayTasks.length;
    const completed = todayTasks.filter((t) => t.status === 'completed').length;
    return { total, completed };
  }, [tasks]);

  const weeklyProgress = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weekTasks = tasks.filter(t => {
      const updated = new Date(t.updated_at);
      return updated >= startOfWeek && t.status === 'completed';
    });
    const totalWeight = weekTasks.reduce((acc, t) => acc + (t.weight || 3), 0);
    const totalCompleted = weekTasks.length;
    const milestones = [10, 25, 50, 75, 100, 150];
    const currentMilestone = milestones.find(m => totalWeight < m) ?? 150;
    const progress = Math.min(Math.round((totalWeight / currentMilestone) * 100), 100);
    const remaining = Math.max(currentMilestone - totalWeight, 0);
    return { totalWeight, totalCompleted, currentMilestone, progress, remaining };
  }, [tasks]);

  const projects = useMemo(() => {
    return tasks.filter(t => !t.parent_id && t.task_type === 'project').map(project => {
      const allDescendants = getDescendants(tasks, project.id);
      const total = allDescendants.length;
      const completed = allDescendants.filter(t => t.status === 'completed').length;
      const prog = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...project, totalSubtasks: total, completedSubtasks: completed, progress: prog };
    });
  }, [tasks]);

  const pendingToday = todayStats.total - todayStats.completed;

  useEffect(() => { loadTasks(); }, []);

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
            <div className="number">{rootTasks.length}</div>
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
