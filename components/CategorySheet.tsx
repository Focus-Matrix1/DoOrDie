
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Calendar, Users, Coffee, X } from 'lucide-react';
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
    <AnimatePresence>
      <div 
          className="fixed inset-0 z-[100] flex items-end justify-center select-none"
      >
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div 
              initial={{ translateY: "100%" }}
              animate={{ translateY: 0 }}
              exit={{ translateY: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] p-6 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-2xl z-10"
              onClick={(e) => e.stopPropagation()}
          >
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-6" />

              <div className="flex justify-between items-center mb-8">
                  <div className="flex flex-col">
                      <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-1">快速分类</span>
                      <span className="text-[18px] font-bold text-gray-900 truncate max-w-[240px]">
                          {task.title}
                      </span>
                  </div>
                  <button 
                      onClick={onClose}
                      className="p-2 bg-gray-50 rounded-full active:scale-90 transition-transform"
                  >
                      <X className="w-5 h-5 text-gray-400" />
                  </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                  <button 
                    onClick={() => handleSelect('q1')} 
                    className="p-5 bg-rose-50 border border-rose-100 rounded-[24px] flex flex-col items-center gap-2 active:bg-rose-100 active:scale-95 transition-all h-auto min-h-[110px] justify-center group"
                  >
                      <Zap className="w-8 h-8 text-rose-500 shrink-0 group-active:scale-110 transition-transform" strokeWidth={2.5} />
                      <div className="text-center w-full">
                          <div className="text-sm font-black text-rose-700 leading-tight">{t('q1.title')}</div>
                          <div className="text-[10px] text-rose-400 font-bold mt-0.5 uppercase tracking-tight">{t('q1.subtitle')}</div>
                      </div>
                  </button>
                  <button 
                    onClick={() => handleSelect('q2')} 
                    className="p-5 bg-blue-50 border border-blue-100 rounded-[24px] flex flex-col items-center gap-2 active:bg-blue-100 active:scale-95 transition-all h-auto min-h-[110px] justify-center group"
                  >
                      <Calendar className="w-8 h-8 text-blue-500 shrink-0 group-active:scale-110 transition-transform" strokeWidth={2.5} />
                      <div className="text-center w-full">
                          <div className="text-sm font-black text-blue-700 leading-tight">{t('q2.title')}</div>
                          <div className="text-[10px] text-blue-400 font-bold mt-0.5 uppercase tracking-tight">{t('q2.subtitle')}</div>
                      </div>
                  </button>
                  <button 
                    onClick={() => handleSelect('q3')} 
                    className="p-5 bg-amber-50 border border-amber-100 rounded-[24px] flex flex-col items-center gap-2 active:bg-amber-100 active:scale-95 transition-all h-auto min-h-[110px] justify-center group"
                  >
                      <Users className="w-8 h-8 text-amber-500 shrink-0 group-active:scale-110 transition-transform" strokeWidth={2.5} />
                      <div className="text-center w-full">
                          <div className="text-sm font-black text-amber-700 leading-tight">{t('q3.title')}</div>
                          <div className="text-[10px] text-amber-400 font-bold mt-0.5 uppercase tracking-tight">{t('q3.subtitle')}</div>
                      </div>
                  </button>
                  <button 
                    onClick={() => handleSelect('q4')} 
                    className="p-5 bg-slate-50 border border-slate-100 rounded-[24px] flex flex-col items-center gap-2 active:bg-slate-100 active:scale-95 transition-all h-auto min-h-[110px] justify-center group"
                  >
                      <Coffee className="w-8 h-8 text-slate-500 shrink-0 group-active:scale-110 transition-transform" strokeWidth={2.5} />
                      <div className="text-center w-full">
                          <div className="text-sm font-black text-slate-700 leading-tight">{t('q4.title')}</div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-tight">{t('q4.subtitle')}</div>
                      </div>
                  </button>
              </div>
          </motion.div>
      </div>
    </AnimatePresence>
  );
};
