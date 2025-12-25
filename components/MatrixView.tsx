import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Inbox, ChevronLeft, Zap, Calendar, Users, Coffee, AlignLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Task, QuadrantId } from '../types';
import { TaskDetailModal } from './TaskDetailModal';
import { useDraggable } from '../hooks/useDraggable';
import { INTERACTION, ANIMATION_DURATIONS, LAYOUT } from '../constants';

// --- Digital Reconstruction Entrance Animation ---
const GlitchEntrance: React.FC<{ 
    children: React.ReactNode; 
    taskCreatedAt: number;
    showDropIndicator?: boolean; 
}> = ({ children, taskCreatedAt, showDropIndicator }) => {
    // 1. Lock "isNew" state on mount. 
    const [isNew] = useState(() => Date.now() - taskCreatedAt < 3000);
    
    // 2. Control visibility of the real content vs the digital overlay
    const [showContent, setShowContent] = useState(!isNew);

    useEffect(() => {
        if (isNew) {
            // Hold the digital block for 800ms before revealing the task
            const timer = setTimeout(() => setShowContent(true), 800);
            return () => clearTimeout(timer);
        }
    }, [isNew]);

    // 3. Dynamic Z-Index is CRITICAL. 
    // We removed the wrapper div, so this div is now the direct child of the flex container.
    // Setting z-30 here allows it to truly float above subsequent siblings in the list.
    return (
        <div className={`relative w-full transition-all ${!showContent ? 'z-30' : 'z-0'}`}>
            {/* Internal Drop Indicator - Rendered here to avoid needing a wrapper div */}
            {showDropIndicator && (
                 <div className="h-0.5 w-full bg-blue-500 rounded-full my-1 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            )}

            {/* The Real Task Card - Fades in when construction finishes */}
            <motion.div
                initial={{ opacity: isNew ? 0 : 1 }}
                animate={{ opacity: showContent ? 1 : 0 }}
                transition={{ duration: 0.1 }}
            >
                {children}
            </motion.div>

            {/* The "Digital Construction" Overlay - Exits when construction finishes */}
            <AnimatePresence>
                {!showContent && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ 
                            opacity: 0, 
                            scale: 1.02, 
                            filter: "brightness(2) blur(4px)", // Flash bang exit
                        }} 
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="absolute inset-0 z-20 bg-[#0F172A] rounded-lg overflow-hidden flex flex-col justify-center px-4 gap-2 shadow-lg border border-emerald-500/30"
                    >
                        {/* Matrix-style Data Bars */}
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
                        
                        {/* Scanning Laser Effect */}
                        <motion.div 
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent"
                            initial={{ top: "-100%" }}
                            animate={{ top: "200%" }}
                            transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
                        />
                        
                        {/* Tech Decor - Blinking Status Light */}
                        <div className="absolute top-2.5 right-2.5 flex gap-1">
                            <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.8)]"></div>
                            <div className="w-1 h-1 bg-emerald-900 rounded-full"></div>
                        </div>

                        {/* Decoding Text Effect (Optional subtle detail) */}
                        <div className="absolute bottom-1 right-2 text-[6px] font-mono text-emerald-800 opacity-60">
                            CONSTRUCTING...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DraggableTaskItem: React.FC<{
  task: Task;
  onDragStart: (task: Task, clientX: number, clientY: number, target: HTMLElement) => void;
  onClick: (task: Task) => void;
  onComplete: (id: string) => void;
  isDragging?: boolean;
  t: (key: string) => string;
}> = ({ task, onDragStart, onClick, onComplete, isDragging, t }) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.checkbox-area')) return;
    startPos.current = { x: e.clientX, y: e.clientY };
    const target = e.currentTarget as HTMLElement;
    timeoutRef.current = setTimeout(() => {
        if (navigator.vibrate) navigator.vibrate(INTERACTION.VIBRATION.SUCCESS);
        onDragStart(task, e.clientX, e.clientY, target);
    }, INTERACTION.DRAG_LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (timeoutRef.current && startPos.current) {
        const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
        if (dist > INTERACTION.DRAG_DISTANCE_CANCEL_PX) {
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

  // Dynamic localization
  const displayTitle = task.translationKey ? t(task.translationKey) : task.title;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={() => onClick(task)}
      data-task-id={task.id}
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
      <span className="text-[12px] text-gray-800 font-medium truncate tracking-tight select-none leading-snug">{displayTitle}</span>
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
  t: (key: string) => string;
}> = ({ id, title, subtitle, icon, colorClass, bgClass, tasks, highlighted, onComplete, onDragStart, onClickTask, emptyText, dropTarget, draggedTaskId, t }) => {
  return (
    <div
      data-zone-id={id}
      className={`relative flex flex-col h-full overflow-hidden transition-all duration-300 ${bgClass} ${
        highlighted ? 'ring-inset ring-4 ring-white/60 !bg-gray-100/90' : ''
      }`}
    >
      <div className="px-3 pt-3 pb-2 shrink-0 pointer-events-none select-none">
        <div className="flex items-start gap-2">
          <div className={`${colorClass} text-[11px] sm:text-[12px] h-[2.5em] flex items-center justify-center shrink-0`}>
              <div className="scale-90">{icon}</div>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
              <h3 className={`text-[11px] sm:text-[12px] font-bold leading-tight break-words mb-0.5 text-balance min-h-[2.5em] flex items-center ${colorClass}`}>
                {title}
              </h3>
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 truncate min-w-0 opacity-80 leading-tight">{subtitle}</span>
          </div>
        </div>
      </div>
      <div className="flex-1 px-2 pb-2 overflow-y-auto no-scrollbar pointer-events-auto space-y-1 task-list-container">
        {tasks.map((task, i) => (
             <GlitchEntrance 
                key={task.id} 
                taskCreatedAt={task.createdAt}
                showDropIndicator={dropTarget?.zone === id && dropTarget.index === i}
             >
                 <DraggableTaskItem 
                    task={task}
                    onDragStart={onDragStart}
                    onClick={onClickTask}
                    onComplete={onComplete}
                    isDragging={draggedTaskId === task.id}
                    t={t}
                 />
             </GlitchEntrance>
        ))}
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isInboxShaking, setInboxShaking] = useState(false);
  
  const inboxTasks = getTasksByCategory('inbox');
  const today = new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  useEffect(() => {
    if (inboxShakeTrigger > 0) {
        setInboxShaking(true);
        const timer = setTimeout(() => setInboxShaking(false), ANIMATION_DURATIONS.SHAKE_FEEDBACK);
        return () => clearTimeout(timer);
    }
  }, [inboxShakeTrigger]);

  const onDrop = useCallback((task: Task, target: { zone: QuadrantId, index: number }) => {
    reorderTask(task.id, target.zone, target.index);
    if (navigator.vibrate) navigator.vibrate(INTERACTION.VIBRATION.SOFT);
  }, [reorderTask]);

  const { dragItem, dropTarget, startDrag } = useDraggable({
    onDrop,
    onDragStart: () => setInboxOpen(false)
  });

  const handleDragStart = (task: Task, clientX: number, clientY: number, element: HTMLElement) => {
    if (hardcoreMode && task.category !== 'inbox') {
        if (navigator.vibrate) navigator.vibrate(INTERACTION.VIBRATION.HARD);
        element.classList.remove('animate-shake');
        void element.offsetWidth;
        element.classList.add('animate-shake');
        setTimeout(() => element.classList.remove('animate-shake'), ANIMATION_DURATIONS.SHAKE_FEEDBACK);
        return;
    }
    startDrag(task, clientX, clientY, element);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative bg-[#F5F7FA]">
      <div 
        className="px-6 pb-4 z-40 relative shrink-0 flex justify-between items-end"
        // Reduced extra padding to 12px
        style={{ paddingTop: 'calc(12px + env(safe-area-inset-top) + var(--sa-top, 0px))' }}
      >
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

      <div className={`flex-1 mx-4 mb-[90px] bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden grid grid-cols-2 grid-rows-2 gap-px border border-gray-100 relative select-none`}>
         <div className="absolute inset-0 bg-gray-100 pointer-events-none"></div>
        {(['q1', 'q2', 'q3', 'q4'] as const).map(id => (
            <Quadrant 
              key={id}
              id={id} 
              title={t(`${id}.title`)}
              subtitle={t(`${id}.subtitle`)}
              icon={id === 'q1' ? <Zap className="w-4 h-4"/> : id === 'q2' ? <Calendar className="w-4 h-4"/> : id === 'q3' ? <Users className="w-4 h-4"/> : <Coffee className="w-4 h-4"/>} 
              colorClass={id === 'q1' ? "text-rose-500" : id === 'q2' ? "text-blue-600" : id === 'q3' ? "text-amber-600" : "text-slate-500"} 
              bgClass={id === 'q1' ? "bg-[#FFF5F5]" : id === 'q2' ? "bg-blue-50" : id === 'q3' ? "bg-[#FFFAEB]" : "bg-slate-50"} 
              tasks={getTasksByCategory(id)} 
              highlighted={dropTarget?.zone === id}
              onComplete={completeTask}
              onDragStart={handleDragStart}
              onClickTask={setEditingTask}
              emptyText={id === 'q2' ? t('matrix.q2.empty') : t('matrix.empty')}
              dropTarget={dropTarget}
              draggedTaskId={dragItem?.task.id}
              t={t}
            />
        ))}
      </div>

      <div 
        className={`absolute inset-0 z-[60] bg-gray-500/30 backdrop-blur-sm transition-opacity duration-${ANIMATION_DURATIONS.MODAL_TRANSITION} ${isInboxOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setInboxOpen(false)}
      ></div>
      
      <div className={`absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-white z-[70] shadow-2xl transition-transform duration-${ANIMATION_DURATIONS.MODAL_TRANSITION} flex flex-col rounded-r-[32px] ${isInboxOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div 
          className="px-6 pb-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center shrink-0"
          style={{ paddingTop: 'calc(48px + env(safe-area-inset-top) + var(--sa-top, 0px))' }}
        >
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {inboxTasks.length === 0 ? (
             <div className="text-center mt-10 text-gray-300 text-sm">{t('matrix.inbox.zero')}</div>
          ) : (
             inboxTasks.map(task => (
                <div key={task.id} onPointerDown={(e) => handleDragStart(task, e.clientX, e.clientY, e.currentTarget as HTMLElement)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative active:scale-95 transition-transform touch-none select-none cursor-grab active:cursor-grabbing">
                  <div className="flex items-center gap-3 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <span className="text-sm font-bold text-gray-700">{task.translationKey ? t(task.translationKey) : task.title}</span>
                  </div>
                </div>
             ))
          )}
        </div>
      </div>

      {editingTask && (
        <TaskDetailModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={updateTask} onDelete={deleteTask} t={t} />
      )}

      {dragItem && createPortal(
        <div className="fixed z-[100] pointer-events-none bg-white p-3 rounded-lg shadow-2xl border border-gray-200 opacity-90 w-[240px]" style={{ left: dragItem.x - dragItem.offsetX, top: dragItem.y - dragItem.offsetY, transform: 'scale(1.05) rotate(2deg)' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <span className="text-xs font-bold text-gray-700">{dragItem.task.translationKey ? t(dragItem.task.translationKey) : dragItem.task.title}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};