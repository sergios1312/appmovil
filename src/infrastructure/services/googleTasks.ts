import type { Task, TaskStatus } from '@/core/types/task';

interface GoogleTask {
  id: string;
  title?: string;
  status?: 'needsAction' | 'completed';
  due?: string;
  parent?: string;
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
    return 'done';
  }
  return 'pending';
};

export const mapGoogleTaskToTask = (googleTask: GoogleTask): Task => {
  return {
    id: googleTask.id,
    title: googleTask.title?.trim() || 'Untitled task',
    status: mapGoogleStatusToTaskStatus(googleTask.status),
    dueDate: googleTask.due ?? null,
    parent_id: googleTask.parent ?? null,
  };
};

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

