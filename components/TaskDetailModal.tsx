
import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, Calendar, Users, Coffee, Clock, Trash2, ShieldAlert } from 'lucide-react';
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

const UNITS = ['m', 'h', 'd', 's'];

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
            return localStorage.getItem('focus-matrix-last-unit') || 'm';
        }
    } catch {}
    return 'm';
  });

  const descRef = useRef<HTMLTextAreaElement>(null);

  // Parse initial duration string (e.g. "30m" -> val:30, unit:m)
  useEffect(() => {
    if (task) {
      // Use localized title if key exists, otherwise raw title
      setTitle(task.translationKey ? t(task.translationKey) : task.title);
      setDescription(task.description || '');
      setCategory(task.category === 'inbox' ? 'q1' : task.category);
      setPlannedDate(task.plannedDate || '');
      
      if (task.duration) {
          const match = task.duration.match(/^([\d.]+)([smhd])$/);
          if (match) {
              setDurationVal(match[1]);
              setDurationUnit(match[2]);
          } else {
              setDurationVal(task.duration); // Fallback
          }
      } else {
          setDurationVal('');
      }
    }
  }, [task, t]);

  // Auto-resize textarea
  useEffect(() => {
      if (descRef.current) {
          descRef.current.style.height = 'auto';
          descRef.current.style.height = descRef.current.scrollHeight + 'px';
      }
  }, [description]);

  // Save Unit Preference
  useEffect(() => {
      try {
          localStorage.setItem('focus-matrix-last-unit', durationUnit);
      } catch {}
  }, [durationUnit]);

  if (!task) return null;

  // --- Auto Save Logic ---
  const saveChanges = (overrides?: Partial<Task> & { dVal?: string, dUnit?: string }) => {
      if (hardcoreMode) return; // Prevent saving in hardcore mode

      const currentVal = overrides?.dVal !== undefined ? overrides.dVal : durationVal;
      const currentUnit = overrides?.dUnit !== undefined ? overrides.dUnit : durationUnit;
      
      const finalDuration = currentVal.trim() ? `${currentVal}${currentUnit}` : undefined;

      // Logic to break localization if title changed
      const currentDisplayedTitle = task.translationKey ? t(task.translationKey) : task.title;
      const newTitle = overrides?.title ?? title;
      
      const updates: Partial<Task> = {
          title: newTitle,
          description: overrides?.description ?? description,
          category: overrides?.category ?? category,
          plannedDate: overrides?.plannedDate ?? plannedDate,
          duration: finalDuration
      };

      // If user edited the localized title, clear the translationKey so the edit persists as static text
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
      // Trigger save immediately for unit change if value exists
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
    // Fixed: Updated background to bg-black/20 for lighter gray contrast
    <div 
        className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-end justify-center animate-fade-in"
        onClick={onClose}
    >
        <div 
            className="w-full bg-white rounded-t-[32px] p-6 pb-safe shadow-2xl slide-up"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-6">
                <span className="text-[18px] font-bold text-gray-900">{t('detail.title')}</span>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full active:scale-95">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            <div className="space-y-6">
                {/* Hardcore Mode Locked Indicator */}
                {hardcoreMode && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center gap-2 animate-fade-in">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-bold text-rose-600">{t('detail.hardcore_locked')}</span>
                    </div>
                )}

                {/* Title & Description Input (Auto-save on Blur) */}
                <div className={`bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 transition-all ${!hardcoreMode && 'focus-within:ring-2 focus-within:ring-black/5'}`}>
                    <input 
                        type="text" 
                        disabled={hardcoreMode}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={() => saveChanges()}
                        className={`w-full bg-transparent text-lg font-medium outline-none placeholder-gray-400 ${hardcoreMode ? 'text-gray-500' : 'text-gray-900'}`}
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
                    {/* Date Input (Auto-save on Change) */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1 min-h-[32px] flex items-end">
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
                            className={`w-full bg-gray-50 border border-gray-100 rounded-xl p-3 outline-none text-sm transition-colors ${hardcoreMode ? 'text-gray-400' : 'text-gray-900 focus:border-gray-300'}`}
                        />
                    </div>
                    
                    {/* Duration Input (Number Left, Unit Right) */}
                     <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1 min-h-[32px] flex items-end">
                            {t('detail.duration')}
                        </label>
                        <div className={`flex items-center bg-gray-50 border border-gray-100 rounded-xl overflow-hidden transition-colors ${!hardcoreMode && 'focus-within:border-gray-300'}`}>
                            <input 
                                type="number"
                                disabled={hardcoreMode}
                                value={durationVal}
                                onChange={(e) => setDurationVal(e.target.value)}
                                onBlur={() => saveChanges()}
                                placeholder="0"
                                className={`w-full bg-transparent p-3 outline-none text-sm appearance-none ${hardcoreMode ? 'text-gray-400' : 'text-gray-900'}`}
                            />
                            <button 
                                onClick={handleUnitToggle}
                                disabled={hardcoreMode}
                                className={`h-full px-3 py-3 text-sm font-bold border-l border-gray-200 transition-colors w-[40px] flex items-center justify-center shrink-0 ${hardcoreMode ? 'bg-gray-50 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 active:bg-gray-300'}`}
                            >
                                {durationUnit}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Category Selection (Auto-save on Click) */}
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block px-1">{t('detail.category')}</label>
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
                                    ? cat === 'q1' ? 'bg-rose-500 text-white border-rose-500' :
                                      cat === 'q2' ? 'bg-blue-500 text-white border-blue-500' :
                                      cat === 'q3' ? 'bg-amber-500 text-white border-amber-500' :
                                      'bg-slate-500 text-white border-slate-500'
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
                
                {/* Meta Info */}
                 <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('detail.created')}: {formatDate(task.createdAt)}</span>
                </div>

                {/* Actions (Delete only, no Save button) */}
                <div className="pt-2">
                     <button 
                        onClick={handleDelete}
                        className="w-full py-3.5 rounded-xl bg-red-50 text-red-600 font-bold active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-red-100"
                    >
                        <Trash2 className="w-5 h-5" />
                        {t('detail.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};
