
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Inbox, ChevronLeft, Zap, Calendar, Users, Coffee, AlignLeft } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Task, QuadrantId } from '../types';
import { TaskDetailModal } from './TaskDetailModal';

// Helper to determine drop zone from coordinates
const getDropZone = (x: number, y: number): QuadrantId | null => {
  const elements = document.elementsFromPoint(x, y);
  const zone = elements.find(el => el.hasAttribute('data-zone-id'));
  return zone ? (zone.getAttribute('data-zone-id') as QuadrantId) : null;
};

// --- Draggable Task Item Component with Long Press Logic ---
const DraggableTaskItem: React.FC<{
  task: Task;
  onDragStart: (task: Task, clientX: number, clientY: number, target: HTMLElement) => void;
  onClick: (task: Task) => void;
  onComplete: (id: string) => void;
  isDragging?: boolean;
}> = ({ task, onDragStart, onClick, onComplete, isDragging }) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.checkbox-area')) return;
    
    // Store initial position
    startPos.current = { x: e.clientX, y: e.clientY };
    const target = e.currentTarget as HTMLElement;

    // Start Long Press Timer
    timeoutRef.current = setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate(50);
        // Trigger Drag Start
        onDragStart(task, e.clientX, e.clientY, target);
    }, 250); // 250ms hold to drag
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // If we move significantly before the timer fires, cancel the timer (it's a scroll)
    if (timeoutRef.current && startPos.current) {
        const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
        if (dist > 10) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }
  };

  const handlePointerUp = () => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }
    startPos.current = null;
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={() => onClick(task)}
      data-task-id={task.id}
      // touch-action: pan-y enables native vertical scrolling, preventing browser from hijacking horizontal moves but allowing vertical
      className={`flex items-center gap-1.5 p-1.5 bg-white rounded-lg shadow-sm border border-transparent active:scale-[0.98] transition-all touch-pan-y select-none cursor-default active:bg-gray-50 ${isDragging ? 'opacity-30' : ''}`}
    >
      <div
        className="checkbox-area w-5 h-5 flex items-center justify-center cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onComplete(task.id);
        }}
      >
          <div className="w-4 h-4 rounded border-[1.5px] border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 hover:border-green-400 hover:bg-green-50 transition-colors pointer-events-none"></div>
      </div>
      <span className="text-[12px] text-gray-800 font-medium truncate tracking-tight select-none leading-snug">{task.title}</span>
    </div>
  );
};

const Quadrant: React.FC<{
  id: QuadrantId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  tasks: Task[];
  highlighted: boolean;
  onComplete: (id: string) => void;
  onDragStart: (task: Task, x: number, y: number, el: HTMLElement) => void;
  onClickTask: (task: Task) => void;
  emptyText: string;
  dropTarget: { zone: QuadrantId; index: number } | null;
  draggedTaskId?: string;
}> = ({ id, title, subtitle, icon, colorClass, bgClass, tasks, highlighted, onComplete, onDragStart, onClickTask, emptyText, dropTarget, draggedTaskId }) => {
  return (
    <div
      data-zone-id={id}
      className={`relative flex flex-col h-full overflow-hidden transition-all duration-300 ${bgClass} ${
        highlighted ? 'ring-inset ring-4 ring-white/60 !bg-gray-100/90' : ''
      }`}
    >
      <div className="px-3 pt-3 pb-2 shrink-0 pointer-events-none select-none">
        <div className="flex items-start gap-1.5">
          <div className={`${colorClass} mt-0.5 scale-90 shrink-0`}>{icon}</div>
          <div className="flex flex-col min-w-0 flex-1">
              {/* Added min-h-[2.5em] to force consistent 2-line height even for 1-line titles */}
              <h3 
                className="text-[11px] sm:text-[12px] font-bold leading-tight text-slate-700 break-words mb-0.5 text-balance min-h-[2.5em] flex items-center"
              >
                {title}
              </h3>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 truncate min-w-0 opacity-80 leading-tight">{subtitle}</span>
          </div>
        </div>
      </div>
      <div className="flex-1 px-2 pb-2 overflow-y-auto no-scrollbar pointer-events-auto space-y-1 task-list-container">
        {tasks.map((task, i) => (
          <React.Fragment key={task.id}>
             {/* Drop placeholder before item */}
             {dropTarget?.zone === id && dropTarget.index === i && (
                 <div className="h-0.5 w-full bg-blue-500 rounded-full my-1 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
             )}
             
             <DraggableTaskItem 
                task={task}
                onDragStart={onDragStart}
                onClick={onClickTask}
                onComplete={onComplete}
                isDragging={draggedTaskId === task.id}
             />
          </React.Fragment>
        ))}
        
        {/* Drop placeholder at the end of the list */}
        {dropTarget?.zone === id && dropTarget.index === tasks.length && (
            <div className="h-0.5 w-full bg-blue-500 rounded-full my-1 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
        )}

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-40 select-none pointer-events-none px-4">
             <span className="text-[10px] font-bold tracking-wider uppercase text-center leading-relaxed text-slate-400">{emptyText}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const MatrixView: React.FC = () => {
  const { tasks, getTasksByCategory, moveTask, completeTask, hardcoreMode, inboxShakeTrigger, updateTask, deleteTask, reorderTask } = useTasks();
  const { t, language } = useLanguage();
  const [isInboxOpen, setInboxOpen] = useState(false);
  const [dragItem, setDragItem] = useState<{ task: Task; x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ zone: QuadrantId; index: number } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isInboxShaking, setInboxShaking] = useState(false);
  
  // Stats for the header
  const inboxTasks = getTasksByCategory('inbox');
  const today = new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  useEffect(() => {
    if (inboxShakeTrigger > 0) {
        setInboxShaking(true);
        const timer = setTimeout(() => setInboxShaking(false), 500); // 0.5s animation
        return () => clearTimeout(timer);
    }
  }, [inboxShakeTrigger]);

  // Drag Logic
  const handleDragStart = (task: Task, clientX: number, clientY: number, element: HTMLElement) => {
    // HARDCORE MODE RESTRICTION
    if (hardcoreMode && task.category !== 'inbox') {
        if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
        // Trigger visual feedback (Shake)
        element.classList.remove('animate-shake');
        void element.offsetWidth; // Force reflow
        element.classList.add('animate-shake');
        
        // Remove class after animation
        setTimeout(() => {
            element.classList.remove('animate-shake');
        }, 500);
        return;
    }

    const rect = element.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    setDragItem({
      task,
      x: clientX,
      y: clientY,
      offsetX,
      offsetY,
    });
    
    // Close inbox if open
    setInboxOpen(false);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragItem) return;
    e.preventDefault(); // Prevent scrolling while dragging
    
    setDragItem(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);

    const zone = getDropZone(e.clientX, e.clientY);
    
    if (zone) {
        const zoneContent = document.querySelector(`[data-zone-id="${zone}"] .task-list-container`);
        if (zoneContent) {
            const items = Array.from(zoneContent.children).filter(el => el.hasAttribute('data-task-id'));
            
            let index = items.length; // Default to end

            // Find insertion point
            for (let i = 0; i < items.length; i++) {
                const rect = items[i].getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                if (e.clientY < centerY) {
                    index = i;
                    break;
                }
            }
            setDropTarget({ zone, index });
        } else {
            setDropTarget({ zone, index: 0 });
        }
    } else {
        setDropTarget(null);
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!dragItem) return;
    
    if (dropTarget) {
        if (dropTarget.zone !== dragItem.task.category || dropTarget.index !== -1) { 
            reorderTask(dragItem.task.id, dropTarget.zone, dropTarget.index);
            if (navigator.vibrate) navigator.vibrate(20);
        }
    } else {
      const zone = getDropZone(e.clientX, e.clientY);
      if (dragItem.task.category === 'inbox' && !zone) {
          setInboxOpen(true);
      }
    }

    setDragItem(null);
    setDropTarget(null);
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
          className={`w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center active:scale-90 transition-transform relative group cursor-pointer ${isInboxShaking ? 'animate-shake' : ''}`}
        >
          <AlignLeft className="w-6 h-6 text-gray-600 group-hover:text-black" />
          {inboxTasks.length > 0 && (
            <div className="absolute top-2.5 right-3 w-3 h-3 bg-rose-500 rounded-full border-2 border-white transform scale-100 transition-transform"></div>
          )}
        </button>
      </div>

      {/* Matrix Container */}
      <div className="flex-1 mx-4 mb-[calc(110px+env(safe-area-inset-bottom))] bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden grid grid-cols-2 grid-rows-2 gap-px border border-gray-100 relative select-none">
         <div className="absolute inset-0 bg-gray-100 pointer-events-none"></div>

        <Quadrant 
          id="q1" 
          title={t('q1.title')}
          subtitle={t('q1.subtitle')}
          icon={<Zap className="w-4 h-4" />} 
          colorClass="text-rose-500" 
          bgClass="bg-[#FFF5F5]" 
          tasks={getTasksByCategory('q1')} 
          highlighted={dropTarget?.zone === 'q1'}
          onComplete={completeTask}
          onDragStart={handleDragStart}
          onClickTask={setEditingTask}
          emptyText={t('matrix.empty')}
          dropTarget={dropTarget}
          draggedTaskId={dragItem?.task.id}
        />
        <Quadrant 
          id="q2" 
          title={t('q2.title')}
          subtitle={t('q2.subtitle')}
          icon={<Calendar className="w-4 h-4" />} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
          tasks={getTasksByCategory('q2')} 
          highlighted={dropTarget?.zone === 'q2'}
          onComplete={completeTask}
          onDragStart={handleDragStart}
          onClickTask={setEditingTask}
          emptyText={t('matrix.q2.empty')}
          dropTarget={dropTarget}
          draggedTaskId={dragItem?.task.id}
        />
        <Quadrant 
          id="q3" 
          title={t('q3.title')}
          subtitle={t('q3.subtitle')}
          icon={<Users className="w-4 h-4" />} 
          colorClass="text-amber-600" 
          bgClass="bg-[#FFFAEB]" 
          tasks={getTasksByCategory('q3')} 
          highlighted={dropTarget?.zone === 'q3'}
          onComplete={completeTask}
          onDragStart={handleDragStart}
          onClickTask={setEditingTask}
          emptyText={t('matrix.empty')}
          dropTarget={dropTarget}
          draggedTaskId={dragItem?.task.id}
        />
        <Quadrant 
          id="q4" 
          title={t('q4.title')}
          subtitle={t('q4.subtitle')}
          icon={<Coffee className="w-4 h-4" />} 
          colorClass="text-slate-500" 
          bgClass="bg-slate-50" 
          tasks={getTasksByCategory('q4')} 
          highlighted={dropTarget?.zone === 'q4'}
          onComplete={completeTask}
          onDragStart={handleDragStart}
          onClickTask={setEditingTask}
          emptyText={t('matrix.empty')}
          dropTarget={dropTarget}
          draggedTaskId={dragItem?.task.id}
        />
      </div>

      {/* Inbox Drawer */}
      <div 
        className={`absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isInboxOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setInboxOpen(false)}
      ></div>
      
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
                  onPointerDown={(e) => {
                      handleDragStart(task, e.clientX, e.clientY, e.currentTarget as HTMLElement);
                  }}
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

      {/* Detail Modal */}
      {editingTask && (
        <TaskDetailModal 
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onUpdate={updateTask}
            onDelete={deleteTask}
            t={t}
        />
      )}

      {/* Drag Ghost Element */}
      {dragItem && createPortal(
        <div 
          className="fixed z-[100] pointer-events-none bg-white p-3 rounded-lg shadow-2xl border border-gray-200 opacity-90 w-[200px]"
          style={{ 
            left: dragItem.x - dragItem.offsetX, 
            top: dragItem.y - dragItem.offsetY,
            transform: 'scale(1.05) rotate(2deg)',
            width: '240px' 
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <span className="text-xs font-bold text-gray-700">{dragItem.task.title}</span>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
