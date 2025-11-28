import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, CategoryId } from '../types';

interface TaskContextType {
  tasks: Task[];
  addTask: (title: string, category?: CategoryId, date?: string, description?: string) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  moveTask: (taskId: string, targetCategory: CategoryId) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  getTasksByCategory: (category: CategoryId) => Task[];
  hardcoreMode: boolean;
  toggleHardcoreMode: () => void;
  clearAllTasks: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  inboxShakeTrigger: number;
  addSuccessTrigger: number; // Signal for FAB animation
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const getTodayString = () => new Date().toISOString().split('T')[0];

const INITIAL_TASKS: Task[] = [
  { id: '1', title: '修复支付接口', category: 'q1', createdAt: Date.now(), completed: false, plannedDate: getTodayString() },
  { id: '2', title: '学习 Swift UI', category: 'q2', createdAt: Date.now(), completed: false, plannedDate: getTodayString() },
  { id: '3', title: '健身 30 分钟', category: 'q2', createdAt: Date.now(), completed: false },
  { id: '4', title: '整理发票报销', category: 'inbox', createdAt: Date.now(), completed: false },
  { id: '5', title: 'Review design assets', category: 'inbox', createdAt: Date.now(), completed: false },
  { id: '6', title: 'Email catch-up', category: 'inbox', createdAt: Date.now(), completed: false },
];

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      if (typeof window === 'undefined') return INITIAL_TASKS;
      const saved = localStorage.getItem('focus-matrix-tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return INITIAL_TASKS;
    } catch (error) {
      console.warn('LocalStorage load failed:', error);
      return INITIAL_TASKS;
    }
  });
  
  const [hardcoreMode, setHardcoreMode] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      return localStorage.getItem('focus-matrix-hardcore') === 'true';
    } catch {
      return false;
    }
  });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [inboxShakeTrigger, setInboxShakeTrigger] = useState(0);
  const [addSuccessTrigger, setAddSuccessTrigger] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem('focus-matrix-tasks', JSON.stringify(tasks));
    } catch (error) {
      console.warn('Failed to save tasks:', error);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('focus-matrix-hardcore', String(hardcoreMode));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }, [hardcoreMode]);

  const addTask = (title: string, category: CategoryId = 'inbox', date?: string, description?: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      category,
      createdAt: Date.now(),
      completed: false,
      plannedDate: date
    };
    setTasks(prev => [newTask, ...prev]);
    
    // Trigger animations
    if (category === 'inbox') {
        setInboxShakeTrigger(prev => prev + 1);
    }
    setAddSuccessTrigger(prev => prev + 1);
  };

  const updateTask = (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const moveTask = (taskId: string, targetCategory: CategoryId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, category: targetCategory } : t));
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };
  
  const clearAllTasks = () => {
    setTasks([]);
  };

  const getTasksByCategory = (category: CategoryId) => {
    return tasks.filter(t => t.category === category && !t.completed);
  };

  const toggleHardcoreMode = () => setHardcoreMode(prev => !prev);

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      addTask, 
      updateTask,
      moveTask, 
      completeTask, 
      deleteTask, 
      getTasksByCategory,
      hardcoreMode,
      toggleHardcoreMode,
      clearAllTasks,
      selectedDate,
      setSelectedDate,
      inboxShakeTrigger,
      addSuccessTrigger
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
};