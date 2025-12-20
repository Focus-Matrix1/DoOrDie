
import React, { useState, forwardRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import { Check, Coffee, BookOpen, Dumbbell, Droplets, Repeat, Zap, Sparkles, Wind, Trash2 } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Habit } from '../types';

/**
 * ------------------------------------------------------------------
 * Configuration & Helpers
 * ------------------------------------------------------------------
 */

// Map Tailwind classes from Context to Hex for motion style interpolation
const COLOR_MAP: Record<string, string> = {
  'bg-rose-500': '#F43F5E',
  'bg-blue-500': '#3B82F6',
  'bg-amber-400': '#FBBF24',
  'bg-green-500': '#22C55E',
  'bg-purple-500': '#A855F7',
  'bg-indigo-500': '#6366F1',
};

// Map Icon strings from Context to Lucide Components
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

/**
 * ------------------------------------------------------------------
 * Habit Card Component
 * Swipe right to complete, swipe left to delete
 * ------------------------------------------------------------------
 */
const HabitCard = forwardRef<HTMLDivElement, { habit: Habit; onComplete: (id: string) => void; onDelete: (id: string) => void }>(({ habit, onComplete, onDelete }, ref) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [isCompleted, setIsCompleted] = useState(false);

  const THRESHOLD = 100;
  const DELETE_THRESHOLD = -80;
  const hexColor = getHexColor(habit.color);

  // Transformations based on drag x position
  const progressWidth = useTransform(x, [0, THRESHOLD + 50], ["0%", "100%"]);
  const deleteProgressWidth = useTransform(x, [0, DELETE_THRESHOLD - 50], ["0%", "100%"]);
  const checkOpacity = useTransform(x, [THRESHOLD * 0.6, THRESHOLD], [0, 1]);
  const checkScale = useTransform(x, [THRESHOLD * 0.6, THRESHOLD], [0.5, 1.2]);
  
  const trashOpacity = useTransform(x, [DELETE_THRESHOLD * 0.6, DELETE_THRESHOLD], [0, 1]);
  const trashScale = useTransform(x, [DELETE_THRESHOLD * 0.6, DELETE_THRESHOLD], [0.5, 1.1]);

  const contentOpacity = useTransform(x, [DELETE_THRESHOLD, 0, THRESHOLD], [0.5, 1, 0.5]);
  const contentScale = useTransform(x, [DELETE_THRESHOLD, 0, THRESHOLD], [0.98, 1, 0.98]);

  const triggerCompletion = async () => {
    setIsCompleted(true);
    await controls.start({ x: 500, opacity: 0, transition: { duration: 0.35, ease: "backIn" } });
    onComplete(habit.id);
  };

  const triggerDeletion = async () => {
    await controls.start({ x: -500, opacity: 0, transition: { duration: 0.35, ease: "backIn" } });
    onDelete(habit.id);
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (info.offset.x > THRESHOLD) {
      await triggerCompletion();
    } else if (info.offset.x < DELETE_THRESHOLD) {
      await triggerDeletion();
    } else {
      controls.start({ x: 0, opacity: 1, scale: 1 });
    }
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="relative w-full mb-4 group touch-pan-y"
    >
      {/* Timeline connection line */}
      <div className="absolute left-[39px] -top-6 bottom-0 w-[1px] bg-stone-200 z-0 last:hidden" />

      {/* Delete Action Background (Right Side) */}
      <div className="absolute inset-0 z-0 bg-red-500 rounded-2xl flex items-center justify-end px-6 overflow-hidden">
        <motion.div style={{ opacity: trashOpacity, scale: trashScale }}>
            <Trash2 className="text-white" size={24} />
        </motion.div>
      </div>

      <motion.div
        style={{ x, scale: contentScale }}
        drag="x"
        dragConstraints={{ left: DELETE_THRESHOLD - 20, right: THRESHOLD + 20 }}
        dragElastic={0.12}
        onDragEnd={handleDragEnd}
        animate={controls}
        whileTap={{ cursor: "grabbing" }}
        className="relative z-10 bg-white rounded-2xl p-1 overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
      >
        {/* Progress Background Fill (Complete) */}
        <motion.div 
          className="absolute inset-y-0 left-0 z-0"
          style={{ 
            width: progressWidth,
            backgroundColor: `${hexColor}15`, 
          }}
        />

        <div className="relative z-10 flex items-center p-4 bg-white/80 backdrop-blur-sm rounded-xl">
          {/* Icon / Timeline Anchor */}
          <div className="flex items-center gap-4 mr-4">
             <div 
                className="w-12 h-12 rounded-full flex items-center justify-center border border-gray-100 bg-gray-50 text-gray-500 transition-colors group-hover:border-gray-200"
                style={{ color: hexColor }}
             >
                {getIcon(habit.icon)}
             </div>
          </div>

          {/* Text Content */}
          <motion.div style={{ opacity: contentOpacity }} className="flex-1">
             <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    Daily
                </span>
                {habit.streak > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                     <span className="text-[8px]">🔥</span> {habit.streak}
                  </span>
                )}
             </div>
             
             <h3 className="text-base font-bold text-gray-900 leading-tight">
                {habit.title}
             </h3>
             <p className="text-xs font-medium text-gray-400 flex items-center gap-1 mt-0.5">
                <Repeat size={10} />
                {habit.frequency || 'Every day'}
             </p>
          </motion.div>

          {/* Action Indicators - Clickable Check Button */}
          <div 
            className="relative w-10 h-10 flex items-center justify-center cursor-pointer rounded-full hover:bg-gray-50 active:scale-95 transition-all z-20"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                e.stopPropagation();
                triggerCompletion();
            }}
          >
             <motion.div 
                style={{ opacity: checkOpacity, scale: checkScale }}
                className="absolute text-emerald-500"
             >
                <Check size={24} strokeWidth={3} />
             </motion.div>
             
             <motion.div style={{ opacity: useTransform(x, [0, 50], [1, 0]) }}>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors border border-transparent hover:border-gray-300">
                    <Check size={16} strokeWidth={2.5} />
                </div>
             </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

HabitCard.displayName = 'HabitCard';

/**
 * ------------------------------------------------------------------
 * Completed Item (Archive Style)
 * ------------------------------------------------------------------
 */
const CompletedItem: React.FC<{ habit: Habit }> = ({ habit }) => (
  <motion.div
    layout
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-3 py-2 pl-2"
  >
    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
    <span className="text-sm text-gray-400 italic line-through decoration-gray-200">
        {habit.title}
    </span>
  </motion.div>
);

/**
 * ------------------------------------------------------------------
 * Main Habit View
 * ------------------------------------------------------------------
 */
export const HabitView: React.FC = () => {
  const { habits, toggleHabit, deleteHabit } = useTasks();
  const { t, language } = useLanguage();

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Separate Active vs Completed based on today's date
  const activeHabits = habits.filter(h => !h.completedDates.includes(todayStr));
  const completedHabits = habits.filter(h => h.completedDates.includes(todayStr));

  const handleComplete = (id: string) => {
      toggleHabit(id, todayStr);
  };

  const handleDelete = (id: string) => {
      if (window.confirm(t('habits.delete_confirm'))) {
          deleteHabit(id);
      }
  };

  // Consistent Date Formatting with Matrix View
  const today = new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative bg-[#F5F7FA]">
      
      {/* Header - Unified with MatrixView */}
      <div className="px-6 pt-6 pb-4 z-40 relative shrink-0 flex justify-between items-end">
        <div className="flex flex-col items-start select-none">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 font-['Inter']">{today}</h2>
          <h1 className="text-[34px] font-bold text-gray-900 leading-none tracking-tight">{t('habits.title')}</h1>
        </div>
      </div>

      {/* --- Body: Active List --- */}
      <main className="flex-1 relative no-scrollbar overflow-y-auto px-4 pb-32">
             <AnimatePresence mode='popLayout'>
                {activeHabits.map(habit => (
                    <HabitCard 
                        key={habit.id} 
                        habit={habit} 
                        onComplete={handleComplete} 
                        onDelete={handleDelete}
                    />
                ))}
             </AnimatePresence>

             {/* Empty State / All Done */}
             {activeHabits.length === 0 && habits.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-20 flex flex-col items-center justify-center text-center opacity-60"
                >
                    <Wind size={40} className="text-gray-300 mb-4" />
                    <p className="text-lg text-gray-500 italic">"The day is yours."</p>
                </motion.div>
             )}

             {/* True Empty State (No habits created yet) */}
             {habits.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                    <Sparkles size={32} className="text-gray-300 mb-4" />
                    <p className="text-sm text-gray-500 font-medium">{t('habits.empty')}</p>
                </div>
             )}
      </main>

      {/* --- Footer: Completed Archive --- */}
      {completedHabits.length > 0 && (
          <footer className="px-6 pb-24 pt-6 border-t border-gray-100 shrink-0 bg-[#F5F7FA]">
              <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                      Archive
                  </span>
              </div>
              <div className="min-h-[50px] space-y-1">
                  <AnimatePresence>
                      {completedHabits.map(habit => (
                          <CompletedItem key={habit.id} habit={habit} />
                      ))}
                  </AnimatePresence>
              </div>
          </footer>
      )}
    </div>
  );
};
