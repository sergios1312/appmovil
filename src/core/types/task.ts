export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string | null;
  parent_id?: string | null;
}

