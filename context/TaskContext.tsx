
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Task, CategoryId, Habit } from '../types';
import { useSound } from '../hooks/useSound';
import { useTaskClassifier } from '../hooks/useTaskClassifier';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from './LanguageContext';
import { INTERACTION } from '../constants';
import { DEEPSEEK_API_KEY } from '../config';

export interface AiFeedback {
    message: string;
    type: 'success' | 'neutral' | 'error';
}

interface TaskContextType {
  tasks: Task[];
  addTask: (title: string, category?: CategoryId, date?: string, description?: string, duration?: string) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  moveTask: (taskId: string, targetCategory: CategoryId) => void;
  reorderTask: (taskId: string, newCategory: CategoryId, newIndex: number) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  getTasksByCategory: (category: CategoryId) => Task[];
  
  habits: Habit[];
  addHabit: (title: string, color: string, frequency: string) => void;
  toggleHabit: (habitId: string, date: string) => void;
  deleteHabit: (habitId: string) => void;

  hardcoreMode: boolean;
  toggleHardcoreMode: () => void;
  clearAllTasks: () => void;
  restoreTasks: (data: { tasks: Task[], habits: Habit[] }) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  inboxShakeTrigger: number;
  addSuccessTrigger: number;
  
  aiMode: boolean;
  setAiMode: (enabled: boolean) => void;
  isApiKeyMissing: boolean;
  
  aiFeedback: AiFeedback | null;
  clearAiFeedback: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useLanguage();

  const initialTasks: Task[] = [
    // Task 1: Drag Demo (Place in Q3 to encourage dragging to Q1)
    { id: '1', title: t('initial.task.drag'), translationKey: 'initial.task.drag', category: 'q3', createdAt: Date.now(), completed: false, plannedDate: getTodayString(), duration: '1m' },
    // Task 2: Swipe Demo (Place in Inbox for List view visibility)
    { id: '2', title: t('initial.task.swipe'), translationKey: 'initial.task.swipe', category: 'inbox', createdAt: Date.now(), completed: false },
    // Task 3: Profile Demo (Place in Q4)
    { id: '3', title: t('initial.task.hardcore'), translationKey: 'initial.task.hardcore', category: 'q4', createdAt: Date.now(), completed: false },
    // Task 4: Workout (Q2)
    { id: '4', title: t('initial.task.workout'), translationKey: 'initial.task.workout', category: 'q2', createdAt: Date.now(), completed: false, duration: '45m' },
    // Task 5: Read (Q2)
    { id: '5', title: t('initial.task.read'), translationKey: 'initial.task.read', category: 'q2', createdAt: Date.now(), completed: false, duration: '15m' },
  ];

  const initialHabits: Habit[] = [
      { id: 'h1', title: t('initial.habit.water'), translationKey: 'initial.habit.water', color: 'bg-indigo-500', icon: 'Droplet', createdAt: Date.now(), completedDates: [], streak: 0, frequency: '1d' },
      { id: 'h2', title: t('initial.habit.read'), translationKey: 'initial.habit.read', color: 'bg-blue-400', icon: 'Book', createdAt: Date.now(), completedDates: [], streak: 0, frequency: '1d' },
  ];

  // Using v3 keys to force a reset for updated concise content
  const [tasks, setTasks] = useLocalStorage<Task[]>('focus-matrix-tasks-v3', initialTasks);
  const [habits, setHabits] = useLocalStorage<Habit[]>('focus-matrix-habits-v3', initialHabits);
  const [hardcoreMode, setHardcoreMode] = useLocalStorage<boolean>('focus-matrix-hardcore', false);
  const [aiMode, setAiMode] = useLocalStorage<boolean>('focus-matrix-ai', false);

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [inboxShakeTrigger, setInboxShakeTrigger] = useState(0);
  const [addSuccessTrigger, setAddSuccessTrigger] = useState(0);
  
  // New state for AI feedback
  const [aiFeedback, setAiFeedback] = useState<AiFeedback | null>(null);

  const { playSuccessSound } = useSound();
  const { classifyTaskWithAI } = useTaskClassifier();
  
  const clearAiFeedback = () => setAiFeedback(null);

  const addTask = async (title: string, category: CategoryId = 'inbox', date?: string, description?: string, duration?: string) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    // Explicitly set autoSorted to false for initial creation
    const newTask: Task = { id: tempId, title, description, category, createdAt: Date.now(), completed: false, plannedDate: date, duration, autoSorted: false };
    setTasks(prev => [newTask, ...prev]);
    if (category === 'inbox') setInboxShakeTrigger(prev => prev + 1);
    setAddSuccessTrigger(prev => prev + 1);

    // Use centralized key check
    if (aiMode && category === 'inbox' && DEEPSEEK_API_KEY) {
        try {
            const aiResult = await classifyTaskWithAI(title, description);
            
            if (aiResult.error === 'quota') {
                // Rate Limit Feedback
                setAiFeedback({
                    message: "⚠️ AI Busy (Rate Limit)",
                    type: 'error'
                });
                if (navigator.vibrate) navigator.vibrate(INTERACTION.VIBRATION.SOFT);
            }
            else if (aiResult.error === 'model_not_found') {
                // Model Not Found Feedback
                setAiFeedback({
                    message: "⚠️ AI Model Not Found",
                    type: 'error'
                });
            }
            else if (aiResult.category !== 'inbox' && !aiResult.error) {
                // Success Classification
                const finalDuration = duration || aiResult.duration;
                // HERE: We set autoSorted to true because AI is moving it
                updateTask(tempId, { category: aiResult.category, duration: finalDuration, autoSorted: true });
                if (navigator.vibrate) navigator.vibrate(INTERACTION.VIBRATION.AI_AUTO_SORT);
                
                const durationText = finalDuration ? ` (${finalDuration})` : '';
                setAiFeedback({
                    message: `${t('ai.sorted')} ${aiResult.category.toUpperCase()}${durationText}`,
                    type: 'success'
                });
            } else {
                // General Failure / Unsure
                setAiFeedback({
                    message: t('ai.unsure'),
                    type: 'neutral'
                });
            }
            // Auto hide
            setTimeout(() => setAiFeedback(null), 3500);
            
        } catch (e) { 
            console.warn("AI Auto-sort failed", e); 
        }
    }
  };

  const updateTask = (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const moveTask = (taskId: string, targetCategory: CategoryId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, category: targetCategory } : t));
  };

  const reorderTask = (taskId: string, newCategory: CategoryId, newIndex: number) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      const filtered = prev.filter(t => t.id !== taskId);
      const categoryTasks = filtered.filter(t => t.category === newCategory && !t.completed);
      const taskAtIndex = categoryTasks[newIndex];
      const updatedTask = { ...task, category: newCategory };
      const newTasks = [...filtered];
      if (taskAtIndex) {
          const indexInAll = newTasks.findIndex(t => t.id === taskAtIndex.id);
          if (indexInAll !== -1) newTasks.splice(indexInAll, 0, updatedTask);
          else newTasks.push(updatedTask);
      } else {
          if (categoryTasks.length > 0) {
              const lastTask = categoryTasks[categoryTasks.length - 1];
              const indexInAll = newTasks.findIndex(t => t.id === lastTask.id);
              newTasks.splice(indexInAll + 1, 0, updatedTask);
          } else { newTasks.push(updatedTask); }
      }
      return newTasks;
    });
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        const isNowCompleted = !t.completed;
        if (isNowCompleted) {
             playSuccessSound();
             if (navigator.vibrate) {
                 if (t.category === 'q1' || t.category === 'q2') navigator.vibrate(INTERACTION.VIBRATION.HARD); 
                 else navigator.vibrate(INTERACTION.VIBRATION.SOFT);
             }
        }
        return { ...t, completed: isNowCompleted, completedAt: isNowCompleted ? Date.now() : undefined };
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const addHabit = (title: string, color: string, frequency: string) => {
      const newHabit: Habit = {
          id: Math.random().toString(36).substr(2, 9),
          title, color, icon: 'Check', createdAt: Date.now(),
          completedDates: [], streak: 0, frequency
      };
      setHabits(prev => [...prev, newHabit]);
      setAddSuccessTrigger(prev => prev + 1);
  };

  const toggleHabit = (habitId: string, date: string) => {
      setHabits(prev => prev.map(h => {
          if (h.id !== habitId) return h;
          const hasCompleted = h.completedDates.includes(date);
          let newDates: string[];
          if (hasCompleted) {
              newDates = h.completedDates.filter(d => d !== date);
          } else {
              newDates = [...h.completedDates, date].sort();
              playSuccessSound(1000);
              if (navigator.vibrate) navigator.vibrate(INTERACTION.VIBRATION.MEDIUM);
          }
          let currentStreak = 0;
          const todayStr = getTodayString();
          const checkDate = new Date(todayStr);
          if (newDates.includes(todayStr)) currentStreak = 1;
          while(true) {
             checkDate.setDate(checkDate.getDate() - 1);
             const y = checkDate.getFullYear();
             const m = String(checkDate.getMonth() + 1).padStart(2, '0');
             const dStr = String(checkDate.getDate()).padStart(2, '0');
             const dateKey = `${y}-${m}-${dStr}`;
             if (newDates.includes(dateKey)) currentStreak++;
             else break;
          }
          return { ...h, completedDates: newDates, streak: currentStreak };
      }));
  };

  const deleteHabit = (habitId: string) => { setHabits(prev => prev.filter(h => h.id !== habitId)); };
  const clearAllTasks = () => { setTasks([]); setHabits([]); };
  const restoreTasks = (data: { tasks: Task[], habits: Habit[] }) => { if (data.tasks) setTasks(data.tasks); if (data.habits) setHabits(data.habits); };
  const getTasksByCategory = (category: CategoryId) => tasks.filter(t => t.category === category && !t.completed);
  const toggleHardcoreMode = () => setHardcoreMode(prev => !prev);

  return (
    <TaskContext.Provider value={{ 
      tasks, addTask, updateTask, moveTask, reorderTask, completeTask, deleteTask, getTasksByCategory,
      habits, addHabit, toggleHabit, deleteHabit,
      hardcoreMode, toggleHardcoreMode, clearAllTasks, restoreTasks,
      selectedDate, setSelectedDate,
      inboxShakeTrigger, addSuccessTrigger,
      aiMode, setAiMode,
      isApiKeyMissing: !DEEPSEEK_API_KEY,
      aiFeedback, clearAiFeedback
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