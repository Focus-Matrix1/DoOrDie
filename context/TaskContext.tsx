
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Task, CategoryId, Habit, SyncStatus } from '../types';
import { useSound } from '../hooks/useSound';
import { useTaskClassifier } from '../hooks/useTaskClassifier';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from './LanguageContext';
import { INTERACTION } from '../constants';
import { DEEPSEEK_API_KEY } from '../config';
import { supabase } from '../lib/supabase';

// --- Helpers for Supabase Data Conversion ---
const toSnakeCase = (obj: any): any => {
    const newObj: any = {};
    for (const key in obj) {
        let newKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (key === 'createdAt') newKey = 'created_at';
        if (key === 'updatedAt') newKey = 'updated_at';
        if (key === 'isDeleted') newKey = 'is_deleted';
        if (key === 'plannedDate') newKey = 'planned_date';
        if (key === 'completedAt') newKey = 'completed_at';
        if (key === 'completedDates') newKey = 'completed_dates';
        if (key === 'autoSorted') newKey = 'auto_sorted';
        if (key === 'translationKey') newKey = 'translation_key';
        newObj[newKey] = obj[key];
    }
    return newObj;
};

const toCamelCase = (obj: any): any => {
    const newObj: any = {};
    for (const key in obj) {
        let newKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        newObj[newKey] = obj[key];
    }
    return newObj;
};

export interface AiFeedback {
    message: string;
    type: 'success' | 'neutral' | 'error';
}

interface TaskContextType {
  // Public filtered data (Active only)
  tasks: Task[];
  habits: Habit[];
  
  // Raw data (Including deleted) for Sync
  rawTasks: Task[];
  rawHabits: Habit[];
  syncLocalData: (newTasks: Task[], newHabits: Habit[]) => void;
  
  // New Sync Infrastructure
  syncStatus: SyncStatus;
  syncData: (overrideTasks?: Task[], overrideHabits?: Habit[]) => Promise<void>;

  addTask: (title: string, category?: CategoryId, date?: string, description?: string, duration?: string) => void;
  updateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  moveTask: (taskId: string, targetCategory: CategoryId) => void;
  reorderTask: (taskId: string, newCategory: CategoryId, newIndex: number) => void;
  completeTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  getTasksByCategory: (category: CategoryId) => Task[];
  
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
    { id: '1', title: t('initial.task.drag'), translationKey: 'initial.task.drag', category: 'q3', createdAt: Date.now(), completed: false, plannedDate: getTodayString(), duration: '1m', updatedAt: new Date().toISOString(), isDeleted: false },
    // Task 2: Swipe Demo (Place in Inbox for List view visibility)
    { id: '2', title: t('initial.task.swipe'), translationKey: 'initial.task.swipe', category: 'inbox', createdAt: Date.now(), completed: false, updatedAt: new Date().toISOString(), isDeleted: false },
    // Task 3: Profile Demo (Place in Q4)
    { id: '3', title: t('initial.task.hardcore'), translationKey: 'initial.task.hardcore', category: 'q4', createdAt: Date.now(), completed: false, updatedAt: new Date().toISOString(), isDeleted: false },
    // Task 4: Workout (Q2)
    { id: '4', title: t('initial.task.workout'), translationKey: 'initial.task.workout', category: 'q2', createdAt: Date.now(), completed: false, duration: '45m', updatedAt: new Date().toISOString(), isDeleted: false },
    // Task 5: Read (Q2)
    { id: '5', title: t('initial.task.read'), translationKey: 'initial.task.read', category: 'q2', createdAt: Date.now(), completed: false, duration: '15m', updatedAt: new Date().toISOString(), isDeleted: false },
  ];

  const initialHabits: Habit[] = [
      { id: 'h1', title: t('initial.habit.water'), translationKey: 'initial.habit.water', color: 'bg-indigo-500', icon: 'Droplet', createdAt: Date.now(), completedDates: [], streak: 0, frequency: '1d', updatedAt: new Date().toISOString(), isDeleted: false },
      { id: 'h2', title: t('initial.habit.read'), translationKey: 'initial.habit.read', color: 'bg-blue-400', icon: 'Book', createdAt: Date.now(), completedDates: [], streak: 0, frequency: '1d', updatedAt: new Date().toISOString(), isDeleted: false },
  ];

  // Using v4 keys to ensure we catch the structure update if needed, but v3 is fine if we migrate
  const [tasks, setTasks] = useLocalStorage<Task[]>('focus-matrix-tasks-v3', initialTasks);
  const [habits, setHabits] = useLocalStorage<Habit[]>('focus-matrix-habits-v3', initialHabits);
  const [hardcoreMode, setHardcoreMode] = useLocalStorage<boolean>('focus-matrix-hardcore', false);
  const [aiMode, setAiMode] = useLocalStorage<boolean>('focus-matrix-ai', false);

  // New Sync Status State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [inboxShakeTrigger, setInboxShakeTrigger] = useState(0);
  const [addSuccessTrigger, setAddSuccessTrigger] = useState(0);
  
  // New state for AI feedback
  const [aiFeedback, setAiFeedback] = useState<AiFeedback | null>(null);

  const { playSuccessSound } = useSound();
  const { classifyTaskWithAI } = useTaskClassifier();
  
  const clearAiFeedback = () => setAiFeedback(null);

  // --- Step 0: Data Migration Script ---
  useEffect(() => {
      const now = new Date().toISOString();
      let tasksChanged = false;
      let habitsChanged = false;

      const migratedTasks = tasks.map(t => {
          if (!t.updatedAt || t.isDeleted === undefined) {
              tasksChanged = true;
              return { 
                  ...t, 
                  updatedAt: t.updatedAt || new Date(t.createdAt || Date.now()).toISOString(), 
                  isDeleted: t.isDeleted || false 
              };
          }
          return t;
      });

      const migratedHabits = habits.map(h => {
          if (!h.updatedAt || h.isDeleted === undefined) {
              habitsChanged = true;
              return { 
                  ...h, 
                  updatedAt: h.updatedAt || new Date(h.createdAt || Date.now()).toISOString(), 
                  isDeleted: h.isDeleted || false 
              };
          }
          return h;
      });

      if (tasksChanged) setTasks(migratedTasks);
      if (habitsChanged) setHabits(migratedHabits);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // --- Sync Data Implementation ---
  const syncData = async (overrideTasks?: Task[], overrideHabits?: Habit[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Not logged in, skip sync

    setSyncStatus('syncing');

    // Resolve data sources - Prioritize overrides to prevent race conditions
    const currentTasks = overrideTasks ?? tasks;
    const currentHabits = overrideHabits ?? habits;

    try {
        const lastSyncTime = localStorage.getItem('focus-matrix-last-sync');
        const now = new Date().toISOString();

        // 1. PUSH: Upload local changes (Row Level)
        const tasksToPush = lastSyncTime 
            ? currentTasks.filter(t => t.updatedAt && t.updatedAt > lastSyncTime)
            : currentTasks;
        
        const habitsToPush = lastSyncTime
            ? currentHabits.filter(h => h.updatedAt && h.updatedAt > lastSyncTime)
            : currentHabits;

        if (tasksToPush.length > 0) {
            const { error } = await supabase.from('tasks').upsert(
                tasksToPush.map(t => ({ ...toSnakeCase(t), user_id: user.id }))
            );
            if (error) throw error;
        }

        if (habitsToPush.length > 0) {
            const { error } = await supabase.from('habits').upsert(
                habitsToPush.map(h => ({ ...toSnakeCase(h), user_id: user.id }))
            );
            if (error) throw error;
        }

        // 2. PULL: Get remote changes
        let remoteTasks: Task[] = [];
        let remoteHabits: Habit[] = [];
        
        const taskQuery = supabase.from('tasks').select('*');
        if (lastSyncTime) taskQuery.gt('updated_at', lastSyncTime);
        const { data: rTasks, error: tErr } = await taskQuery;
        if (tErr) throw tErr;
        if (rTasks) remoteTasks = rTasks.map(toCamelCase);

        const habitQuery = supabase.from('habits').select('*');
        if (lastSyncTime) habitQuery.gt('updated_at', lastSyncTime);
        const { data: rHabits, error: hErr } = await habitQuery;
        if (hErr) throw hErr;
        if (rHabits) remoteHabits = rHabits.map(toCamelCase);

        // 3. MERGE: Last Write Wins
        let newTasks = [...currentTasks];
        let newHabits = [...currentHabits];
        // If overrides are present (even empty arrays), we treat this as a change that MUST be committed
        let hasChanges = (overrideTasks !== undefined || overrideHabits !== undefined);

        if (remoteTasks.length > 0) {
            remoteTasks.forEach(rt => {
                const idx = newTasks.findIndex(t => t.id === rt.id);
                if (idx > -1) {
                    const localTask = newTasks[idx];
                    const remoteTime = rt.updatedAt ? new Date(rt.updatedAt).getTime() : 0;
                    const localTime = localTask.updatedAt ? new Date(localTask.updatedAt).getTime() : 0;
                    
                    if (remoteTime > localTime) {
                        newTasks[idx] = rt;
                        hasChanges = true;
                    }
                } else {
                    newTasks.push(rt);
                    hasChanges = true;
                }
            });
        }

        if (remoteHabits.length > 0) {
             remoteHabits.forEach(rh => {
                const idx = newHabits.findIndex(h => h.id === rh.id);
                if (idx > -1) {
                     const localHabit = newHabits[idx];
                     const remoteTime = rh.updatedAt ? new Date(rh.updatedAt).getTime() : 0;
                     const localTime = localHabit.updatedAt ? new Date(localHabit.updatedAt).getTime() : 0;

                     if (remoteTime > localTime) {
                         newHabits[idx] = rh;
                         hasChanges = true;
                     }
                } else {
                    newHabits.push(rh);
                    hasChanges = true;
                }
            });
        }

        if (hasChanges) {
            setTasks(newTasks);
            setHabits(newHabits);
        }

        localStorage.setItem('focus-matrix-last-sync', now);
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);

    } catch (error) {
        console.error("Auto Sync Failed:", error);
        setSyncStatus('error');
    }
  };

  // --- Auth & Smart Clean Logic ---
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN') {
            // Check if local data is purely "Demo Data"
            // Demo data criteria:
            // 1. Task IDs are 1-5, Habit IDs are h1-h2
            // 2. Counts match exactly (5 tasks, 2 habits) - meaning no new items added
            // 3. No items are completed or deleted - meaning no interaction state changed
            
            const demoTaskIds = ['1', '2', '3', '4', '5'];
            const demoHabitIds = ['h1', 'h2'];
            
            const isPureTasks = tasks.length === 5 && tasks.every(t => 
                demoTaskIds.includes(t.id) && !t.completed && !t.isDeleted
            );
            
            const isPureHabits = habits.length === 2 && habits.every(h => 
                demoHabitIds.includes(h.id) && h.completedDates.length === 0 && !h.isDeleted
            );

            if (isPureTasks && isPureHabits) {
                console.log("Smart Clean: Clearing demo data for new login.");
                setTasks([]);
                setHabits([]);
                // CRITICAL: Call syncData with empty arrays to prevent closure capture of old data
                syncData([], []);
            } else {
                // Trigger normal sync
                syncData();
            }
        }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, habits]); 
  // Dependency on tasks/habits is tricky here. 
  // Realistically, the effect runs on mount, captures current state closure. 
  // If we want it to check *current* state when auth changes, we need the deps.

  // --- Auto-Sync Triggers ---
  
  // 1. Debounce Sync on Change (3 seconds)
  useEffect(() => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      
      // Only set timer if we suspect we are logged in (optimization)
      // We don't want to spam if not logged in, but syncData handles the "no user" check gracefully.
      syncTimerRef.current = setTimeout(() => {
          syncData();
      }, 3000);

      return () => {
          if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      };
  }, [tasks, habits]);

  // 2. Sync on Window Focus
  useEffect(() => {
      const onFocus = () => syncData();
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
  }, []);

  // --- Helpers for Sync ---
  const syncLocalData = (newTasks: Task[], newHabits: Habit[]) => {
      setTasks(newTasks);
      setHabits(newHabits);
  };

  // --- CRUD Operations (Updated for Soft Delete & Timestamps) ---

  const addTask = async (title: string, category: CategoryId = 'inbox', date?: string, description?: string, duration?: string) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const newTask: Task = { 
        id: tempId, 
        title, 
        description, 
        category, 
        createdAt: Date.now(), 
        completed: false, 
        plannedDate: date, 
        duration, 
        autoSorted: false,
        updatedAt: now,
        isDeleted: false
    };
    setTasks(prev => [newTask, ...prev]);
    if (category === 'inbox') setInboxShakeTrigger(prev => prev + 1);
    setAddSuccessTrigger(prev => prev + 1);

    if (aiMode && category === 'inbox' && DEEPSEEK_API_KEY) {
        try {
            const aiResult = await classifyTaskWithAI(title, description);
            
            if (aiResult.error === 'quota') {
                setAiFeedback({ message: "⚠️ AI Busy (Rate Limit)", type: 'error' });
                if (navigator.vibrate) navigator.vibrate(INTERACTION.VIBRATION.SOFT);
            }
            else if (aiResult.error === 'model_not_found') {
                setAiFeedback({ message: "⚠️ AI Model Not Found", type: 'error' });
            }
            else if (aiResult.category !== 'inbox' && !aiResult.error) {
                const finalDuration = duration || aiResult.duration;
                // updateTask handles timestamp update
                updateTask(tempId, { category: aiResult.category, duration: finalDuration, autoSorted: true });
                if (navigator.vibrate) navigator.vibrate(INTERACTION.VIBRATION.AI_AUTO_SORT);
                
                const durationText = finalDuration ? ` (${finalDuration})` : '';
                setAiFeedback({
                    message: `${t('ai.sorted')} ${aiResult.category.toUpperCase()}${durationText}`,
                    type: 'success'
                });
            } else {
                setAiFeedback({ message: t('ai.unsure'), type: 'neutral' });
            }
            setTimeout(() => setAiFeedback(null), 3500);
            
        } catch (e) { 
            console.warn("AI Auto-sort failed", e); 
        }
    }
  };

  const updateTask = (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        ...updates,
        updatedAt: new Date().toISOString()
    } : t));
  };

  const moveTask = (taskId: string, targetCategory: CategoryId) => {
    updateTask(taskId, { category: targetCategory });
  };

  const reorderTask = (taskId: string, newCategory: CategoryId, newIndex: number) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      
      const now = new Date().toISOString();
      const updatedTask = { ...task, category: newCategory, updatedAt: now };

      // We need to operate on the full list to maintain data integrity, 
      // but conceptually we are moving within the "active" list.
      const filtered = prev.filter(t => t.id !== taskId);
      
      // Get all active tasks for the target category to find insertion point
      const categoryTasks = filtered.filter(t => t.category === newCategory && !t.completed && !t.isDeleted);
      
      const newTasks = [...filtered];
      
      // Logic to insert at correct visual position
      if (categoryTasks.length === 0) {
          // Empty category, push to end (or beginning, doesn't matter)
          newTasks.push(updatedTask);
      } else if (newIndex >= categoryTasks.length) {
          // Insert after the last item of that category
          const lastItem = categoryTasks[categoryTasks.length - 1];
          const lastIndex = newTasks.findIndex(t => t.id === lastItem.id);
          newTasks.splice(lastIndex + 1, 0, updatedTask);
      } else {
          // Insert before the item at newIndex
          const targetItem = categoryTasks[newIndex];
          const targetIndex = newTasks.findIndex(t => t.id === targetItem.id);
          newTasks.splice(targetIndex, 0, updatedTask);
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
        return { 
            ...t, 
            completed: isNowCompleted, 
            completedAt: isNowCompleted ? Date.now() : undefined,
            updatedAt: new Date().toISOString()
        };
    }));
  };

  // SOFT DELETE
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { 
        ...t, 
        isDeleted: true, 
        updatedAt: new Date().toISOString() 
    } : t));
  };

  const addHabit = (title: string, color: string, frequency: string) => {
      const newHabit: Habit = {
          id: Math.random().toString(36).substr(2, 9),
          title, color, icon: 'Check', createdAt: Date.now(),
          completedDates: [], streak: 0, frequency,
          updatedAt: new Date().toISOString(),
          isDeleted: false
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
          return { 
              ...h, 
              completedDates: newDates, 
              streak: currentStreak,
              updatedAt: new Date().toISOString()
          };
      }));
  };

  // SOFT DELETE HABIT
  const deleteHabit = (habitId: string) => { 
      setHabits(prev => prev.map(h => h.id === habitId ? {
          ...h,
          isDeleted: true,
          updatedAt: new Date().toISOString()
      } : h));
  };

  // Hard Reset (Still clears all, but maybe we should soft delete all? For now, clear is destructive)
  const clearAllTasks = () => { setTasks([]); setHabits([]); };
  
  // Restore (Legacy/Full Overwrite)
  const restoreTasks = (data: { tasks: Task[], habits: Habit[] }) => { 
      if (data.tasks) setTasks(data.tasks); 
      if (data.habits) setHabits(data.habits); 
  };
  
  // Filter active tasks for UI
  const activeTasks = tasks.filter(t => !t.isDeleted);
  const activeHabits = habits.filter(h => !h.isDeleted);

  const getTasksByCategory = (category: CategoryId) => activeTasks.filter(t => t.category === category && !t.completed);
  const toggleHardcoreMode = () => setHardcoreMode(prev => !prev);

  return (
    <TaskContext.Provider value={{ 
      tasks: activeTasks, // UI sees only non-deleted
      habits: activeHabits,
      rawTasks: tasks, // Sync engine sees everything
      rawHabits: habits,
      syncLocalData,
      
      // New Sync Infrastructure Exposed
      syncStatus,
      syncData,
      
      addTask, updateTask, moveTask, reorderTask, completeTask, deleteTask, getTasksByCategory,
      addHabit, toggleHabit, deleteHabit,
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
