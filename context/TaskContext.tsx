
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Task, CategoryId, Habit } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

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
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Helper to get local date string YYYY-MM-DD
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const INITIAL_TASKS: Task[] = [
  { id: '1', title: '修复支付接口', category: 'q1', createdAt: Date.now(), completed: false, plannedDate: getTodayString(), duration: '2h' },
  { id: '2', title: '学习 Swift UI', category: 'q2', createdAt: Date.now(), completed: false, plannedDate: getTodayString(), duration: '45m' },
  { id: '3', title: '健身 30 分钟', category: 'q2', createdAt: Date.now(), completed: false, duration: '30m' },
  { id: '4', title: '整理发票报销', category: 'inbox', createdAt: Date.now(), completed: false },
  { id: '5', title: 'Review design assets', category: 'inbox', createdAt: Date.now(), completed: false },
];

const INITIAL_HABITS: Habit[] = [
    { id: 'h1', title: '早起阅读', color: 'bg-indigo-500', icon: 'Book', createdAt: Date.now(), completedDates: [], streak: 0, frequency: '1d' },
    { id: 'h2', title: '喝八杯水', color: 'bg-blue-400', icon: 'Droplet', createdAt: Date.now(), completedDates: [], streak: 0, frequency: '1d' },
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

  const [habits, setHabits] = useState<Habit[]>(() => {
      try {
          if (typeof window === 'undefined') return INITIAL_HABITS;
          const saved = localStorage.getItem('focus-matrix-habits');
          if (saved) {
              return JSON.parse(saved);
          }
          return INITIAL_HABITS;
      } catch {
          return INITIAL_HABITS;
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

  const [aiMode, setAiMode] = useState<boolean>(() => {
      try {
          if (typeof window === 'undefined') return false;
          return localStorage.getItem('focus-matrix-ai') === 'true';
      } catch { return false; }
  });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [inboxShakeTrigger, setInboxShakeTrigger] = useState(0);
  const [addSuccessTrigger, setAddSuccessTrigger] = useState(0);

  // Audio Context for "Ding" sound
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSuccessSound = (pitch = 800) => {
    try {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(pitch, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(pitch + 400, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.warn("Audio playback failed", e);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('focus-matrix-tasks', JSON.stringify(tasks));
    } catch (error) {
      console.warn('Failed to save tasks:', error);
    }
  }, [tasks]);

  useEffect(() => {
    try {
        localStorage.setItem('focus-matrix-habits', JSON.stringify(habits));
    } catch (error) {
        console.warn('Failed to save habits:', error);
    }
  }, [habits]);

  useEffect(() => {
    try {
      localStorage.setItem('focus-matrix-hardcore', String(hardcoreMode));
      localStorage.setItem('focus-matrix-ai', String(aiMode));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }, [hardcoreMode, aiMode]);

  // --- AI Classification ---
  const classifyTaskWithAI = async (title: string, description?: string): Promise<{ category: CategoryId, duration?: string }> => {
      if (!process.env.API_KEY) {
          console.warn("AI Mode: No API Key provided");
          return { category: 'inbox' }; 
      }

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Classify the task: "${title}". Description: "${description || ''}"`,
              config: {
                systemInstruction: "You are an expert productivity assistant. Classify the task into the Eisenhower Matrix. q1: Urgent & Important, q2: Important Not Urgent, q3: Urgent Not Important, q4: Not Urgent Not Important. Estimate duration (e.g. 30m, 1h).",
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, enum: ['q1', 'q2', 'q3', 'q4', 'inbox'] },
                    duration: { type: Type.STRING, description: "Estimated duration, e.g. '30m'" }
                  },
                  required: ['category']
                }
              }
          });
          
          const text = response.text;
          if (!text) return { category: 'inbox' };
          
          const result = JSON.parse(text);
          const cat = result.category?.toLowerCase();
          
          if (['q1', 'q2', 'q3', 'q4'].includes(cat)) {
              return { 
                  category: cat as CategoryId, 
                  duration: result.duration 
              };
          }
          
          return { category: 'inbox' };

      } catch (e) {
          console.error("AI Classification failed", e);
          return { category: 'inbox' };
      }
  };

  // --- Task Actions ---

  const addTask = async (title: string, category: CategoryId = 'inbox', date?: string, description?: string, duration?: string) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    
    // Immediate optimistic update
    const newTask: Task = {
      id: tempId,
      title,
      description,
      category,
      createdAt: Date.now(),
      completed: false,
      plannedDate: date,
      duration
    };
    
    setTasks(prev => [newTask, ...prev]);
    if (category === 'inbox') setInboxShakeTrigger(prev => prev + 1);
    setAddSuccessTrigger(prev => prev + 1);

    // AI Classification Background Process
    // Trigger if AI mode is ON, and user hasn't explicitly categorized it (defaults to inbox)
    if (aiMode && category === 'inbox') {
        if (!process.env.API_KEY) {
            console.warn("AI Skipped: Missing API Key");
            return;
        }

        try {
            const aiResult = await classifyTaskWithAI(title, description);
            if (aiResult.category !== 'inbox') {
                updateTask(tempId, { 
                    category: aiResult.category,
                    duration: duration || aiResult.duration // keep user duration if provided, else use AI
                });
                if (navigator.vibrate) navigator.vibrate([20, 30, 20]); // Feedback pattern
            }
        } catch (e) {
            console.warn("AI Auto-sort failed silently", e);
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
      // Find the task
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;

      // Filter out the task from the list
      const filtered = prev.filter(t => t.id !== taskId);

      // Get tasks in the target category (to find insertion point)
      // We assume matrix view shows active tasks, so we filter by category and active status to determine visual order
      const categoryTasks = filtered.filter(t => t.category === newCategory && !t.completed);

      // We want to insert 'task' into 'filtered' such that it ends up at 'newIndex' among 'categoryTasks'
      const taskAtIndex = categoryTasks[newIndex];
      const updatedTask = { ...task, category: newCategory };
      
      const newTasks = [...filtered];
      
      if (taskAtIndex) {
          // Insert before the task that is currently at the target index
          const indexInAll = newTasks.findIndex(t => t.id === taskAtIndex.id);
          if (indexInAll !== -1) {
              newTasks.splice(indexInAll, 0, updatedTask);
          } else {
             newTasks.push(updatedTask);
          }
      } else {
          // Insert after the last visible task of this category, or at end if none
          if (categoryTasks.length > 0) {
              const lastTask = categoryTasks[categoryTasks.length - 1];
              const indexInAll = newTasks.findIndex(t => t.id === lastTask.id);
              // Insert after
              newTasks.splice(indexInAll + 1, 0, updatedTask);
          } else {
              newTasks.push(updatedTask);
          }
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
                 if (t.category === 'q1' || t.category === 'q2') {
                     navigator.vibrate([40, 30, 40]); 
                 } else {
                     navigator.vibrate(20);
                 }
             }
        }

        return {
            ...t,
            completed: isNowCompleted,
            completedAt: isNowCompleted ? Date.now() : undefined
        };
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // --- Habit Actions ---

  const addHabit = (title: string, color: string, frequency: string) => {
      const newHabit: Habit = {
          id: Math.random().toString(36).substr(2, 9),
          title,
          color,
          icon: 'Check',
          createdAt: Date.now(),
          completedDates: [],
          streak: 0,
          frequency
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
              playSuccessSound(1000); // Higher pitch for habits
              if (navigator.vibrate) navigator.vibrate(30);
          }

          // Simple streak calculation (consecutive days ending yesterday or today)
          let currentStreak = 0;
          const today = new Date();
          const todayStr = getTodayString();
          const checkDate = new Date(todayStr); // Start from today or yesterday
          
          // Check if today is completed
          if (newDates.includes(todayStr)) {
              currentStreak = 1;
          }
          
          // Go back in time
          while(true) {
             checkDate.setDate(checkDate.getDate() - 1);
             const dateStr = checkDate.toISOString().split('T')[0];
             if (newDates.includes(dateStr)) {
                 currentStreak++;
             } else {
                 break;
             }
          }

          return { ...h, completedDates: newDates, streak: currentStreak };
      }));
  };

  const deleteHabit = (habitId: string) => {
      setHabits(prev => prev.filter(h => h.id !== habitId));
  };
  
  // --- Global Actions ---

  const clearAllTasks = () => {
    setTasks([]);
    setHabits([]);
  };

  const restoreTasks = (data: { tasks: Task[], habits: Habit[] }) => {
      if (data.tasks) setTasks(data.tasks);
      if (data.habits) setHabits(data.habits);
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
      reorderTask,
      completeTask, 
      deleteTask, 
      getTasksByCategory,
      
      habits,
      addHabit,
      toggleHabit,
      deleteHabit,

      hardcoreMode,
      toggleHardcoreMode,
      clearAllTasks,
      restoreTasks,
      selectedDate,
      setSelectedDate,
      inboxShakeTrigger,
      addSuccessTrigger,

      aiMode,
      setAiMode,
      isApiKeyMissing: !process.env.API_KEY
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
