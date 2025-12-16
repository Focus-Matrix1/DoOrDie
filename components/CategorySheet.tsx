
import React from 'react';
import { Zap, Calendar, Users, Coffee } from 'lucide-react';
import { Task, CategoryId } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CategorySheetProps {
  task: Task | null;
  onClose: () => void;
  onMove: (taskId: string, category: CategoryId) => void;
}

export const CategorySheet: React.FC<CategorySheetProps> = ({ task, onClose, onMove }) => {
  const { t } = useLanguage();

  if (!task) return null;

  const handleSelect = (category: CategoryId) => {
    onMove(task.id, category);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-end animate-fade-in"
        onClick={onClose}
    >
        <div 
            className="w-full bg-white rounded-t-[32px] p-6 pb-safe shadow-2xl slide-up"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-6">
                <span className="text-[18px] font-bold text-gray-900 truncate max-w-[200px]">
                    {t('list.move_to').replace('{title}', task.title)}
                </span>
                <button 
                    onClick={onClose}
                    className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full active:scale-95"
                >
                    {t('list.cancel')}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={() => handleSelect('q1')} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform h-auto min-h-[100px] justify-center">
                    <Zap className="w-8 h-8 text-rose-500 shrink-0" />
                    <div className="text-center w-full">
                        <div className="text-xs sm:text-sm font-bold text-rose-700 leading-tight break-words text-balance">{t('q1.title')}</div>
                        <div className="text-[10px] text-rose-400 font-medium mt-0.5">{t('q1.subtitle')}</div>
                    </div>
                </button>
                <button onClick={() => handleSelect('q2')} className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform h-auto min-h-[100px] justify-center">
                    <Calendar className="w-8 h-8 text-blue-500 shrink-0" />
                    <div className="text-center w-full">
                        <div className="text-xs sm:text-sm font-bold text-blue-700 leading-tight break-words text-balance">{t('q2.title')}</div>
                        <div className="text-[10px] text-blue-400 font-medium mt-0.5">{t('q2.subtitle')}</div>
                    </div>
                </button>
                <button onClick={() => handleSelect('q3')} className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform h-auto min-h-[100px] justify-center">
                    <Users className="w-8 h-8 text-amber-500 shrink-0" />
                    <div className="text-center w-full">
                        <div className="text-xs sm:text-sm font-bold text-amber-700 leading-tight break-words text-balance">{t('q3.title')}</div>
                        <div className="text-[10px] text-amber-400 font-medium mt-0.5">{t('q3.subtitle')}</div>
                    </div>
                </button>
                <button onClick={() => handleSelect('q4')} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 active:scale-95 transition-transform h-auto min-h-[100px] justify-center">
                    <Coffee className="w-8 h-8 text-slate-500 shrink-0" />
                    <div className="text-center w-full">
                        <div className="text-xs sm:text-sm font-bold text-slate-700 leading-tight break-words text-balance">{t('q4.title')}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{t('q4.subtitle')}</div>
                    </div>
                </button>
            </div>
        </div>
    </div>
  );
};
