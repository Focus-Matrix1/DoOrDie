
import React, { useState, forwardRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { Check, Coffee, BookOpen, Dumbbell, Droplets, Repeat, Zap, Sparkles, Wind, Trash2 } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Habit } from '../types';

const COLOR_MAP: Record<string, string> = {
  'bg-rose-500': '#F43F5E',
  'bg-blue-500': '#3B82F6',
  'bg-amber-400': '#FBBF24',
  'bg-green-500': '#22C55E',
  'bg-purple-500': '#A855F7',
  'bg-indigo-500': '#6366F1',
};

const ICON_MAP: Record<string, React.ReactNode> = {
  'Book': <BookOpen size={18} />,
  'Droplet': <Droplets size={18} />,
  'Check': <Check size={18} />,
  'Zap': <Zap size={18} />,
  'Coffee': <Coffee size={18} />,
  'Dumbbell': <Dumbbell size={18} />,
};

const getHexColor = (tailwindClass: string) => COLOR_MAP[tailwindClass] || '#6366F1';
const getIcon = (iconName: string) => ICON_MAP[iconName] || <Sparkles size={18} />;

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HabitCard = forwardRef<HTMLDivElement, { habit: Habit; onComplete: (id: string) => void; onDelete: (id: string) => void }>(({ habit, onComplete, onDelete }, ref) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const DELETE_REVEAL_WIDTH = -80; 
  const COMPLETE_THRESHOLD = 150;
  const hexColor = getHexColor(habit.color);

  const greenOpacity = useTransform(x, [0, 40], [0, 1]);
  const redOpacity = useTransform(x, [-40, 0], [1, 0]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleGlobalInteraction = (e: any) => {
        if (e.target.closest('.delete-btn-trigger')) return;
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 40 } });
        setIsMenuOpen(false);
    };
    window.addEventListener('mousedown', handleGlobalInteraction, true);
    window.addEventListener('touchstart', handleGlobalInteraction, true);
    return () => {
      window.removeEventListener('mousedown', handleGlobalInteraction, true);
      window.removeEventListener('touchstart', handleGlobalInteraction, true);
    };
  }, [isMenuOpen, controls]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (!isMenuOpen) {
      if (offset < -40 || velocity < -150) {
        await controls.start({ x: DELETE_REVEAL_WIDTH, transition: { type: 'spring', stiffness: 500, damping: 40 } });
        setIsMenuOpen(true);
      } else if (offset > COMPLETE_THRESHOLD) {
        await controls.start({ x: 600, opacity: 0, transition: { duration: 0.2 } });
        onComplete(habit.id);
      } else {
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 40 } });
      }
    } else {
      if (offset > 20 || velocity > 150) {
        await controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 40 } });
        setIsMenuOpen(false);
      } else {
        controls.start({ x: DELETE_REVEAL_WIDTH, transition: { type: 'spring', stiffness: 500, damping: 40 } });
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="relative w-full mb-3 overflow-hidden rounded-2xl select-none will-change-transform"
    >
      <div className="absolute inset-0 z-0">
        <motion.div 
          style={{ opacity: greenOpacity }}
          className="absolute inset-0 bg-emerald-500 flex items-center justify-start pl-8"
        >
          <Check size={24} className="text-white" strokeWidth={3} />
          <span className="ml-2 text-white font-bold text-xs uppercase">完成</span>
        </motion.div>
        <motion.div 
          style={{ opacity: redOpacity }}
          className="absolute inset-0 bg-red-500"
        >
          <motion.button 
            onTap={() => onDelete(habit.id)}
            className="delete-btn-trigger absolute right-0 top-0 bottom-0 w-20 flex flex-col items-center justify-center text-white active:brightness-90 transition-all z-20"
          >
            <Trash2 size={22} />
            <span className="text-[10px] font-bold mt-1">删除</span>
          </motion.button>
        </motion.div>
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={isMenuOpen ? { left: DELETE_REVEAL_WIDTH, right: 0 } : { left: -500, right: 600 }}
        dragElastic={isMenuOpen ? 0.02 : 0.08} 
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className="relative z-10 bg-white border border-gray-100 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing will-change-transform"
      >
        <div className="flex items-center p-4">
          <div className="mr-4">
             <div 
                className="w-11 h-11 rounded-full flex items-center justify-center bg-gray-50/50 border border-gray-50"
                style={{ color: hexColor }}
             >
                {getIcon(habit.icon)}
             </div>
          </div>
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">DAILY</span>
                {habit.streak > 0 && <span className="text-[9px] font-black text-orange-500">🔥 {habit.streak}</span>}
             </div>
             <h3 className="text-[15px] font-bold text-gray-900 truncate">{habit.title}</h3>
             <p className="text-[11px] font-medium text-gray-400 mt-0.5 flex items-center gap-1"><Repeat size={10} />每 {habit.frequency === '1d' ? '天' : habit.frequency} 一次</p>
          </div>
          <motion.div 
            className="ml-2 w-10 h-10 flex items-center justify-center active:scale-90"
            onTap={(e) => { 
              e.stopPropagation(); 
              if (!isMenuOpen) {
                controls.start({ x: 500, opacity: 0 }).then(() => onComplete(habit.id));
              }
            }}
          >
             <div className="w-6 h-6 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-200">
                <Check size={14} strokeWidth={3} />
             </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
});

HabitCard.displayName = 'HabitCard';

const CompletedItem: React.FC<{ habit: Habit }> = ({ habit }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex items-center gap-3 py-3 px-4 bg-white/60 border border-gray-50 rounded-xl mb-2"
  >
    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
    <span className="text-sm text-gray-400 font-medium line-through decoration-gray-200">{habit.title}</span>
  </motion.div>
);

export const HabitView: React.FC = () => {
  const { habits, toggleHabit, deleteHabit } = useTasks();
  const { t, language } = useLanguage();

  const todayStr = getLocalDateString();
  const activeHabits = habits.filter(h => !h.completedDates.includes(todayStr));
  const completedHabits = habits.filter(h => h.completedDates.includes(todayStr));

  const handleComplete = (id: string) => toggleHabit(id, todayStr);
  const handleDelete = (id: string) => deleteHabit(id);

  const todayLabel = new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative bg-[#F5F7FA]">
      <div className="px-6 pt-10 pb-4 shrink-0">
        <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-1">{todayLabel}</h2>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">习惯追踪</h1>
      </div>
      <main className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32">
             <AnimatePresence>
                {activeHabits.map(habit => (
                    <HabitCard 
                        key={habit.id} 
                        habit={habit} 
                        onComplete={handleComplete} 
                        onDelete={handleDelete}
                    />
                ))}
             </AnimatePresence>
             {activeHabits.length === 0 && habits.length > 0 && (
                <div className="py-20 flex flex-col items-center justify-center opacity-40">
                    <Wind size={32} className="text-gray-200 mb-2" />
                    <p className="text-sm font-bold text-gray-400">今日已全部达成</p>
                </div>
             )}
      </main>
      {completedHabits.length > 0 && (
          <footer className="px-6 pb-28 pt-4 border-t border-gray-100 bg-white/40 backdrop-blur-md">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">今日已完成</h4>
              {completedHabits.map(habit => <CompletedItem key={habit.id} habit={habit} />)}
          </footer>
      )}
    </div>
  );
};
