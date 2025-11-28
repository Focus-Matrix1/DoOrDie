import React, { useState, useRef } from 'react';
import { LayoutGrid, Trash2, Zap, Calendar, Users, Coffee, CheckCircle2 } from 'lucide-react';
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
  const [isDeleting, setIsDeleting] = useState(false);
  
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
    setIsDeleting(false);
    
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
        // Threshold to determine intention (5px)
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            if (Math.abs(dx) > Math.abs(dy)) {
                directionLock.current = 'horizontal';
                // If horizontal, we want to prevent browser scrolling if possible (though touch-action handles most)
            } else {
                directionLock.current = 'vertical';
                isDragging.current = false; // Stop tracking for this swipe
                return; 
            }
        }
    }

    if (directionLock.current === 'horizontal') {
        let newOffset = dx;
        
        // Resistance at edges
        if (newOffset > 100) newOffset = 100 + (newOffset - 100) * 0.2; // Right max
        if (newOffset < -200) newOffset = -200 + (newOffset + 200) * 0.2; // Left max

        setOffset(newOffset);
        
        // Visual feedback for delete threshold
        if (newOffset < -120 && !isDeleting) setIsDeleting(true);
        if (newOffset > -120 && isDeleting) setIsDeleting(false);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (itemRef.current) itemRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';

    if (offset > 80) {
        // Right Swipe -> Categorize
        setOffset(80); // Keep open slightly or reset? Let's reset for now as we open modal
        onCategorize(task);
        setOffset(0);
    } else if (offset < -120) {
        // Left Swipe -> Delete (Threshold passed)
        setOffset(-1000); // Fly off
        setTimeout(() => onDelete(task.id), 300);
    } else {
        // Reset
        setOffset(0);
    }
  };

  return (
    <div className="relative h-[72px] rounded-2xl overflow-hidden group select-none touch-pan-y mb-3">
        {/* Background Actions */}
        <div className="absolute inset-0 flex z-0 rounded-2xl overflow-hidden">
            {/* Left Background (Categorize) */}
            <div className="w-full h-full bg-blue-500 flex items-center justify-start pl-6 text-white font-bold text-sm">
                <LayoutGrid className="w-5 h-5 mr-1" />
            </div>
            {/* Right Background (Delete) */}
            <div className={`absolute right-0 top-0 bottom-0 flex items-center justify-end pr-6 text-white font-bold text-sm transition-all duration-300 ${isDeleting ? 'bg-red-600 w-full' : 'bg-red-500 w-full'}`}>
                 <span className="flex items-center gap-2">
                    {t('list.action.delete')} <Trash2 className={`w-5 h-5 ${isDeleting ? 'scale-125' : ''} transition-transform`} />
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
                // Determine if it was a tap or a swipe
                if (Math.abs(offset) < 5 && !(e.target as HTMLElement).closest('.checkbox-area')) {
                    onClick(task);
                }
            }}
            style={{ transform: `translateX(${offset}px)` }}
            className="absolute inset-0 bg-white p-4 flex items-center justify-between border border-gray-100 shadow-sm z-10 rounded-2xl active:scale-[0.99] transition-transform"
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div 
                    className="checkbox-area w-8 h-8 -ml-1 flex items-center justify-center cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onComplete(task.id);
                    }}
                >
                     <div className={`w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-300 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                        {task.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                     </div>
                </div>
                <div className="flex flex-col overflow-hidden">
                    <span className={`text-[15px] font-medium truncate transition-all ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                         <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${priorityColors[task.category] || 'bg-gray-100'}`}>
                            {priorityLabels[task.category]}
                         </span>
                         {task.plannedDate && (
                             <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                 <Calendar className="w-3 h-3" /> {task.plannedDate}
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

  // --- Filtering & Sorting Logic ---
  
  // 1. Tasks for Selected Date (Planned)
  const tasksForDate = tasks.filter(task => 
    !task.completed && task.plannedDate === selectedDate
  );

  // 2. Backlog (No Date) - Only show if viewing today or future
  // For simplicity, we just show backlog below today's list
  const backlogTasks = tasks.filter(task => 
    !task.completed && !task.plannedDate
  );

  // 3. Completed for Selected Date
  const completedTasks = tasks.filter(task => 
    task.completed && task.plannedDate === selectedDate
  );

  // Sorting Helper: Inbox -> Q1 -> Q2 -> Q3 -> Q4
  const sortTasks = (taskList: Task[]) => {
      const priorityOrder: Record<CategoryId, number> = { 'inbox': 0, 'q1': 1, 'q2': 2, 'q3': 3, 'q4': 4 };
      return [...taskList].sort((a, b) => {
          // First by priority
          const pDiff = priorityOrder[a.category] - priorityOrder[b.category];
          if (pDiff !== 0) return pDiff;
          // Then by creation time (newest first)
          return b.createdAt - a.createdAt;
      });
  };

  const sortedPlanned = sortTasks(tasksForDate);
  const sortedBacklog = sortTasks(backlogTasks);

  const handleCategorize = (task: Task) => {
      setEditingTask(task); // Re-use edit modal for categorization as it has the UI
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F5F7FA] relative">
      <WeeklyCalendar />

      {/* Task List Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 pt-2">
        
        {/* PLANNED SECTION */}
        {sortedPlanned.length > 0 && (
            <div className="mb-6 animate-fade-in">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('list.section.planned')}</h3>
                {sortedPlanned.map(task => (
                    <SwipeableTask 
                        key={task.id} 
                        task={task} 
                        onCategorize={handleCategorize} 
                        onDelete={deleteTask}
                        onComplete={completeTask}
                        onClick={setEditingTask}
                        t={t}
                    />
                ))}
            </div>
        )}

        {/* BACKLOG SECTION (Only show if viewing Today) */}
        {new Date().toISOString().split('T')[0] === selectedDate && sortedBacklog.length > 0 && (
            <div className="mb-6 animate-fade-in">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('list.section.backlog')}</h3>
                 {sortedBacklog.map(task => (
                    <SwipeableTask 
                        key={task.id} 
                        task={task} 
                        onCategorize={handleCategorize} 
                        onDelete={deleteTask}
                        onComplete={completeTask}
                        onClick={setEditingTask}
                        t={t}
                    />
                ))}
            </div>
        )}

        {/* COMPLETED SECTION */}
        {completedTasks.length > 0 && (
            <div className="mb-6 animate-fade-in opacity-60">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('list.section.completed')}</h3>
                {completedTasks.map(task => (
                     <div key={task.id} className="relative h-[64px] mb-3">
                        <div className="absolute inset-0 bg-gray-50 p-4 flex items-center gap-3 border border-gray-100 shadow-sm rounded-2xl">
                             <div 
                                onClick={() => completeTask(task.id)}
                                className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center shrink-0 cursor-pointer"
                             >
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                             </div>
                             <span className="text-[15px] font-medium text-gray-400 line-through truncate">{task.title}</span>
                        </div>
                     </div>
                ))}
            </div>
        )}

        {/* Empty State */}
        {sortedPlanned.length === 0 && sortedBacklog.length === 0 && completedTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-20 opacity-40">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                <p className="text-sm font-bold text-gray-400">{t('list.empty')}</p>
            </div>
        )}

      </div>

      {editingTask && (
        <TaskDetailModal 
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onUpdate={updateTask}
            onDelete={deleteTask}
            t={t}
        />
      )}
    </div>
  );
};