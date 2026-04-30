/**
 * @file GoogleTasksService.ts
 * @layer data/remote
 * @description Cliente para Google Tasks API.
 * ESTADO ACTUAL: Mockeado. Firma lista para implementación real con OAuth.
 *
 * Para implementación real se necesita:
 * 1. Google Cloud Console → Habilitar Tasks API
 * 2. OAuth 2.0 scope: https://www.googleapis.com/auth/tasks
 * 3. Reemplazar mocks por llamadas a https://tasks.googleapis.com/tasks/v1/
 */

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string; // RFC 3339 format
  completed?: string; // RFC 3339 format
  parent?: string; // Para subtareas en Google Tasks
  selfLink?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  selfLink?: string;
}

const MOCK_TASK_LISTS: GoogleTaskList[] = [
  { id: 'list_001', title: 'Mi lista de tareas' },
  { id: 'list_002', title: 'Trabajo' },
];

const MOCK_GOOGLE_TASKS: GoogleTask[] = [
  {
    id: 'gtask_001',
    title: 'Reunión de planificación Q2',
    status: 'needsAction',
    due: new Date().toISOString(),
  },
];

export class GoogleTasksService {
  private readonly BASE_URL = 'https://tasks.googleapis.com/tasks/v1';

  constructor(private getAccessToken: () => string | null) {}

  /**
   * Obtiene todas las listas de tareas del usuario
   *
   * TODO (Real): GET /users/@me/lists
   */
  async getTaskLists(): Promise<GoogleTaskList[]> {
    console.log('[GoogleTasksService] MOCK: getTaskLists');
    await this.simulateDelay(400);
    return MOCK_TASK_LISTS;
  }

  /**
   * Obtiene las tareas de una lista específica
   *
   * TODO (Real): GET /lists/{tasklist}/tasks?showCompleted=true
   */
  async getTasks(tasklistId: string): Promise<GoogleTask[]> {
    console.log('[GoogleTasksService] MOCK: getTasks', tasklistId);
    await this.simulateDelay(500);
    return MOCK_GOOGLE_TASKS;
  }

  /**
   * Crea una tarea en Google Tasks
   *
   * TODO (Real): POST /lists/{tasklist}/tasks
   */
  async createTask(tasklistId: string, task: Omit<GoogleTask, 'id'>): Promise<GoogleTask> {
    console.log('[GoogleTasksService] MOCK: createTask', { tasklistId, task });
    await this.simulateDelay(600);

    return {
      ...task,
      id: `gtask_mock_${Date.now()}`,
      selfLink: `${this.BASE_URL}/lists/${tasklistId}/tasks/mock_${Date.now()}`,
    };
  }

  /**
   * Actualiza una tarea existente
   *
   * TODO (Real): PATCH /lists/{tasklist}/tasks/{task}
   */
  async updateTask(
    tasklistId: string,
    taskId: string,
    updates: Partial<GoogleTask>
  ): Promise<GoogleTask> {
    console.log('[GoogleTasksService] MOCK: updateTask', { tasklistId, taskId, updates });
    await this.simulateDelay(500);

    const existing = MOCK_GOOGLE_TASKS.find(t => t.id === taskId);
    return { ...(existing ?? { id: taskId, title: 'Unknown', status: 'needsAction' }), ...updates };
  }

  /**
   * Elimina una tarea
   *
   * TODO (Real): DELETE /lists/{tasklist}/tasks/{task}
   */
  async deleteTask(tasklistId: string, taskId: string): Promise<void> {
    console.log('[GoogleTasksService] MOCK: deleteTask', { tasklistId, taskId });
    await this.simulateDelay(300);
  }

  /**
   * Marca una tarea como completada en Google Tasks
   *
   * TODO (Real): PATCH /lists/{tasklist}/tasks/{task} con status: 'completed'
   */
  async completeTask(tasklistId: string, taskId: string): Promise<GoogleTask> {
    return this.updateTask(tasklistId, taskId, {
      status: 'completed',
      completed: new Date().toISOString(),
    });
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
