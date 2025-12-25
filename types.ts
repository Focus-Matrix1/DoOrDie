
export type QuadrantId = 'q1' | 'q2' | 'q3' | 'q4';
export type CategoryId = 'inbox' | QuadrantId;

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: CategoryId;
  createdAt: number;
  completed: boolean;
  completedAt?: number; // Timestamp when task was completed
  plannedDate?: string; // Format: YYYY-MM-DD
  duration?: string; // e.g. "30m", "1h"
  translationKey?: string; // Key for dynamic localization of demo tasks
  autoSorted?: boolean; // True if the task was classified by AI
}

export interface Habit {
  id: string;
  title: string;
  color: string;
  icon: string;
  createdAt: number;
  completedDates: string[]; // Array of YYYY-MM-DD strings
  streak: number;
  frequency: string; // e.g., "1d", "12h"
  translationKey?: string; // Key for dynamic localization of demo habits
}

export type ViewState = 'matrix' | 'list' | 'habits' | 'profile';

export interface DragItem {
  task: Task;
  initialX: number;
  initialY: number;
  offsetX: number;
  offsetY: number;
}