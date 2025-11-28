export type QuadrantId = 'q1' | 'q2' | 'q3' | 'q4';
export type CategoryId = 'inbox' | QuadrantId;

export interface Task {
  id: string;
  title: string;
  description?: string; // New field
  category: CategoryId;
  createdAt: number;
  completed: boolean;
  plannedDate?: string; // Format: YYYY-MM-DD
}

export type ViewState = 'matrix' | 'list' | 'stats' | 'user';

export interface DragItem {
  task: Task;
  initialX: number;
  initialY: number;
  offsetX: number;
  offsetY: number;
}