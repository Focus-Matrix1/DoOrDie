import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Inbox, ChevronLeft, Zap, Calendar, Users, Coffee, AlignLeft } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Task, QuadrantId } from '../types';

// Helper to determine drop zone from coordinates
const getDropZone = (x: number, y: number): QuadrantId | null => {
  const elements = document.elementsFromPoint(x, y);
  const zone = elements.find(el => el.hasAttribute('data-zone-id'));
  return zone ? (zone.getAttribute('data-zone-id') as QuadrantId) : null;
};

const Quadrant: React.FC<{
  id: QuadrantId;
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  tasks: Task[];
  highlighted: boolean;
  onComplete: (id: string) => void;
  emptyText: string;
}> = ({ id, title, icon, colorClass, bgClass, tasks, highlighted, onComplete, emptyText }) => {
  return (
    <div
      data-zone-id={id}
      className={`relative flex flex-col h-full overflow-hidden transition-all duration-300 ${bgClass} ${
        highlighted ? 'ring-inset ring-4 ring-white/60 !bg-gray-100/90' : ''
      }`}
    >
      <div className="px-4 pt-4 pb-2 shrink-0 pointer-events-none select-none">
        <div className="flex items-center gap-2 mb-0.5">
          <div className={colorClass}>{icon}</div>
          <h3 className={`text-[15px] font-bold leading-none ${colorClass.replace('text-', 'text-slate-')}`}>{title}</h3>
        </div>
      </div>
      <div className="flex-1 px-3 pb-3 overflow-y-auto no-scrollbar pointer-events-auto space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-transparent active:scale-[0.98] transition-all cursor-pointer hover:shadow-md fade-in group`}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onComplete(task.id);
              }}
              className={`w-5 h-5 rounded-md border-[1.5px] border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 hover:border-green-400 hover:bg-green-50 transition-colors group-hover:border-gray-300`}
            >
             {/* Checkbox circle empty */}
            </div>
            <span className="text-[13px] text-gray-800 font-medium truncate pt-0.5 select-none">{task.title}</span>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 select-none pointer-events-none">
             <span className="text-[10px] font-medium tracking-wider uppercase">{emptyText}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const MatrixView: React.FC = () => {
  const { tasks, getTasksByCategory, moveTask, completeTask, hardcoreMode } = useTasks();
  const { t, language } = useLanguage();
  const [isInboxOpen, setInboxOpen] = useState(false);
  const [dragItem, setDragItem] = useState<{ task: Task; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [highlightedZone, setHighlightedZone] = useState<QuadrantId | null>(null);
  
  // Stats for the header
  const inboxTasks = getTasksByCategory('inbox');
  const today = new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // Drag Logic
  const handleDragStart = (e: React.PointerEvent, task: Task) => {
    // Prevent default touch actions like scrolling
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragItem({
      task,
      x: e.clientX,
      y: e.clientY,
      offsetX,
      offsetY,
    });
    
    // Close inbox to reveal matrix immediately
    setInboxOpen(false);
    
    // Vibrations for mobile
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragItem) return;
    e.preventDefault();
    
    setDragItem(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);

    const zone = getDropZone(e.clientX, e.clientY);
    setHighlightedZone(zone);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!dragItem) return;
    
    const zone = getDropZone(e.clientX, e.clientY);
    if (zone) {
      moveTask(dragItem.task.id, zone);
      if (navigator.vibrate) navigator.vibrate(20);
    } else {
      // If dropped nowhere, reopen inbox
      setInboxOpen(true);
    }

    setDragItem(null);
    setHighlightedZone(null);
  };

  useEffect(() => {
    if (dragItem) {
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragItem]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative bg-[#F5F7FA]">
      
      {/* Header */}
      <div className="px-6 pt-6 pb-4 z-40 relative shrink-0 flex justify-between items-end">
        <div className="flex flex-col items-start select-none">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 font-['Inter']">{today}</h2>
          <h1 className="text-[34px] font-bold text-gray-900 leading-none tracking-tight">{t('matrix.title')}</h1>
        </div>
        <button 
          onClick={() => setInboxOpen(true)}
          className="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center active:scale-90 transition-transform relative group cursor-pointer"
        >
          <AlignLeft className="w-6 h-6 text-gray-600 group-hover:text-black" />
          {inboxTasks.length > 0 && (
            <div className="absolute top-2.5 right-3 w-3 h-3 bg-rose-500 rounded-full border-2 border-white transform scale-100 transition-transform"></div>
          )}
        </button>
      </div>

      {/* Matrix Container */}
      <div className="flex-1 mx-4 mb-[90px] bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden grid grid-cols-2 grid-rows-[1.55fr_1fr] gap-px border border-gray-100 relative select-none">
         <div className="absolute inset-0 bg-gray-100 pointer-events-none"></div>

        <Quadrant 
          id="q1" 
          title={t('q1.title')}
          icon={<Zap className="w-4 h-4" />} 
          colorClass="text-rose-500" 
          bgClass="bg-[#FFF5F5]" 
          tasks={getTasksByCategory('q1')} 
          highlighted={highlightedZone === 'q1'}
          onComplete={completeTask}
          emptyText={t('matrix.empty')}
        />
        <Quadrant 
          id="q2" 
          title={t('q2.title')}
          icon={<Calendar className="w-4 h-4" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50/40" 
          tasks={getTasksByCategory('q2')} 
          highlighted={highlightedZone === 'q2'}
          onComplete={completeTask}
          emptyText={t('matrix.empty')}
        />
        <Quadrant 
          id="q3" 
          title={t('q3.title')}
          icon={<Users className="w-4 h-4" />} 
          colorClass="text-amber-600" 
          bgClass="bg-[#FFFAEB]" 
          tasks={getTasksByCategory('q3')} 
          highlighted={highlightedZone === 'q3'}
          onComplete={completeTask}
          emptyText={t('matrix.empty')}
        />
        <Quadrant 
          id="q4" 
          title={t('q4.title')}
          icon={<Coffee className="w-4 h-4" />} 
          colorClass="text-slate-500" 
          bgClass="bg-slate-50/50" 
          tasks={getTasksByCategory('q4')} 
          highlighted={highlightedZone === 'q4'}
          onComplete={completeTask}
          emptyText={t('matrix.empty')}
        />
      </div>

      {/* Inbox Drawer */}
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isInboxOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setInboxOpen(false)}
      ></div>
      
      {/* Panel */}
      <div 
        className={`absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white z-[70] shadow-2xl transition-transform duration-300 flex flex-col rounded-r-[32px] ${isInboxOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-6 pt-12 pb-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
             <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
               <Inbox className="w-5 h-5 text-gray-900" /> {t('matrix.inbox')}
             </h2>
             <p className="text-[11px] text-gray-400 mt-1 font-medium">{hardcoreMode ? t('list.hint.hardcore') : t('matrix.inbox.hint')}</p>
          </div>
          <button onClick={() => setInboxOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform cursor-pointer hover:bg-gray-200">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {inboxTasks.length === 0 ? (
             <div className="text-center mt-10 text-gray-300 text-sm">{t('matrix.inbox.zero')}</div>
          ) : (
             inboxTasks.map(task => (
                <div 
                  key={task.id}
                  onPointerDown={(e) => handleDragStart(e, task)}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative active:scale-95 transition-transform touch-none select-none cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-3 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <span className="text-sm font-bold text-gray-700">{task.title}</span>
                  </div>
                </div>
             ))
          )}
        </div>
      </div>

      {/* Drag Ghost Element */}
      {dragItem && createPortal(
        <div 
          className="fixed z-[100] pointer-events-none bg-white p-4 rounded-xl shadow-2xl border border-gray-200 opacity-90 w-[240px]"
          style={{ 
            left: dragItem.x - dragItem.offsetX, 
            top: dragItem.y - dragItem.offsetY,
            transform: 'scale(1.05) rotate(2deg)',
            width: '280px' // approximated fixed width for consistency
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <span className="text-sm font-bold text-gray-700">{dragItem.task.title}</span>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};