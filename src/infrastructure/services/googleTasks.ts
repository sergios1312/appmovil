import type { Task, TaskStatus } from '@/core/entities/Task';

interface GoogleTask {
  id: string;
  title?: string;
  status?: 'needsAction' | 'completed';
  due?: string;
  parent?: string;
  notes?: string;
}

interface GoogleTasksListResponse {
  items?: Array<{ id: string; title: string }>;
}

interface GoogleTasksResponse {
  items?: GoogleTask[];
}

const GOOGLE_TASKS_BASE_URL = 'https://tasks.googleapis.com/tasks/v1';

const mapGoogleStatusToTaskStatus = (status?: GoogleTask['status']): TaskStatus => {
  if (status === 'completed') {
    return 'completed';
  }
  return 'pending';
};

export const mapGoogleTaskToTask = (googleTask: GoogleTask): Task => {
  return {
    id: googleTask.id,
    title: googleTask.title?.trim() || 'Untitled task',
    status: mapGoogleStatusToTaskStatus(googleTask.status),
    due_date: googleTask.due ?? undefined,
    parent_id: googleTask.parent ?? null,
    description: googleTask.notes ?? undefined,
    priority: 'medium', // Google Tasks doesn't strictly map to our priority
    is_synced: true,
  } as Task;
};

// 1. Obtener la lista principal de tareas (Task List)
export async function fetchGoogleTaskLists(accessToken: string): Promise<Array<{ id: string; title: string }>> {
  const response = await fetch(`${GOOGLE_TASKS_BASE_URL}/users/@me/lists`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Google Tasks lists request failed (${response.status})`);
  }

  const payload = (await response.json()) as GoogleTasksListResponse;
  return payload.items ?? [];
}

// 2. Obtener todas las tareas de una lista
export async function fetchGoogleTasks(
  accessToken: string,
  taskListId: string
): Promise<Task[]> {
  const response = await fetch(
    `${GOOGLE_TASKS_BASE_URL}/lists/${taskListId}/tasks?showCompleted=true&showHidden=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Tasks request failed (${response.status})`);
  }

  const payload = (await response.json()) as GoogleTasksResponse;
  return (payload.items ?? []).map(mapGoogleTaskToTask);
}

// 3. Crear una nueva tarea en Google Tasks
export async function createGoogleTask(
  accessToken: string,
  taskListId: string,
  task: Partial<Task>
): Promise<GoogleTask> {
  const body: any = {
    title: task.title,
    notes: task.description,
  };

  if (task.due_date) {
    body.due = new Date(task.due_date).toISOString();
  }
  
  if (task.status === 'completed') {
    body.status = 'completed';
  }

  const response = await fetch(
    `${GOOGLE_TASKS_BASE_URL}/lists/${taskListId}/tasks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Create Google Task failed (${response.status})`);
  }

  return await response.json();
}

// 4. Actualizar una tarea existente en Google Tasks
export async function updateGoogleTask(
  accessToken: string,
  taskListId: string,
  googleTaskId: string,
  task: Partial<Task>
): Promise<GoogleTask> {
  const body: any = {
    id: googleTaskId,
    title: task.title,
    notes: task.description,
  };

  if (task.due_date) {
    body.due = new Date(task.due_date).toISOString();
  }
  
  if (task.status) {
    body.status = task.status === 'completed' ? 'completed' : 'needsAction';
  }

  const response = await fetch(
    `${GOOGLE_TASKS_BASE_URL}/lists/${taskListId}/tasks/${googleTaskId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Update Google Task failed (${response.status})`);
  }

  return await response.json();
}

// 5. Eliminar una tarea de Google Tasks
export async function deleteGoogleTask(
  accessToken: string,
  taskListId: string,
  googleTaskId: string
): Promise<void> {
  const response = await fetch(
    `${GOOGLE_TASKS_BASE_URL}/lists/${taskListId}/tasks/${googleTaskId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Delete Google Task failed (${response.status})`);
  }
}
