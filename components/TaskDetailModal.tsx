import React, { useState, useEffect } from 'react';
import { X, Zap, Calendar, Users, Coffee, Clock, Trash2 } from 'lucide-react';
import { Task, CategoryId } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onUpdate, onDelete, t }) => {
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