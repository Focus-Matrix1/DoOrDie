import React, { useState, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddModal: React.FC<AddModalProps> = ({ isOpen, onClose }) => {
  const { addTask } = useTasks();
  const { t } = useLanguage();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim()) {
      addTask(value.trim());
      setValue('');
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
            <div className="flex justify-between items-center mb-6">
                <button className="text-gray-400 text-sm font-medium px-2 py-1" onClick={onClose}>{t('list.cancel')}</button>
                <span className="text-[15px] font-bold text-gray-900">{t('add.title')}</span>
                <button 
                    className={`text-sm font-bold px-3 py-1 bg-black text-white rounded-full transition-opacity ${!value.trim() ? 'opacity-50' : 'opacity-100'}`}
                    onClick={() => handleSubmit()}
                    disabled={!value.trim()}
                >
                    {t('add.button')}
                </button>
            </div>
            <form onSubmit={handleSubmit}>
                <input 
                    ref={inputRef}
                    type="text" 
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={t('add.placeholder')}
                    className="w-full text-xl font-medium placeholder-gray-300 border-none focus:ring-0 p-0 mb-4 bg-transparent outline-none text-gray-900"
                />
            </form>
            <div className="flex gap-2 mt-2">
                 <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-medium">{t('add.hint')}</span>
            </div>
        </div>
    </div>
  );
};