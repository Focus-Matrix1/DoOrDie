
import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence, PanInfo } from 'framer-motion';
import { LayoutGrid, Trash2, CheckCircle2, Check, Hourglass, ChevronDown, ChevronRight, Inbox } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Task, CategoryId } from '../types';
import { WeeklyCalendar } from './WeeklyCalendar';
import { CategorySheet } from './CategorySheet';
import { TaskDetailModal } from './TaskDetailModal';
import { LAYOUT, ANIMATION_DURATIONS } from '../constants';

// --- Digital Reconstruction Entrance Animation (Shared Style) ---
const GlitchEntrance: React.FC<{ children: React.ReactNode; taskCreatedAt: number; isAutoSorted?: boolean }> = ({ children, taskCreatedAt, isAutoSorted }) => {
    // 1. Lock "isNew" status on mount. 
    // Updated Logic: Only trigger if task is new AND auto-sorted.
    const [isNew] = useState(() => (Date.now() - taskCreatedAt < 5000) && !!isAutoSorted);
    const [showContent, setShowContent] = useState(!isNew);

    useEffect(() => {
        if (isNew) {
            const timer = setTimeout(() => setShowContent(true), 800);
            return () => clearTimeout(timer);
        }
    }, [isNew]);

    // 2. Elevate z-index during animation to prevent subsequent siblings from covering the overlay
    return (
        <motion.div 
            layout
            initial={{ opacity: isNew ? 0 : 1 }}
            animate={{ opacity: 1 }}
            exit={{ 
                opacity: 0,
                scaleY: 0,
                filter: "brightness(3)", // Flash effect
                backgroundColor: "#22c55e", // Hint of matrix green
                marginBottom: 0,
                transition: { duration: 0.25, ease: "backIn" }
            }}
            className={`relative w-full origin-center ${!showContent ? 'z-30' : 'z-0'}`}
        >
            <motion.div
                initial={{ opacity: isNew ? 0 : 1 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                transition={{ duration: 0.1 }}
            >
                {children}
            </motion.div>

            <AnimatePresence>
                {!showContent && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ 
                            opacity: 0, 
                            scale: 1.02, 
                            filter: "brightness(2) blur(4px)", 
                        }} 
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute inset-0 z-20 bg-[#0F172A] rounded-2xl overflow-hidden flex flex-col justify-center px-4 gap-2 shadow-lg border border-emerald-500/30"
                    >
                        <div className="space-y-1.5 opacity-90">
                             <motion.div 
                                className="h-2 bg-emerald-400 rounded-sm shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                                initial={{ width: "0%" }} 
                                animate={{ width: "70%" }} 
                                transition={{ duration: 0.5, ease: "circOut" }}
                            />
                            <motion.div 
                                className="h-1.5 bg-emerald-700/60 rounded-sm"
                                initial={{ width: "0%" }} 
                                animate={{ width: "40%" }} 
                                transition={{ duration: 0.6, delay: 0.1 }}
                            />
                        </div>
                        <motion.div 
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent"
                            initial={{ top: "-100%" }}
                            animate={{ top: "200%" }}
                            transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
                        />
                         <div className="absolute top-3 right-3 flex gap-1">
                            <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.8)]"></div>
                            <div className="w-1 h-1 bg-emerald-900 rounded-full"></div>
                        </div>
                        <div className="absolute bottom-1 right-2 text-[6px] font-mono text-emerald-800 opacity-60">
                            CONSTRUCTING...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/**
 * ------------------------------------------------------------------
 * Swipeable Task Component (Fixed Visual Logic)
 * ------------------------------------------------------------------
 */
const SwipeableTask: React.FC<{ 
  task: Task; 
  onCategorize: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onClick: (task: Task) => void;
  t: (key: string) => string;
  hardcoreMode: boolean;
}> = ({ task, onCategorize, onDelete, onComplete, onClick, t, hardcoreMode }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [menuSide, setMenuSide] = useState<'none' | 'left' | 'right'>('none');
  
  const ACTION_WIDTH = 80;
  const isInbox = task.category === 'inbox';
  const isLocked = hardcoreMode && !isInbox;

  // Correcting the overlap: Blue only shows when x > 0, Red only when x < 0
  const blueOpacity = useTransform(x, [0, 20], [0, 1]);
  const redOpacity = useTransform(x, [-20, 0], [1, 0]);

  const retract = (instant = false) => {
    controls.start({ x: 0, transition: instant ? { duration: 0.1 } : { type: 'spring', stiffness: 500, damping: 40 } });
    setMenuSide('none');
  };

  useEffect(() => {
    if (menuSide === 'none') return;
    const handleGlobalInteraction = (e: any) => {
        if (e.target.closest('.action-btn-trigger')) return;
        retract();
    };
    window.addEventListener('touchstart', handleGlobalInteraction, true);
    window.addEventListener('mousedown', handleGlobalInteraction, true);
    return () => {
      window.removeEventListener('touchstart', handleGlobalInteraction, true);
      window.removeEventListener('mousedown', handleGlobalInteraction, true);
    };
  }, [menuSide]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (isLocked) { controls.start({ x: 0 }); return; }
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (menuSide === 'none') {
        if (offset < -40 || velocity < -150) {
            await controls.start({ x: -ACTION_WIDTH, transition: { type: 'spring', stiffness: 500, damping: 40 } });
            setMenuSide('right');
        } else if (offset > 40 || velocity > 150) {
            await controls.start({ x: ACTION_WIDTH, transition: { type: 'spring', stiffness: 500, damping: 40 } });
            setMenuSide('left');
        } else {
            controls.start({ x: 0 });
        }
    } else {
        const shouldClose = (menuSide === 'right' && offset > 20) || (menuSide === 'left' && offset < -20);
        if (shouldClose || Math.abs(velocity) > 150) {
            retract();
        } else {
            await controls.start({ x: menuSide === 'right' ? -ACTION_WIDTH : ACTION_WIDTH });
        }
    }
  };

  const categoryConfig = {
      q1: { bg: 'bg-rose-500', border: 'border-rose-100', text: 'text-rose-700', badgeBg: 'bg-rose-100', checkboxBorder: 'border-rose-200', checkboxBg: 'bg-rose-50', checkColor: 'text-rose-500' },
      q2: { bg: 'bg-blue-500', border: 'border-blue-100', text: 'text-blue-700', badgeBg: 'bg-blue-100', checkboxBorder: 'border-blue-200', checkboxBg: 'bg-blue-50', checkColor: 'text-blue-500' },
      q3: { bg: 'bg-amber-400', border: 'border-amber-100', text: 'text-amber-700', badgeBg: 'bg-amber-100', checkboxBorder: 'border-amber-200', checkboxBg: 'bg-amber-50', checkColor: 'text-amber-500' },
      q4: { bg: 'bg-slate-400', border: 'border-slate-100', text: 'text-slate-700', badgeBg: 'bg-slate-100', checkboxBorder: 'border-slate-200', checkboxBg: 'bg-slate-50', checkColor: 'text-slate-500' },
      inbox: { bg: 'bg-gray-400', border: 'border-gray-200', text: 'text-gray-500', badgeBg: 'bg-gray-100', checkboxBorder: 'border-gray-300', checkboxBg: 'bg-white', checkColor: 'text-gray-500' }
  };
  const config = categoryConfig[task.category] || categoryConfig.inbox;
  
  // Dynamic Localization
  const displayTitle = task.translationKey ? t(task.translationKey) : task.title;

  return (
    <div className="relative w-full mb-3 overflow-visible rounded-2xl select-none">
        {/* Background Action Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
            {/* Left Action (Blue) - Only visible when swiping RIGHT (x > 0) */}
            <motion.div 
                style={{ 
                  opacity: blueOpacity, 
                  pointerEvents: menuSide === 'left' ? 'auto' : 'none',
                  zIndex: menuSide === 'left' ? 30 : 0 
                }} 
                className="absolute inset-0 bg-blue-600"
            >
                <motion.button 
                    onPointerDown={(e) => e.stopPropagation()}
                    onTap={(e) => { 
                      onCategorize(task); 
                      retract(true); 
                    }}
                    whileTap={{ backgroundColor: '#1d4ed8', scale: 0.95 }}
                    className="action-btn-trigger absolute left-0 top-0 bottom-0 w-20 flex flex-col items-center justify-center text-white"
                >
                    <LayoutGrid size={22} strokeWidth={2.5} />
                    <span className="text-[11px] font-black mt-1 uppercase tracking-tighter">{t('list.action.categorize')}</span>
                </motion.button>
            </motion.div>

            {/* Right Action (Red) - Only visible when swiping LEFT (x < 0) */}
            <motion.div 
                style={{ 
                  opacity: redOpacity, 
                  pointerEvents: menuSide === 'right' ? 'auto' : 'none',
                  zIndex: menuSide === 'right' ? 30 : 0 
                }} 
                className="absolute inset-0 bg-red-600"
            >
                <motion.button 
                    onPointerDown={(e) => e.stopPropagation()}
                    onTap={(e) => { 
                      onDelete(task.id); 
                      retract(true); 
                    }}
                    whileTap={{ backgroundColor: '#b91c1c', scale: 0.95 }}
                    className="action-btn-trigger absolute right-0 top-0 bottom-0 w-20 flex flex-col items-center justify-center text-white"
                >
                    <Trash2 size={22} strokeWidth={2.5} />
                    <span className="text-[11px] font-black mt-1 uppercase tracking-tighter">{t('list.action.delete')}</span>
                </motion.button>
            </motion.div>
        </div>

        {/* Foreground Content Layer */}
        <motion.div
            drag={isLocked ? false : "x"}
            dragDirectionLock
            dragConstraints={{ left: -ACTION_WIDTH, right: ACTION_WIDTH }}
            dragElastic={0.08}
            onDragEnd={handleDragEnd}
            animate={controls}
            style={{ x }}
            onTap={(event) => { 
                const target = event.target as HTMLElement;
                // CRITICAL FIX: Direct check to see if we clicked the checkbox area
                if (target.closest('.checkbox-area')) return;
                
                if(menuSide === 'none') onClick(task); 
                else retract(); 
            }}
            className={`relative z-10 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 flex items-center gap-3 ${
                isInbox ? 'p-3 rounded-xl' : `py-4 pr-4 pl-5 rounded-2xl`
            }`}
        >
            {!isInbox && (
                <div className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full ${config.bg}`}></div>
            )}
            
            <div 
                className={`checkbox-area ${isInbox ? 'w-4 h-4' : 'w-5 h-5 mt-0.5'} rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    isInbox ? 'border-gray-300' : `${config.checkboxBorder} ${config.checkboxBg}`
                } ${task.completed ? 'bg-green-500 !border-green-500' : ''}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                     e.stopPropagation();
                     onComplete(task.id);
                }}
            >
                 {task.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : !isInbox && <Check className={`w-3 h-3 stroke-[3] opacity-0 group-hover:opacity-100 transition-opacity ${config.checkColor}`} />}
            </div>

            <div className={`flex flex-col flex-1 overflow-hidden ${isInbox ? 'justify-center' : ''}`}>
                <span className={`${isInbox ? 'text-[14px] font-medium text-gray-700' : 'text-[16px] font-semibold text-gray-900 leading-snug'} truncate ${task.completed ? 'text-gray-400 line-through' : ''}`}>
                    {displayTitle}
                </span>
                {!isInbox && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-tight ${config.badgeBg} ${config.text}`}>
                            {(({inbox: t('matrix.inbox'), q1:'Q1', q2:'Q2', q3:'Q3', q4:'Q4'} as any)[task.category])}
                        </span>
                        {(task.duration || task.description) && <div className="h-1 w-1 rounded-full bg-gray-300"></div>}
                        {task.duration && <span className={`flex items-center gap-1 text-[12px] font-medium ${config.text.replace('700', '600')}`}><Hourglass className="w-3 h-3" /> {task.duration}</span>}
                        {task.description && <span className="text-[12px] text-gray-500 truncate max-w-[140px]">{task.description}</span>}
                    </div>
                )}
            </div>
        </motion.div>
    </div>
  );
};

export const ListView: React.FC = () => {
  const { tasks, completeTask, deleteTask, selectedDate, updateTask, hardcoreMode } = useTasks();
  const { t } = useLanguage();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [categorizingTask, setCategorizingTask] = useState<Task | null>(null);
  const [showInboxZeroAnim, setShowInboxZeroAnim] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const showUndatedTasks = selectedDate >= todayStr;

  const inboxTasks = tasks.filter(task => !task.completed && task.category === 'inbox');
  const activeTasks = tasks.filter(task => {
      if (task.completed || task.category === 'inbox') return false;
      return task.plannedDate === selectedDate || (!task.plannedDate && showUndatedTasks);
  });
  
  // FIX: Completed tasks filter was too strict, excluding tasks completed today but planned for other days (or undated)
  const completedTasks = tasks.filter(task => {
      if (!task.completed) return false;
      // 1. Matches planned date
      if (task.plannedDate === selectedDate) return true;
      // 2. Was completed on this date (regardless of plan)
      if (task.completedAt) {
          const d = new Date(task.completedAt);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const completedDateStr = `${year}-${month}-${day}`;
          return completedDateStr === selectedDate;
      }
      return false;
  });

  const prevInboxCount = useRef(inboxTasks.length);
  useEffect(() => {
    if (prevInboxCount.current > 0 && inboxTasks.length === 0) {
        setShowInboxZeroAnim(true);
        const timer = setTimeout(() => setShowInboxZeroAnim(false), ANIMATION_DURATIONS.INBOX_ZERO_CELEBRATION);
        return () => clearTimeout(timer);
    }
    prevInboxCount.current = inboxTasks.length;
  }, [inboxTasks.length]);

  const sortedActive = [...activeTasks].sort((a, b) => b.createdAt - a.createdAt);
  const sortedInbox = [...inboxTasks].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="w-full h-full flex flex-col bg-[#F5F7FA] relative">
      <WeeklyCalendar />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 pt-4">
        {showInboxZeroAnim && (
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 mb-6 shadow-lg animate-bounce">
                <p className="text-white text-center font-bold text-lg">{t('list.inbox_zero.celebrate')}</p>
            </div>
        )}

        {sortedInbox.length > 0 && (
            <div className="mb-8">
                 <div className="px-3 py-2 flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('list.header.inbox')}</span>
                    </div>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-bold">{sortedInbox.length}</span>
                </div>
                 <div className="space-y-1">
                    <AnimatePresence mode="popLayout">
                        {sortedInbox.map(task => (
                            <GlitchEntrance key={task.id} taskCreatedAt={task.createdAt} isAutoSorted={task.autoSorted}>
                                <SwipeableTask 
                                    task={task} 
                                    onCategorize={setCategorizingTask} 
                                    onDelete={deleteTask} 
                                    onComplete={completeTask} 
                                    onClick={setEditingTask} 
                                    t={t} 
                                    hardcoreMode={hardcoreMode} 
                                />
                            </GlitchEntrance>
                        ))}
                    </AnimatePresence>
                 </div>
            </div>
        )}

        {sortedActive.length > 0 && (
            <div className="mb-6 space-y-1">
                <div className="px-3 py-2 flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{t('list.header.today')}</span>
                </div>
                <AnimatePresence mode="popLayout">
                    {sortedActive.map(task => (
                        <GlitchEntrance key={task.id} taskCreatedAt={task.createdAt} isAutoSorted={task.autoSorted}>
                            <SwipeableTask 
                                task={task} 
                                onCategorize={setCategorizingTask} 
                                onDelete={deleteTask} 
                                onComplete={completeTask} 
                                onClick={setEditingTask} 
                                t={t} 
                                hardcoreMode={hardcoreMode} 
                            />
                        </GlitchEntrance>
                    ))}
                </AnimatePresence>
            </div>
        )}

        {completedTasks.length > 0 && (
            <div className="mb-6">
                <button onClick={() => setIsCompletedExpanded(!isCompletedExpanded)} className="flex items-center gap-2 mb-3 ml-1 group">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">
                        {t('list.header.completed')} ({completedTasks.length})
                    </span>
                    {isCompletedExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                </button>
                <AnimatePresence>
                    {isCompletedExpanded && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-2"
                        >
                            {completedTasks.map(task => (
                                <motion.div 
                                    key={task.id} 
                                    onTap={() => completeTask(task.id)}
                                    className="bg-white/60 p-4 flex items-center gap-3 border border-gray-100 rounded-2xl opacity-80 active:scale-[0.98] transition-transform"
                                >
                                     <div className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                     </div>
                                     <span className="text-[15px] font-medium text-gray-400 line-through truncate">{task.translationKey ? t(task.translationKey) : task.title}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}
      </div>

      {editingTask && <TaskDetailModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={updateTask} onDelete={deleteTask} t={t} />}
      {categorizingTask && (
        <CategorySheet 
          task={categorizingTask} 
          onClose={() => setCategorizingTask(null)} 
          onMove={(id, cat) => updateTask(id, { category: cat })} 
        />
      )}
    </div>
  );
};
