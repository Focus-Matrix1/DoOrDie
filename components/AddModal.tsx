import React, { useState, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { CategoryId } from '../types';
import { Zap, Calendar, Users, Coffee, Inbox } from 'lucide-react';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddModal: React.FC<AddModalProps> = ({ isOpen, onClose }) => {
  const { addTask, selectedDate } = useTasks();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId>('inbox');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  const adjustHeight = (el: HTMLTextAreaElement | null) => {
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
          inputRef.current?.focus();
          adjustHeight(inputRef.current);
      }, 100);
      setTitle('');
      setDescription('');
      setCategory('inbox');
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (title.trim()) {
      // Add task immediately
      addTask(title.trim(), category, selectedDate, description.trim());
      // Close immediately, visual feedback is handled by App.tsx FAB
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-[80] bg-black/20 backdrop-blur-sm flex items-end animate-fade-in"
        onClick={onClose}
    >
        <div 
            className="w-full bg-white rounded-t-[32px] p-6 pb-8 shadow-2xl slide-up"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-4">
                <button 
                    className="text-gray-400 text-sm font-medium px-2 py-1" 
                    onClick={onClose}
                >
                    {t('list.cancel')}
                </button>
                <span className="text-[15px] font-bold text-gray-900">{t('add.title')}</span>
                <button 
                    className={`text-sm font-bold h-8 px-4 flex items-center justify-center rounded-full transition-all duration-200 ${
                         !title.trim() ? 'bg-gray-100 text-gray-400' : 'bg-black text-white'
                    }`}
                    onClick={() => handleSubmit()}
                    disabled={!title.trim()}
                >
                    {t('add.button')}
                </button>
            </div>

            <div className="space-y-4 mb-6">
                <textarea 
                    ref={inputRef}
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        adjustHeight(e.target);
                    }}
                    placeholder={t('add.placeholder')}
                    rows={1}
                    className="w-full text-xl font-medium placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent outline-none text-gray-900 resize-none max-h-[120px]"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
                
                <textarea 
                    ref={descRef}
                    value={description}
                    onChange={(e) => {
                        setDescription(e.target.value);
                        adjustHeight(e.target);
                    }}
                    placeholder={t('add.description_placeholder')}
                    rows={1}
                    className="w-full text-sm font-normal placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent outline-none text-gray-600 resize-none max-h-[100px]"
                />
            </div>

            {/* Category Selector */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                <button
                    onClick={() => setCategory('inbox')}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0 transition-colors ${category === 'inbox' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500'}`}
                >
                    <div className={`w-2 h-2 rounded-full ${category === 'inbox' ? 'bg-white' : 'bg-gray-400'}`}></div>
                    <span className="text-xs font-bold">{t('matrix.inbox')}</span>
                </button>
                <button onClick={() => setCategory('q1')} className={`px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0 transition-colors ${category === 'q1' ? 'bg-rose-500 text-white border-rose-500' : 'border-gray-200 text-gray-500'}`}><Zap className="w-3 h-3" /><span className="text-xs font-bold">Q1</span></button>
                <button onClick={() => setCategory('q2')} className={`px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0 transition-colors ${category === 'q2' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-500'}`}><Calendar className="w-3 h-3" /><span className="text-xs font-bold">Q2</span></button>
                <button onClick={() => setCategory('q3')} className={`px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0 transition-colors ${category === 'q3' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-500'}`}><Users className="w-3 h-3" /><span className="text-xs font-bold">Q3</span></button>
                <button onClick={() => setCategory('q4')} className={`px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0 transition-colors ${category === 'q4' ? 'bg-slate-500 text-white border-slate-500' : 'border-gray-200 text-gray-500'}`}><Coffee className="w-3 h-3" /><span className="text-xs font-bold">Q4</span></button>
            </div>
        </div>
    </div>
  );
};