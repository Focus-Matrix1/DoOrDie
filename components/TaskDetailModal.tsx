import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Calendar, Users, Coffee, Clock, Trash2, ShieldAlert, ChevronDown } from 'lucide-react';
import { Task, CategoryId } from '../types';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

// Units configuration
const UNITS = ['m', 'h', 'd'];

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onUpdate, onDelete, t }) => {
  const { hardcoreMode } = useTasks();
  const { language } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId>('q1');
  const [plannedDate, setPlannedDate] = useState('');
  
  // Duration Logic
  const [durationVal, setDurationVal] = useState('');
  const [durationUnit, setDurationUnit] = useState(() => {
    try {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('focus-matrix-last-unit');
            return (saved && saved !== 's') ? saved : 'm';
        }
    } catch {}
    return 'm';
  });

  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.translationKey ? t(task.translationKey) : task.title);
      setDescription(task.description || '');
      setCategory(task.category === 'inbox' ? 'q1' : task.category);
      setPlannedDate(task.plannedDate || '');
      
      if (task.duration) {
          const match = task.duration.match(/^([\d.]+)([smhd])$/);
          if (match) {
              setDurationVal(match[1]);
              setDurationUnit(match[2] === 's' ? 'm' : match[2]); 
          } else {
              setDurationVal(task.duration);
          }
      } else {
          setDurationVal('');
      }
    }
  }, [task, t]);

  useEffect(() => {
      if (descRef.current) {
          descRef.current.style.height = 'auto';
          descRef.current.style.height = descRef.current.scrollHeight + 'px';
      }
  }, [description]);

  useEffect(() => {
      try {
          if (durationUnit !== 's') {
             localStorage.setItem('focus-matrix-last-unit', durationUnit);
          }
      } catch {}
  }, [durationUnit]);

  if (!task) return null;

  const saveChanges = (overrides?: Partial<Task> & { dVal?: string, dUnit?: string }) => {
      if (hardcoreMode) return;

      const currentVal = overrides?.dVal !== undefined ? overrides.dVal : durationVal;
      const currentUnit = overrides?.dUnit !== undefined ? overrides.dUnit : durationUnit;
      
      const finalDuration = currentVal.trim() ? `${currentVal}${currentUnit}` : undefined;

      const currentDisplayedTitle = task.translationKey ? t(task.translationKey) : task.title;
      const newTitle = overrides?.title ?? title;
      
      const updates: Partial<Task> = {
          title: newTitle,
          description: overrides?.description ?? description,
          category: overrides?.category ?? category,
          plannedDate: overrides?.plannedDate ?? plannedDate,
          duration: finalDuration
      };

      if (newTitle !== currentDisplayedTitle) {
          updates.translationKey = undefined;
      }

      onUpdate(task.id, updates);
  };

  const handleUnitToggle = () => {
      if (hardcoreMode) return;
      const currentIndex = UNITS.indexOf(durationUnit);
      const nextUnit = UNITS[(currentIndex + 1) % UNITS.length];
      setDurationUnit(nextUnit);
      if (durationVal) {
          saveChanges({ dUnit: nextUnit });
      }
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US');
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-end justify-center pointer-events-none">
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px] pointer-events-auto"
            onClick={onClose}
        />

        {/* Drawer Sheet */}
        <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] max-h-[90%] flex flex-col pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing" onClick={onClose}>
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-6 pt-2 pb-4 shrink-0">
                <span className="text-[17px] font-bold text-gray-900">{t('detail.title')}</span>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full active:scale-95 transition-transform hover:bg-gray-200">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Content Scroll Area */}
            <div className="px-6 pb-0 overflow-y-auto overscroll-contain no-scrollbar">
                <div className="space-y-6">
                    {hardcoreMode && (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-500" />
                            <span className="text-xs font-bold text-rose-600">{t('detail.hardcore_locked')}</span>
                        </div>
                    )}

                    <div className={`bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 transition-all ${!hardcoreMode && 'focus-within:ring-2 focus-within:ring-black/5 focus-within:bg-white'}`}>
                        <input 
                            type="text" 
                            disabled={hardcoreMode}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => saveChanges()}
                            className={`w-full bg-transparent text-lg font-bold outline-none placeholder-gray-400 ${hardcoreMode ? 'text-gray-500' : 'text-gray-900'}`}
                        />
                        <textarea 
                            ref={descRef}
                            disabled={hardcoreMode}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={() => saveChanges()}
                            placeholder={t('add.description_placeholder')}
                            className={`w-full bg-transparent text-sm outline-none placeholder-gray-400 resize-none overflow-hidden ${hardcoreMode ? 'text-gray-400' : 'text-gray-600'}`}
                            rows={1}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1 block h-8 leading-tight">
                                {t('detail.date')}
                            </label>
                            <input 
                                type="date"
                                disabled={hardcoreMode}
                                value={plannedDate}
                                onChange={(e) => {
                                    setPlannedDate(e.target.value);
                                    saveChanges({ plannedDate: e.target.value });
                                }}
                                className={`w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none text-sm font-medium transition-colors ${hardcoreMode ? 'text-gray-400' : 'text-gray-900 focus:bg-white focus:border-gray-200'}`}
                            />
                        </div>
                        
                         <div>
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1 block h-8 leading-tight">
                                {t('detail.duration')}
                            </label>
                            <div className={`flex items-center bg-gray-50 border border-gray-100 rounded-xl overflow-hidden transition-colors ${!hardcoreMode && 'focus-within:bg-white focus-within:border-gray-200'}`}>
                                <input 
                                    type="number"
                                    disabled={hardcoreMode}
                                    value={durationVal}
                                    onChange={(e) => setDurationVal(e.target.value)}
                                    onBlur={() => saveChanges()}
                                    placeholder="0"
                                    className={`w-full bg-transparent p-3 outline-none text-sm font-medium appearance-none no-spinner ${hardcoreMode ? 'text-gray-400' : 'text-gray-900'}`}
                                />
                                <button 
                                    onClick={handleUnitToggle}
                                    disabled={hardcoreMode}
                                    className={`h-full px-3 py-3 text-sm font-bold border-l border-gray-200 transition-colors flex items-center justify-center shrink-0 min-w-[50px] gap-1 ${hardcoreMode ? 'bg-gray-50 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 active:bg-gray-300'}`}
                                >
                                    {durationUnit}
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 block px-1">{t('detail.category')}</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['q1', 'q2', 'q3', 'q4'] as const).map((cat) => (
                                <button 
                                    key={cat}
                                    disabled={hardcoreMode}
                                    onClick={() => {
                                        setCategory(cat);
                                        saveChanges({ category: cat });
                                    }}
                                    className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                                        hardcoreMode ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'
                                    } ${
                                        category === cat 
                                        ? cat === 'q1' ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200' :
                                          cat === 'q2' ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200' :
                                          cat === 'q3' ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200' :
                                          'bg-slate-500 text-white border-slate-500 shadow-md shadow-slate-200'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                   {cat === 'q1' && <Zap className="w-4 h-4" />}
                                   {cat === 'q2' && <Calendar className="w-4 h-4" />}
                                   {cat === 'q3' && <Users className="w-4 h-4" />}
                                   {cat === 'q4' && <Coffee className="w-4 h-4" />}
                                   <span className="text-sm font-bold">{t(`${cat}.title`)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                     <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400 px-1 pt-2 border-t border-gray-50">
                        <Clock className="w-3 h-3" />
                        <span>{t('detail.created')}: {formatDate(task.createdAt)}</span>
                        <span className="mx-1">•</span>
                        <span className="font-mono opacity-50">ID: {task.id.slice(0, 4)}</span>
                    </div>

                    <div className="pt-2">
                         <button 
                            onClick={handleDelete}
                            className="w-full py-4 rounded-xl bg-red-50 text-red-600 font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-red-100"
                        >
                            <Trash2 className="w-5 h-5" />
                            {t('detail.delete')}
                        </button>
                    </div>
                    
                    {/* Safe Area Spacer + Navigation Bar Clearance */}
                    <div className="h-32"></div>
                </div>
            </div>
        </motion.div>
    </div>
  );
};