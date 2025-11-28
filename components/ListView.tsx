import React, { useState, useRef } from 'react';
import { LayoutGrid, Trash2, X, Zap, Calendar, Users, Coffee } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Task, CategoryId } from '../types';

const SwipeableTask: React.FC<{ 
  task: Task; 
  onCategorize: (task: Task) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  t: (key: string) => string;
}> = ({ task, onCategorize, onDelete, onComplete, t }) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only enable pointer tracking if not clicking the checkbox
    if ((e.target as HTMLElement).closest('.checkbox-area')) return;
    
    setIsDragging(true);
    startX.current = e.clientX;
    if (itemRef.current) itemRef.current.style.transition = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX - startX.current;
    
    // Limits
    let newOffset = currentX;
    if (newOffset > 100) newOffset = 100;
    if (newOffset < -100) newOffset = -100;
    
    setOffset(newOffset);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (itemRef.current) itemRef.current.style.transition = 'transform 0.2s ease-out';
    
    if (offset > 80) {
      setOffset(80); // Stick open
      onCategorize(task);
      setOffset(0); // Reset after action triggered (in UI flow)
    } else if (offset < -80) {
      setOffset(-1000); // Fly off
      setTimeout(() => onDelete(task.id), 200);
    } else {
      setOffset(0);
    }
  };

  return (
    <div 
      className="relative h-[68px] rounded-xl overflow-hidden group select-none w-full"
      onPointerLeave={() => {
        if(isDragging) {
            setIsDragging(false);
            setOffset(0);
            if (itemRef.current) itemRef.current.style.transition = 'transform 0.2s ease-out';
        }
      }}
    >
      {/* Background Actions */}
      <div className="absolute inset-0 flex z-0 rounded-xl overflow-hidden">
        <div className="w-full h-full bg-blue-500 flex items-center justify-start pl-6 text-white font-bold text-sm">
           <LayoutGrid className="w-5 h-5 mr-1" /> {t('list.action.categorize')}
        </div>
        <div className="absolute right-0 w-full h-full bg-rose-500 flex items-center justify-end pr-6 text-white font-bold text-sm">
           {t('list.action.delete')} <Trash2 className="w-5 h-5 ml-1" />
        </div>
      </div>

      {/* Foreground Content */}
      <div 
        ref={itemRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ transform: `translateX(${offset}px)` }}
        className="absolute inset-0 bg-white p-4 flex items-center justify-between border border-gray-100 shadow-sm z-10 cursor-grab active:cursor-grabbing hover:bg-gray-50/50"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div 
            className="checkbox-area w-6 h-6 rounded-md border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors shrink-0"
            onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
          ></div>
          <div className="flex flex-col min-w-0">
             <span className="text-[15px] font-medium text-gray-800 truncate">{task.title}</span>
          </div>
        </div>
        <div className="shrink-0 ml-2">
            <span className={`text-[10px] px-2 py-1 rounded font-medium ${
                task.category === 'inbox' ? 'bg-gray-100 text-gray-500' :
                task.category === 'q1' ? 'bg-rose-100 text-rose-600' :
                task.category === 'q2' ? 'bg-blue-100 text-blue-600' :
                task.category === 'q3' ? 'bg-amber-100 text-amber-600' :
                'bg-slate-100 text-slate-600'
            }`}>
                {task.category === 'inbox' ? t('matrix.inbox') :
                 task.category === 'q1' ? 'Q1' :
                 task.category === 'q2' ? 'Q2' :
                 task.category === 'q3' ? 'Q3' : 'Q4'}
            </span>
        </div>
      </div>
    </div>
  );
};

export const ListView: React.FC = () => {
  const { tasks, completeTask, deleteTask, moveTask, hardcoreMode } = useTasks();
  const { t } = useLanguage();
  const [categorizingTask, setCategorizingTask] = useState<Task | null>(null);

  // Filter out completed tasks for the list
  const activeTasks = tasks.filter(t => !t.completed);

  const handleCategorySelect = (category: CategoryId) => {
    if (categorizingTask) {
        moveTask(categorizingTask.id, category);
        setCategorizingTask(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-[#F5F7FA] relative">
      <div className="bg-white z-40 relative pt-6 pb-4 px-6 shadow-sm rounded-b-[32px] shrink-0 mb-4">
        <div className="flex justify-between items-center px-1">
          <div>
            <h1 className="text-[26px] font-bold text-gray-900 tracking-tight">{t('list.title')}</h1>
            <span className="text-[12px] font-medium text-gray-400 font-['Inter']">
              {hardcoreMode ? t('list.hint.hardcore') : t('list.hint.normal')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-sm font-bold text-gray-500">
            {activeTasks.length}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto no-scrollbar pb-32 space-y-3">
        {activeTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 mt-10 text-gray-400">
                <span className="text-sm">{t('list.empty')}</span>
            </div>
        ) : (
            activeTasks.map(task => (
            <SwipeableTask 
                key={task.id} 
                task={task} 
                onCategorize={(t) => !hardcoreMode && setCategorizingTask(t)} 
                onDelete={(id) => !hardcoreMode && deleteTask(id)}
                onComplete={completeTask}
                t={t}
            />
            ))
        )}
      </div>

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