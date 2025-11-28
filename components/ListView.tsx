import React, { useState, useRef } from 'react';
import { LayoutGrid, Trash2, CheckCircle2, Check, Hourglass } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Task, CategoryId } from '../types';
import { WeeklyCalendar } from './WeeklyCalendar';
import { TaskDetailModal } from './TaskDetailModal';

// --- Swipeable Task Item ---
const SwipeableTask: React.FC<{ 
  task: Task; 
  onCategorize: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onClick: (task: Task) => void;
  t: (key: string) => string;
}> = ({ task, onCategorize, onDelete, onComplete, onClick, t }) => {
  const [offset, setOffset] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const directionLock = useRef<'horizontal' | 'vertical' | null>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  const isInbox = task.category === 'inbox';

  const categoryConfig = {
      q1: { bg: 'bg-rose-500', border: 'border-rose-100', text: 'text-rose-700', badgeBg: 'bg-rose-100', checkboxBorder: 'border-rose-200', checkboxBg: 'bg-rose-50', checkColor: 'text-rose-500' },
      q2: { bg: 'bg-blue-500', border: 'border-blue-100', text: 'text-blue-700', badgeBg: 'bg-blue-100', checkboxBorder: 'border-blue-200', checkboxBg: 'bg-blue-50', checkColor: 'text-blue-500' },
      q3: { bg: 'bg-amber-400', border: 'border-amber-100', text: 'text-amber-700', badgeBg: 'bg-amber-100', checkboxBorder: 'border-amber-200', checkboxBg: 'bg-amber-50', checkColor: 'text-amber-500' },
      q4: { bg: 'bg-slate-400', border: 'border-slate-100', text: 'text-slate-700', badgeBg: 'bg-slate-100', checkboxBorder: 'border-slate-200', checkboxBg: 'bg-slate-50', checkColor: 'text-slate-500' },
      inbox: { bg: 'bg-gray-400', border: 'border-gray-200', text: 'text-gray-500', badgeBg: 'bg-gray-100', checkboxBorder: 'border-gray-300', checkboxBg: 'bg-white', checkColor: 'text-gray-500' }
  };

  const config = categoryConfig[task.category] || categoryConfig.inbox;

  const priorityLabels: Record<string, string> = {
      inbox: t('matrix.inbox'),
      q1: 'Q1',
      q2: 'Q2',
      q3: 'Q3',
      q4: 'Q4'
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.checkbox-area')) return;
    
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    isDragging.current = true;
    directionLock.current = null;
    startX.current = e.clientX;
    startY.current = e.clientY;
    setIsTriggered(false);
    
    if (itemRef.current) itemRef.current.style.transition = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const currentX = e.clientX;
    const currentY = e.clientY;
    const dx = currentX - startX.current;
    const dy = currentY - startY.current;

    // --- Direction Lock ---
    if (!directionLock.current) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            if (Math.abs(dx) > Math.abs(dy)) {
                directionLock.current = 'horizontal';
            } else {
                directionLock.current = 'vertical';
                isDragging.current = false; 
                return; 
            }
        }
    }

    if (directionLock.current === 'horizontal') {
        let newOffset = dx;
        // Limit swipe range
        if (newOffset > 150) newOffset = 150 + (newOffset - 150) * 0.2; 
        if (newOffset < -150) newOffset = -150 + (newOffset + 150) * 0.2;
        setOffset(newOffset);
        
        // Visual feedback
        // Swipe Right (Positive) -> Categorize (Blue)
        if (newOffset > 80 && !isTriggered) setIsTriggered(true);
        if (newOffset < 80 && newOffset > 0 && isTriggered) setIsTriggered(false);

        // Swipe Left (Negative) -> Delete (Red)
        if (newOffset < -100 && !isTriggered) setIsTriggered(true);
        if (newOffset > -100 && newOffset < 0 && isTriggered) setIsTriggered(false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (itemRef.current) itemRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';

    if (offset > 80) {
        // Right -> Categorize
        setOffset(0); 
        onCategorize(task);
    } else if (offset < -100) {
        // Left -> Delete
        setOffset(-1000); 
        setTimeout(() => onDelete(task.id), 300);
    } else {
        setOffset(0);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden group select-none touch-pan-y">
        {/* Background Actions */}
        <div className="absolute inset-0 flex z-0 rounded-2xl overflow-hidden">
            {/* Left Side (revealed by swiping right) - Blue Categorize */}
            <div className={`w-full h-full flex items-center justify-start pl-6 text-white font-bold text-sm transition-colors duration-300 ${isTriggered && offset > 0 ? 'bg-blue-600' : 'bg-blue-500'}`}>
                <span className="flex items-center gap-2 transform transition-transform duration-200" style={{ transform: isTriggered && offset > 0 ? 'scale(1.1)' : 'scale(1)' }}>
                   <LayoutGrid className="w-5 h-5 mr-1" /> {t('list.action.categorize')}
                </span>
            </div>
            
            {/* Right Side (revealed by swiping left) - Red Delete */}
            <div className={`absolute right-0 top-0 bottom-0 w-full h-full flex items-center justify-end pr-6 text-white font-bold text-sm transition-colors duration-300 ${isTriggered && offset < 0 ? 'bg-red-600' : 'bg-red-500'}`}>
                <Trash2 className={`w-5 h-5 ml-1 ${isTriggered && offset < 0 ? 'scale-125' : ''} transition-transform`} /> {t('list.action.delete')}
            </div>
        </div>

        {/* Foreground Content */}
        <div 
            ref={itemRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={(e) => {
                if (Math.abs(offset) < 5 && !(e.target as HTMLElement).closest('.checkbox-area')) {
                    onClick(task);
                }
            }}
            style={{ transform: `translateX(${offset}px)` }}
            className={`absolute inset-0 bg-white z-10 transition-transform active:scale-[0.99] cursor-pointer 
                ${isInbox 
                    ? 'p-3 flex items-center gap-3 border border-gray-100 rounded-xl shadow-sm hover:shadow-md' 
                    : `p-4 flex items-start gap-3 border ${config.border} shadow-sm rounded-2xl hover:shadow-md`
                }
            `}
        >
            {/* Color Strip for Non-Inbox */}
            {!isInbox && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.bg}`}></div>}

            {/* Checkbox */}
            <div 
                className={`checkbox-area ${isInbox ? 'w-4 h-4' : 'w-5 h-5 mt-0.5'} rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-300 cursor-pointer
                    ${isInbox 
                        ? 'border-gray-300' 
                        : `${config.checkboxBorder} ${config.checkboxBg}`
                    }
                    ${task.completed ? 'bg-green-500 !border-green-500' : ''}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    onComplete(task.id);
                }}
            >
                 {task.completed ? (
                     <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                 ) : (
                    // Show Check icon on hover for non-inbox tasks (handled via opacity in logic if needed, but here simple static)
                    !isInbox && <Check className={`w-3 h-3 stroke-[3] opacity-0 group-hover:opacity-100 transition-opacity ${config.checkColor}`} />
                 )}
            </div>

            {/* Content Area */}
            <div className={`flex flex-col flex-1 overflow-hidden ${isInbox ? 'justify-center' : ''}`}>
                <span className={`${isInbox ? 'text-[14px] font-medium text-gray-700' : 'text-[16px] font-semibold text-gray-900 leading-snug'} truncate transition-all ${task.completed ? 'text-gray-400 line-through' : ''}`}>
                    {task.title}
                </span>
                
                {/* Meta Row (Only for Non-Inbox) */}
                {!isInbox && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-tight ${config.badgeBg} ${config.text}`}>
                            {priorityLabels[task.category]}
                        </span>
                        
                        {(task.duration || task.description) && <div className="h-1 w-1 rounded-full bg-gray-300"></div>}
                        
                        {task.duration && (
                            <span className={`flex items-center gap-1 text-[12px] font-medium ${config.text.replace('700', '600')}`}>
                                <Hourglass className="w-3 h-3" /> {task.duration}
                            </span>
                        )}

                        {task.description && (
                            <span className="text-[12px] text-gray-500 truncate max-w-[120px]">
                                {task.description}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export const ListView: React.FC = () => {
  const { tasks, completeTask, deleteTask, selectedDate, updateTask } = useTasks();
  const { t } = useLanguage();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasksForDate = tasks.filter(task => !task.completed && task.plannedDate === selectedDate);
  const backlogTasks = tasks.filter(task => !task.completed && !task.plannedDate);
  const completedTasks = tasks.filter(task => task.completed && task.plannedDate === selectedDate);

  const sortTasks = (taskList: Task[]) => {
      const priorityOrder: Record<CategoryId, number> = { 'inbox': 0, 'q1': 1, 'q2': 2, 'q3': 3, 'q4': 4 };
      return [...taskList].sort((a, b) => {
          const pDiff = priorityOrder[a.category] - priorityOrder[b.category];
          if (pDiff !== 0) return pDiff;
          return b.createdAt - a.createdAt;
      });
  };

  const sortedPlanned = sortTasks(tasksForDate);
  const sortedBacklog = sortTasks(backlogTasks);

  const handleCategorize = (task: Task) => {
      setEditingTask(task);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F5F7FA] relative">
      <WeeklyCalendar />

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 pt-4">
        
        {/* Inbox / Backlog Section (Styled as Inbox Container) */}
        {sortedBacklog.length > 0 && (
            <div className="bg-gray-50/80 rounded-2xl p-1 border border-dashed border-gray-300 mb-6">
                 <div className="px-3 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('list.section.backlog')}</span>
                    </div>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md font-bold">{sortedBacklog.length}</span>
                </div>
                 {sortedBacklog.map(task => (
                     <div key={task.id} className="relative h-[52px] mb-1 mx-1">
                        <SwipeableTask task={task} onCategorize={handleCategorize} onDelete={deleteTask} onComplete={completeTask} onClick={setEditingTask} t={t} />
                     </div>
                ))}
            </div>
        )}

        {/* Planned Tasks Section */}
        {sortedPlanned.length > 0 && (
            <div className="mb-6 animate-fade-in space-y-3">
                {/* <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('list.section.planned')}</h3> */}
                {sortedPlanned.map(task => (
                    <div key={task.id} className="relative h-[84px] mb-3">
                        <SwipeableTask task={task} onCategorize={handleCategorize} onDelete={deleteTask} onComplete={completeTask} onClick={setEditingTask} t={t} />
                    </div>
                ))}
            </div>
        )}

        {/* Completed Section */}
        {completedTasks.length > 0 && (
            <div className="mb-6 animate-fade-in opacity-60">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('list.section.completed')}</h3>
                {completedTasks.map(task => (
                     <div key={task.id} className="relative h-[64px] mb-3">
                        <div className="absolute inset-0 bg-gray-50 p-4 flex items-center gap-3 border border-gray-100 shadow-sm rounded-2xl">
                             <div onClick={() => completeTask(task.id)} className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center shrink-0 cursor-pointer">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                             </div>
                             <span className="text-[15px] font-medium text-gray-400 line-through truncate">{task.title}</span>
                        </div>
                     </div>
                ))}
            </div>
        )}

        {sortedPlanned.length === 0 && sortedBacklog.length === 0 && completedTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-20 opacity-40">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                <p className="text-sm font-bold text-gray-400">{t('list.empty')}</p>
            </div>
        )}
      </div>

      {editingTask && (
        <TaskDetailModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={updateTask} onDelete={deleteTask} t={t} />
      )}
    </div>
  );
};