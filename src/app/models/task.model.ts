export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id?: string | number;
  title: string;
  description?: string;
  column: string; // To-Do | In Progress | Done | custom
  dueDate?: string; // ISO
  priority: Priority;
  ownerId: string; // user id
  createdAt?: string;
  position?: number;
}
