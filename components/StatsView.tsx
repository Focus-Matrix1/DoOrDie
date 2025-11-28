import React from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { TrendingUp, Award, Clock } from 'lucide-react';

export const StatsView: React.FC = () => {
  const { tasks } = useTasks();
  const { t } = useLanguage();
  
  const q1Count = tasks.filter(t => t.category === 'q1').length;
  const completedCount = tasks.filter(t => t.completed).length;
  
  // Mock data calculations
  const totalTasks = tasks.length || 1;
  const focusScore = Math.round((q1Count / totalTasks) * 100);

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F4F7]">
      <div className="px-6 pt-8 pb-4 shrink-0">
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">{t('stats.title')}</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-5 pb-32">
        {/* Main Insight Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-blue-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-8 -mt-8 opacity-60"></div>
            <div className="relative z-10 space-y-6">
                <div>
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-bold text-gray-900 font-['Inter']">{completedCount}</span>
                        <span className="text-sm font-medium text-gray-500">{t('stats.tasks_completed')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="px-1.5 py-0.5 bg-green-100 rounded text-[10px] font-bold text-green-700 flex items-center gap-1">
                             <TrendingUp className="w-3 h-3" /> ↑ 12%
                        </div>
                        <span className="text-xs text-gray-400">{t('stats.vs_last_week')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-gray-50 p-3 rounded-xl">
                         <div className="text-gray-400 text-xs font-medium mb-1">{t('stats.focus_score')}</div>
                         <div className="text-xl font-bold text-gray-900">{focusScore}<span className="text-sm text-gray-400">%</span></div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                         <div className="text-gray-400 text-xs font-medium mb-1">{t('stats.avg_time')}</div>
                         <div className="text-xl font-bold text-gray-900">24<span className="text-sm text-gray-400">m</span></div>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <p className="text-[14px] font-medium text-gray-700 leading-relaxed">
                        {t('stats.quote')}
                    </p>
                </div>
            </div>
        </div>

        {/* Achievement Mockup */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Award className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-gray-900">{t('stats.badge.title')}</h3>
                <p className="text-xs text-gray-500">{t('stats.badge.desc')}</p>
            </div>
        </div>
      </div>
    </div>
  );
};