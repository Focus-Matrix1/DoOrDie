import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Trash2, X, Zap, Calendar, Users, Coffee, Clock, CheckCircle2 } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Task, CategoryId } from '../types';
import { WeeklyCalendar } from './WeeklyCalendar';

// --- Task Detail Modal ---
const TaskDetailModal: React.FC<{
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}> = ({ task, onClose, onUpdate, onDelete, t }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [category, setCategory] = useState<CategoryId>(task?.category || 'inbox');
  const [plannedDate, setPlannedDate] = useState(task?.plannedDate || '');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setCategory(task.category);
      setPlannedDate(task.plannedDate || '');
    }
  }, [task]);

  if (!task) return null;

  const handleSave = () => {
    onUpdate(task.id, { title, category, plannedDate });
    onClose();
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div 
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center sm:justify-center animate-fade-in"
        onClick={onClose}
    >
        <div 
            className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 pb-safe shadow-2xl slide-up"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-6">
                <span className="text-[18px] font-bold text-gray-900">{t('detail.title')}</span>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full active:scale-95">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="space-y-6">
                {/* Title Input */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent text-lg font-medium outline-none text-gray-900 placeholder-gray-400"
                    />
                </div>

                {/* Date Input */}
                <div>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block px-1">{t('detail.date')}</label>
                     <input 
                        type="date"
                        value={plannedDate}
                        onChange={(e) => setPlannedDate(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-900 outline-none"
                     />
                </div>

                {/* Category Selection */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block px-1">{t('detail.category')}</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setCategory('inbox')}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${category === 'inbox' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                           <div className={`w-3 h-3 rounded-full ${category === 'inbox' ? 'bg-white' : 'bg-gray-300'}`}></div>
                           <span className="text-sm font-bold">{t('matrix.inbox')}</span>
                        </button>
                        <button 
                            onClick={() => setCategory('q1')}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${category === 'q1' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                           <Zap className="w-4 h-4" />
                           <span className="text-sm font-bold">{t('q1.title')}</span>
                        </button>
                        <button 
                            onClick={() => setCategory('q2')}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${category === 'q2' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                           <Calendar className="w-4 h-4" />
                           <span className="text-sm font-bold">{t('q2.title')}</span>
                        </button>
                        <button 
                            onClick={() => setCategory('q3')}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${category === 'q3' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                           <Users className="w-4 h-4" />
                           <span className="text-sm font-bold">{t('q3.title')}</span>
                        </button>
                         <button 
                            onClick={() => setCategory('q4')}
                            className={`p-3 rounded-xl border flex items-center gap-2 transition-all active:scale-95 ${category === 'q4' ? 'bg-slate-500 text-white border-slate-500' : 'bg-white border-gray-200 text-gray-600'}`}
                        >
                           <Coffee className="w-4 h-4" />
                           <span className="text-sm font-bold">{t('q4.title')}</span>
                        </button>
                    </div>
                </div>
                
                {/* Meta Info */}
                 <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('detail.created')}: {formatDate(task.createdAt)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                     <button 
                        onClick={handleDelete}
                        className="flex-1 py-4 rounded-xl bg-red-50 text-red-600 font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" />
                        {t('detail.delete')}
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-[2] py-4 rounded-xl bg-black text-white font-bold active:scale-95 transition-transform"
                    >
                        {t('detail.save')}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

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
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Stage 1 delete
  const startX = useRef(0);
  const startY = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const priorityColors = {
      inbox: 'bg-gray-100 text-gray-500',
      q1: 'bg-rose-100 text-rose-600',
      q2: 'bg-blue-100 text-blue-600',
      q3: 'bg-amber-100 text-amber-600',
      q4: 'bg-slate-100 text-slate-600'
  };

  const priorityLabels = {
      inbox: t('matrix.inbox'),
      q1: 'Q1',
      q2: 'Q2',
      q3: 'Q3',
      q4: 'Q4'
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.checkbox-area')) return;
    if ((e.target as HTMLElement).closest('.delete-btn')) return; // Allow clicking delete button
    
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setIsDragging(true);
    startX.current = e.clientX;
    startY.current = e.clientY;
    
    if (itemRef.current) itemRef.current.style.transition = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX.current;
    
    // Logic for resistance and limits
    // Right swipe (Categorize) limit around 100
    // Left swipe (Delete) has two stages.
    
    let newOffset = dx;
    
    // Right swipe limit
    if (newOffset > 100) newOffset = 100 + (newOffset - 100) * 0.2;
    
    setOffset(newOffset);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);

    const totalMove = Math.abs(e.clientX - startX.current);
    const totalY = Math.abs(e.clientY - startY.current);

    // Tap Detection
    if (totalMove < 5 && totalY < 5) {
        if (itemRef.current) itemRef.current.style.transition = 'transform 0.2s ease-out';
        setOffset(0);
        setShowDeleteConfirm(false);
        onClick(task);
        return;
    }

    if (itemRef.current) itemRef.current.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
    
    // Categorize (Right Swipe)
    if (offset > 80) {
      setOffset(80);
      setTimeout(() => {
          onCategorize(task);
          setOffset(0); 
      }, 100);
      return;
    } 
    
    // Delete (Left Swipe)
    // Stage 2: Strong swipe (> 200px) -> Delete immediately
    if (offset < -200) {
        setOffset(-window.innerWidth);
        setTimeout(() => onDelete(task.id), 200);
        return;
    }
    
    // Stage 1: Moderate swipe (> 80px) -> Show delete button (snap to -80)
    if (offset < -80) {
        setOffset(-80);
        setShowDeleteConfirm(true);
        return;
    }

    // Reset
    setOffset(0);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="relative h-[68px] rounded-xl overflow-hidden group select-none w-full touch-pan-y">
      {/* Background Actions */}
      <div className="absolute inset-0 flex z-0 rounded-xl overflow-hidden">
        {/* Right Swipe BG: Categorize */}
        <div className="w-full h-full bg-blue-500 flex items-center justify-start pl-6 text-white font-bold text-sm">
           <LayoutGrid className="w-5 h-5 mr-1" /> {t('list.action.categorize')}
        </div>
        {/* Left Swipe BG: Delete */}
        <div className="absolute right-0 w-full h-full bg-rose-500 flex items-center justify-end pr-6 text-white font-bold text-sm">
           <Trash2 className="w-5 h-5" />
        </div>
      </div>

      {/* Foreground Content */}
      <div 
        ref={itemRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ transform: `translateX(${offset}px)` }}
        className="absolute inset-0 bg-white flex items-center justify-between border border-gray-100 shadow-sm z-10 active:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 p-4 flex-1 min-w-0">
            {/* Checkbox */}
            <div 
                className="checkbox-area pointer-events-auto w-6 h-6 rounded-md border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-500 active:bg-green-50 transition-colors shrink-0"
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onComplete(task.id); 
                }}
            >
                {task.completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
            </div>
            
            <div className={`flex flex-col min-w-0 ${task.completed ? 'opacity-40 line-through decoration-gray-400' : ''}`}>
                <span className="text-[15px] font-medium text-gray-800 truncate">{task.title}</span>
            </div>
        </div>

        {/* Right Side Info/Buttons */}
        {showDeleteConfirm && offset === -80 ? (
            <div 
                className="delete-btn h-full bg-rose-500 text-white px-5 flex items-center justify-center font-bold cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                }}
            >
                {t('list.action.delete')}
            </div>
        ) : (
            <div className="shrink-0 mr-4 pointer-events-none">
                <span className={`text-[10px] px-2 py-1 rounded font-medium ${priorityColors[task.category]}`}>
                    {priorityLabels[task.category]}
                </span>
            </div>
        )}
      </div>
    </div>
  );
};

export const ListView: React.FC = () => {
  const { tasks, completeTask, deleteTask, moveTask, updateTask, hardcoreMode, selectedDate } = useTasks();
  const { t } = useLanguage();
  const [categorizingTask, setCategorizingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Sorting helper: Inbox -> Q1 -> Q2 -> Q3 -> Q4
  const priorityMap: Record<CategoryId, number> = { inbox: 0, q1: 1, q2: 2, q3: 3, q4: 4 };
  const sortTasks = (a: Task, b: Task) => priorityMap[a.category] - priorityMap[b.category];

  // Logic to separate tasks
  const todayStr = new Date().toISOString().split('T')[0];
  const isPast = selectedDate < todayStr;
  
  let mainTasks: Task[] = [];
  let secondaryTasks: Task[] = []; // Used for "Completed" in past, or "Backlog" in future? 
  // Requirement: 
  // Past: Incomplete (main) + Completed (secondary)
  // Today/Future: Planned for date + No Date (mixed in main) sorted by priority
  
  if (isPast) {
      // Past View
      mainTasks = tasks.filter(t => t.plannedDate === selectedDate && !t.completed);
      secondaryTasks = tasks.filter(t => t.plannedDate === selectedDate && t.completed);
  } else {
      // Today/Future View
      // Show tasks planned for this date OR tasks with no planned date (Backlog)
      // Filter out completed ones? Usually lists hide completed or move them bottom. 
      // Requirement says "show tasks planned... and uncompleted tasks... sorted by priority".
      // Assuming we only show active tasks here.
      mainTasks = tasks.filter(t => 
          !t.completed && 
          (t.plannedDate === selectedDate || !t.plannedDate)
      ).sort(sortTasks);
  }

  const handleCategorySelect = (category: CategoryId) => {
    if (categorizingTask) {
        moveTask(categorizingTask.id, category);
        setCategorizingTask(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F5F7FA] relative">
      <div className="bg-white z-40 relative shadow-sm rounded-b-[32px] shrink-0 mb-4 flex flex-col">
        {/* Calendar */}
        <WeeklyCalendar />
      </div>

      <div className="flex-1 px-4 overflow-y-auto no-scrollbar pb-32 space-y-4">
        
        {/* Main Section */}
        {mainTasks.length > 0 && (
            <div className="space-y-3">
                 {isPast && <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{t('list.section.planned')}</h3>}
                 {mainTasks.map(task => (
                    <SwipeableTask 
                        key={task.id} 
                        task={task} 
                        onCategorize={(t) => !hardcoreMode && setCategorizingTask(t)} 
                        onDelete={(id) => !hardcoreMode && deleteTask(id)}
                        onComplete={completeTask}
                        onClick={(t) => setEditingTask(t)}
                        t={t}
                    />
                 ))}
            </div>
        )}

        {/* Secondary Section (Completed in Past view) */}
        {isPast && secondaryTasks.length > 0 && (
             <div className="space-y-3 pt-4 border-t border-gray-200 border-dashed mt-4">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{t('list.section.completed')}</h3>
                 {secondaryTasks.map(task => (
                    <SwipeableTask 
                        key={task.id} 
                        task={task} 
                        onCategorize={(t) => !hardcoreMode && setCategorizingTask(t)} 
                        onDelete={(id) => !hardcoreMode && deleteTask(id)}
                        onComplete={completeTask}
                        onClick={(t) => setEditingTask(t)}
                        t={t}
                    />
                 ))}
            </div>
        )}

        {/* Empty State */}
        {mainTasks.length === 0 && secondaryTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 mt-10 text-gray-400">
                <span className="text-sm">{t('list.empty')}</span>
            </div>
        )}

      </div>

      {/* Task Detail Modal */}
      {editingTask && (
        <TaskDetailModal 
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onUpdate={updateTask}
            onDelete={deleteTask}
            t={t}
        />
      )}

      {/* Category Sheet */}
      {categorizingTask && (
        <div 
            className="absolute inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-end animate-fade-in"
            onClick={() => setCategorizingTask(null)}
        >
            <div 
                className="w-full bg-white rounded-t-[32px] p-6 pb-24 slide-up shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <span className="text-[16px] font-bold text-gray-900">{t('list.move_to').replace('{title}', categorizingTask.title)}</span>
                    <button onClick={() => setCategorizingTask(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleCategorySelect('q1')} className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-transform hover:bg-rose-100">
                        <Zap className="w-6 h-6 text-rose-500" />
                        <span className="text-xs font-bold text-rose-700">{t('q1.title')} (Q1)</span>
                    </button>
                    <button onClick={() => handleCategorySelect('q2')} className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-transform hover:bg-blue-100">
                        <Calendar className="w-6 h-6 text-blue-500" />
                        <span className="text-xs font-bold text-blue-700">{t('q2.title')} (Q2)</span>
                    </button>
                    <button onClick={() => handleCategorySelect('q3')} className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-transform hover:bg-amber-100">
                        <Users className="w-6 h-6 text-amber-500" />
                        <span className="text-xs font-bold text-amber-700">{t('q3.title')} (Q3)</span>
                    </button>
                    <button onClick={() => handleCategorySelect('q4')} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center gap-2 active:scale-95 transition-transform hover:bg-slate-100">
                        <Coffee className="w-6 h-6 text-slate-500" />
                        <span className="text-xs font-bold text-slate-700">{t('q4.title')} (Q4)</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};