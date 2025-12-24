import React, { useState, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { CategoryId } from '../types';
import { Zap, Calendar, Users, Coffee, Repeat, Clock, CheckCircle, Sparkles, Bot } from 'lucide-react';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddModal: React.FC<AddModalProps> = ({ isOpen, onClose }) => {
  const { addTask, addHabit, selectedDate, aiMode } = useTasks();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId>('inbox');
  
  // Habit States
  const [isHabit, setIsHabit] = useState(false);
  const [freqVal, setFreqVal] = useState('1');
  const [freqUnit, setFreqUnit] = useState('d');

  // AI Visual States
  const [isProcessing, setIsProcessing] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Color palette for habits (auto-assigned usually, but logic exists)
  const colors = [
      'bg-rose-500', 'bg-blue-500', 'bg-amber-400', 
      'bg-green-500', 'bg-purple-500', 'bg-indigo-500'
  ];

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
      setIsHabit(false);
      setFreqVal('1');
      setFreqUnit('d');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (title.trim()) {
      // If AI is on and it's a task (not habit), show the "Parsing" animation
      if (!isHabit && aiMode) {
          setIsProcessing(true);
          // Artificial delay to let the user see the cool animation
          await new Promise(resolve => setTimeout(resolve, 600)); 
      }

      if (isHabit) {
          // Add as Habit
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          const frequency = `${freqVal}${freqUnit}`;
          addHabit(title.trim(), randomColor, frequency);
      } else {
          // Add as Task
          const dateToSave = category === 'inbox' ? undefined : selectedDate;
          addTask(title.trim(), category, dateToSave, description.trim());
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    // Updated background to bg-black/20 for lighter gray appearance
    <div 
        className="fixed inset-0 z-[80] bg-black/20 backdrop-blur-sm flex items-end justify-center animate-fade-in"
        onClick={onClose}
    >
        <div 
            className="w-full max-w-lg mx-auto bg-white rounded-t-[32px] p-6 pb-8 shadow-2xl slide-up relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            {/* AI Parsing Ripple Effect Overlay */}
            {isProcessing && (
                <div className="absolute top-0 left-0 right-0 h-1 z-50">
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <button 
                    className="text-gray-400 text-sm font-medium px-2 py-1" 
                    onClick={onClose}
                >
                    {t('list.cancel')}
                </button>
                <div className="flex items-center gap-1.5">
                    <span className="text-[15px] font-bold text-gray-900">{isHabit ? t('habits.add') : t('add.title')}</span>
                    {!isHabit && aiMode && (
                        <div className={`transition-opacity duration-300 ${isProcessing ? 'opacity-100' : 'opacity-30'}`}>
                           <Bot className={`w-3.5 h-3.5 text-purple-600 ${isProcessing ? 'animate-pulse' : ''}`} />
                        </div>
                    )}
                </div>
                <button 
                    className={`text-sm font-bold h-8 px-4 flex items-center justify-center rounded-full transition-all duration-200 ${
                         !title.trim() ? 'bg-gray-100 text-gray-400' : 'bg-black text-white'
                    }`}
                    onClick={() => handleSubmit()}
                    disabled={!title.trim() || isProcessing}
                >
                    {isProcessing ? <Sparkles className="w-4 h-4 animate-spin text-purple-200" /> : t('add.button')}
                </button>
            </div>

            {/* Input Area */}
            <div className="space-y-4 mb-6 relative">
                <textarea 
                    ref={inputRef}
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        adjustHeight(e.target);
                    }}
                    placeholder={isHabit ? t('habits.add') : t('add.placeholder')}
                    rows={1}
                    className="w-full text-xl font-medium placeholder-gray-300 border-none focus:ring-0 p-0 bg-transparent outline-none text-gray-900 resize-none max-h-[120px]"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                />
                
                {/* Visual Feedback Line for AI */}
                {aiMode && !isHabit && title.length > 0 && !isProcessing && (
                     <div className="h-0.5 w-full bg-gray-50 rounded-full overflow-hidden">
                         <div className="h-full w-1/3 bg-purple-100/50 blur-sm animate-pulse transform -translate-x-full" style={{ animationDuration: '2s', animationIterationCount: 'infinite', animationName: 'slideRight' }}></div>
                     </div>
                )}
                
                {/* Description only for Tasks */}
                {!isHabit && (
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
                )}
            </div>

            {/* Habit Toggle & Frequency */}
            <div className="flex items-center justify-between mb-4 border-t border-gray-100 pt-4">
                 <div 
                    onClick={() => setIsHabit(!isHabit)}
                    className="flex items-center gap-2 cursor-pointer select-none group"
                 >
                     <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isHabit ? 'bg-black border-black' : 'border-gray-300 bg-white'}`}>
                        {isHabit && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                     </div>
                     <span className={`text-sm font-bold ${isHabit ? 'text-gray-900' : 'text-gray-500'}`}>{t('habits.title')} / Repeat</span>
                 </div>

                 {isHabit && (
                     <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100 animate-fade-in">
                        <Clock className="w-3.5 h-3.5 text-gray-400 ml-2 mr-1" />
                        <input 
                            type="number" 
                            min="1"
                            value={freqVal}
                            onChange={(e) => setFreqVal(e.target.value)}
                            className="w-8 bg-transparent text-sm font-bold text-center outline-none border-r border-gray-200" 
                        />
                        <button 
                            onClick={() => setFreqUnit(freqUnit === 'd' ? 'h' : 'd')}
                            className="w-8 h-6 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded flex items-center justify-center transition-colors"
                        >
                            {freqUnit}
                        </button>
                     </div>
                 )}
            </div>

            {/* Category Selector (Only for Tasks) */}
            {!isHabit && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 animate-fade-in">
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setCategory('inbox')}
                        className={`px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0 transition-colors ${category === 'inbox' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${category === 'inbox' ? 'bg-white' : 'bg-gray-400'}`}></div>
                        <span className="text-xs font-bold">{t('matrix.inbox')}</span>
                    </button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => setCategory('q1')} className={`px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0 transition-colors ${category === 'q1' ? 'bg-rose-500 text-white border-rose-500' : 'border-gray-200 text-gray-500'}`}><Zap className="w-3 h-3" /><span className="text-xs font-bold">Q1</span></button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => setCategory('q2')} className={`px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0 transition-colors ${category === 'q2' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-200 text-gray-500'}`}><Calendar className="w-3 h-3" /><span className="text-xs font-bold">Q2</span></button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => setCategory('q3')} className={`px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0 transition-colors ${category === 'q3' ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-500'}`}><Users className="w-3 h-3" /><span className="text-xs font-bold">Q3</span></button>
                    <button onMouseDown={(e) => e.preventDefault()} onClick={() => setCategory('q4')} className={`px-3 py-2 rounded-xl border flex items-center gap-2 shrink-0 transition-colors ${category === 'q4' ? 'bg-slate-500 text-white border-slate-500' : 'border-gray-200 text-gray-500'}`}><Coffee className="w-3 h-3" /><span className="text-xs font-bold">Q4</span></button>
                </div>
            )}
            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite linear;
                }
                @keyframes slideRight {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    </div>
  );
};