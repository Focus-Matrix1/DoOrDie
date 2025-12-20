
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

/**
 * ------------------------------------------------------------------
 * Swipeable Task Component (Optimized for Gesture Precision)
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

  const blueOpacity = useTransform(x, [0, 40], [0, 1]);
  const redOpacity = useTransform(x, [-40, 0], [1, 0]);

  // Handle global retract to close menus when clicking elsewhere
  useEffect(() => {
    if (menuSide === 'none') return;
    const handleGlobalInteraction = (e: any) => {
        if (e.target.closest('.action-btn-trigger')) return;
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 40 } });
        setMenuSide('none');
    };
    window.addEventListener('touchstart', handleGlobalInteraction, true);
    window.addEventListener('mousedown', handleGlobalInteraction, true);
    window.addEventListener('scroll', handleGlobalInteraction, true);
    return () => {
      window.removeEventListener('touchstart', handleGlobalInteraction, true);
      window.removeEventListener('mousedown', handleGlobalInteraction, true);
      window.removeEventListener('scroll', handleGlobalInteraction, true);
    };
  }, [menuSide, controls]);

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
            await controls.start({ x: 0 });
            setMenuSide('none');
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

  return (
    <div className="relative w-full mb-3 overflow-hidden rounded-2xl select-none">
        {/* Background Action Layer */}
        <div className="absolute inset-0 z-0">
            {/* Left Action (Blue) */}
            <motion.div style={{ opacity: blueOpacity }} className="absolute inset-0 bg-blue-500">
                <motion.button 
                    onTap={() => onCategorize(task)}
                    className="action-btn-trigger absolute left-0 top-0 bottom-0 w-20 flex flex-col items-center justify-center text-white active:brightness-90 transition-all"
                >
                    <LayoutGrid size={22} />
                    <span className="text-[10px] font-bold mt-1">归类</span>
                </motion.button>
            </motion.div>

            {/* Right Action (Red) */}
            <motion.div style={{ opacity: redOpacity }} className="absolute inset-0 bg-red-500">
                <motion.button 
                    onTap={() => onDelete(task.id)}
                    className="action-btn-trigger absolute right-0 top-0 bottom-0 w-20 flex flex-col items-center justify-center text-white active:brightness-90 transition-all"
                >
                    <Trash2 size={22} />
                    <span className="text-[10px] font-bold mt-1">删除</span>
                </motion.button>
            </motion.div>
        </div>

        {/* Foreground Content Layer */}
        <motion.div
            drag={isLocked ? false : "x"}
            dragDirectionLock
            dragConstraints={
                menuSide === 'right' ? { left: -ACTION_WIDTH, right: 0 } :
                menuSide === 'left' ? { left: 0, right: ACTION_WIDTH } :
                { left: -500, right: 500 }
            }
            dragElastic={0.08}
            onDragEnd={handleDragEnd}
            animate={controls}
            style={{ x }}
            // CRITICAL FIX: Use onTap instead of onClick. 
            // onTap ignores interactions where the user has dragged (moved) their finger.
            onTap={() => { if(menuSide === 'none') onClick(task); }}
            className={`relative z-10 bg-white shadow-sm border border-gray-100 flex items-center gap-3 transition-transform ${
                isInbox ? 'p-3 rounded-xl' : `p-4 rounded-2xl`
            }`}
        >
            {!isInbox && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.bg}`}></div>}
            
            <motion.div 
                className={`checkbox-area ${isInbox ? 'w-4 h-4' : 'w-5 h-5 mt-0.5'} rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-all ${
                    isInbox ? 'border-gray-300' : `${config.checkboxBorder} ${config.checkboxBg}`
                } ${task.completed ? 'bg-green-500 !border-green-500' : ''}`}
                onTap={(e) => { e.stopPropagation(); onComplete(task.id); }}
            >
                 {task.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : !isInbox && <Check className={`w-3 h-3 stroke-[3] opacity-0 group-hover:opacity-100 transition-opacity ${config.checkColor}`} />}
            </motion.div>

            <div className={`flex flex-col flex-1 overflow-hidden ${isInbox ? 'justify-center' : ''}`}>
                <span className={`${isInbox ? 'text-[14px] font-medium text-gray-700' : 'text-[16px] font-semibold text-gray-900 leading-snug'} truncate ${task.completed ? 'text-gray-400 line-through' : ''}`}>
                    {task.title}
                </span>
                {!isInbox && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-tight ${config.badgeBg} ${config.text}`}>
                            {(({inbox: '收集箱', q1:'Q1', q2:'Q2', q3:'Q3', q4:'Q4'} as any)[task.category])}
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
  const completedTasks = tasks.filter(task => task.completed && task.plannedDate === selectedDate);

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
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">收集箱</span>
                    </div>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-bold">{sortedInbox.length}</span>
                </div>
                 <div className="space-y-1">
                    {sortedInbox.map(task => (
                        <SwipeableTask 
                            key={task.id} 
                            task={task} 
                            onCategorize={setCategorizingTask} 
                            onDelete={deleteTask} 
                            onComplete={completeTask} 
                            onClick={setEditingTask} 
                            t={t} 
                            hardcoreMode={hardcoreMode} 
                        />
                    ))}
                 </div>
            </div>
        )}

        {sortedActive.length > 0 && (
            <div className="mb-6 space-y-1">
                <div className="px-3 py-2 flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">今日计划</span>
                </div>
                {sortedActive.map(task => (
                    <SwipeableTask 
                        key={task.id} 
                        task={task} 
                        onCategorize={setCategorizingTask} 
                        onDelete={deleteTask} 
                        onComplete={completeTask} 
                        onClick={setEditingTask} 
                        t={t} 
                        hardcoreMode={hardcoreMode} 
                    />
                ))}
            </div>
        )}

        {completedTasks.length > 0 && (
            <div className="mb-6">
                <button onClick={() => setIsCompletedExpanded(!isCompletedExpanded)} className="flex items-center gap-2 mb-3 ml-1 group">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">
                        已完成 ({completedTasks.length})
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
                                     <span className="text-[15px] font-medium text-gray-400 line-through truncate">{task.title}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}
      </div>

      {editingTask && <TaskDetailModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={updateTask} onDelete={deleteTask} t={t} />}
      {categorizingTask && <CategorySheet task={categorizingTask} onClose={() => setCategorizingTask(null)} onMove={(id, cat) => updateTask(id, { category: cat })} />}
    </div>
  );
};
