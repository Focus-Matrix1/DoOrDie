import React, { useState, useRef } from 'react';
import { LayoutGrid, Trash2, Zap, Calendar, Users, Coffee, CheckCircle2, FileText } from 'lucide-react';
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

  const priorityColors = {
      inbox: 'bg-gray-100 text-gray-500',
      q1: 'bg-rose-100 text-rose-600',
      q2: 'bg-blue-100 text-blue-600',
      q3: 'bg-amber-100 text-amber-600',
      q4: 'bg-slate-100 text-slate-600'
  };

  const priorityLabels: Record<string, string> = {
      inbox: t('matrix.inbox'),
      q1: 'Q1',
      q2: 'Q2',
      q3: 'Q3',
      q4: 'Q4'
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Ignore if clicking specific interactive elements
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

    // --- Direction Lock Logic ---
    if (!directionLock.current) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            if (Math.abs(dx) > Math.abs(dy)) {
                directionLock.current = 'horizontal';
            } else {
                directionLock.current = 'vertical';
                isDragging.current = false; // Stop tracking for this swipe
                return; 
            }
        }
    }

    if (directionLock.current === 'horizontal') {
        let newOffset = dx;
        
        // Resistance
        if (newOffset > 150) newOffset = 150 + (newOffset - 150) * 0.2; 
        if (newOffset < -150) newOffset = -150 + (newOffset + 150) * 0.2;

        setOffset(newOffset);
        
        // Visual feedback
        // Swipe Right (Positive) -> Delete
        if (newOffset > 100 && !isTriggered) setIsTriggered(true);
        if (newOffset < 100 && newOffset > 0 && isTriggered) setIsTriggered(false);

        // Swipe Left (Negative) -> Categorize
        if (newOffset < -80 && !isTriggered) setIsTriggered(true);
        if (newOffset > -80 && newOffset < 0 && isTriggered) setIsTriggered(false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (itemRef.current) itemRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';

    if (offset > 100) {
        // Right Swipe -> Delete
        setOffset(1000); 
        setTimeout(() => onDelete(task.id), 300);
    } else if (offset < -80) {
        // Left Swipe -> Categorize
        setOffset(-80); // Keep slightly open or reset
        onCategorize(task);
        setOffset(0);
    } else {
        setOffset(0);
    }
  };

  return (
    <div className="relative min-h-[72px] rounded-2xl overflow-hidden group select-none touch-pan-y mb-3">
        {/* Background Actions */}
        <div className="absolute inset-0 flex z-0 rounded-2xl overflow-hidden">
            {/* Left Background (Visible when Swiping Right) -> Delete (Red) */}
            <div className={`w-full h-full flex items-center justify-start pl-6 text-white font-bold text-sm transition-colors duration-300 ${isTriggered && offset > 0 ? 'bg-red-600' : 'bg-red-500'}`}>
                <Trash2 className={`w-5 h-5 mr-1 ${isTriggered && offset > 0 ? 'scale-125' : ''} transition-transform`} />
            </div>
            {/* Right Background (Visible when Swiping Left) -> Categorize (Blue) */}
            <div className="absolute right-0 top-0 bottom-0 w-full h-full bg-blue-500 flex items-center justify-end pr-6 text-white font-bold text-sm">
                 <span className="flex items-center gap-2">
                    {t('list.action.categorize')} <LayoutGrid className="w-5 h-5 ml-1" />
                 </span>
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
            className="absolute inset-0 bg-white p-4 flex flex-row items-center justify-between border border-gray-100 shadow-sm z-10 rounded-2xl active:scale-[0.99] transition-transform"
        >
            <div className="flex items-center gap-3 overflow-hidden w-full">
                <div 
                    className="checkbox-area w-8 h-8 -ml-1 flex items-center justify-center cursor-pointer shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        onComplete(task.id);
                    }}
                >
                     <div className={`w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-300 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                        {task.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                     </div>
                </div>
                <div className="flex flex-col overflow-hidden w-full">
                    <span className={`text-[15px] font-medium truncate transition-all ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</span>
                    
                    {/* Meta Row */}
                    <div className="flex items-center gap-2 mt-0.5 w-full">
                         <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${priorityColors[task.category] || 'bg-gray-100'}`}>
                            {priorityLabels[task.category]}
                         </span>
                         {task.plannedDate && (
                             <span className="text-[10px] text-gray-400 flex items-center gap-0.5 shrink-0">
                                 <Calendar className="w-3 h-3" /> {task.plannedDate}
                             </span>
                         )}
                         {task.description && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5 truncate ml-1">
                                <FileText className="w-3 h-3 shrink-0" /> <span className="truncate">{task.description}</span>
                            </span>
                         )}
                    </div>
                </div>
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

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 pt-2">
        {sortedPlanned.length > 0 && (
            <div className="mb-6 animate-fade-in">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('list.section.planned')}</h3>
                {sortedPlanned.map(task => (
                    <SwipeableTask key={task.id} task={task} onCategorize={handleCategorize} onDelete={deleteTask} onComplete={completeTask} onClick={setEditingTask} t={t} />
                ))}
            </div>
        )}

        {new Date().toISOString().split('T')[0] === selectedDate && sortedBacklog.length > 0 && (
            <div className="mb-6 animate-fade-in">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('list.section.backlog')}</h3>
                 {sortedBacklog.map(task => (
                    <SwipeableTask key={task.id} task={task} onCategorize={handleCategorize} onDelete={deleteTask} onComplete={completeTask} onClick={setEditingTask} t={t} />
                ))}
            </div>
        )}

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