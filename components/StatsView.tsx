
import React, { useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { Zap, Clock, TrendingUp, Flame, Circle } from 'lucide-react';
import { Task, CategoryId } from '../types';

// Helper to parse duration string to hours (e.g., "30m" -> 0.5)
const parseDuration = (durationStr?: string): number => {
  if (!durationStr) return 0;
  const match = durationStr.match(/^([\d.]+)([smhd])$/);
  if (!match) return 0;
  
  const val = parseFloat(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return val / 3600;
    case 'm': return val / 60;
    case 'h': return val;
    case 'd': return val * 24;
    default: return 0;
  }
};

// Helper to get formatted date key YYYY-MM-DD
const getDateKey = (timestamp: number) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const StatsView: React.FC = () => {
  const { tasks } = useTasks();
  const { t, language } = useLanguage();
  
  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  
  // 1. Weekly Velocity (Tasks Completed in last 7 days)
  const last7DaysTasks = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    return completedTasks.filter(t => {
        const time = t.completedAt || t.createdAt;
        return time >= sevenDaysAgo.getTime();
    });
  }, [completedTasks]);

  const velocity = last7DaysTasks.length;

  // 2. Flow Speed (Avg Time from Create to Complete)
  const avgSpeed = useMemo(() => {
    if (velocity === 0) return null;
    
    const totalDiff = last7DaysTasks.reduce((acc, t) => {
        const end = t.completedAt || Date.now();
        return acc + Math.max(0, end - t.createdAt);
    }, 0);
    
    const avgMs = totalDiff / velocity;
    const avgHrs = avgMs / (1000 * 60 * 60);
    
    const isEfficient = avgHrs < 4;
    
    if (avgHrs < 1) return { val: Math.round(avgHrs * 60), unit: 'm', fast: isEfficient };
    if (avgHrs < 24) return { val: avgHrs.toFixed(1), unit: 'h', fast: isEfficient };
    return { val: (avgHrs / 24).toFixed(1), unit: 'd', fast: false };
  }, [last7DaysTasks, velocity]);

  // 3. Focus Hours (Manual Duration)
  const focusHours = useMemo(() => {
    return last7DaysTasks.reduce((acc, task) => acc + parseDuration(task.duration), 0);
  }, [last7DaysTasks]);

  const displayFocusHours = focusHours < 1 
    ? `${Math.round(focusHours * 60)}m` 
    : `${focusHours.toFixed(1)}h`;

  // 4. Streak
  const streak = useMemo(() => {
      if (completedTasks.length === 0) return 0;
      const dates = new Set(completedTasks.map(t => getDateKey(t.completedAt || t.createdAt)));
      let currentStreak = 0;
      const d = new Date();
      if (dates.has(getDateKey(d.getTime()))) currentStreak++;
      while (true) {
          d.setDate(d.getDate() - 1);
          if (dates.has(getDateKey(d.getTime()))) currentStreak++;
          else break;
      }
      return currentStreak;
  }, [completedTasks]);

  // 5. Quadrant Distribution (Donut Chart)
  const distribution = useMemo(() => {
    const counts = { q1: 0, q2: 0, q3: 0, q4: 0 };
    last7DaysTasks.forEach(t => {
      if (counts[t.category as keyof typeof counts] !== undefined) {
        counts[t.category as keyof typeof counts]++;
      }
    });
    return counts;
  }, [last7DaysTasks]);
  
  const totalDist = distribution.q1 + distribution.q2 + distribution.q3 + distribution.q4;

  // 6. Trend
  const trendData = useMemo(() => {
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        dateObj: d,
        key: getDateKey(d.getTime()),
        label: d.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'narrow' })
      };
    }).reverse();

    const data = last7Days.map(day => {
      const count = completedTasks.filter(t => {
        const time = t.completedAt || t.createdAt; 
        return getDateKey(time) === day.key;
      }).length;
      return { ...day, count };
    });

    const maxCount = Math.max(...data.map(d => d.count), 1);
    return data.map(d => ({ ...d, heightPercent: (d.count / maxCount) * 100 }));
  }, [completedTasks, language]);

  // SVG Donut Logic
  const donutSegments = useMemo(() => {
      if (totalDist === 0) return [{ color: 'text-gray-100', offset: 0, percent: 100 }];
      
      const radius = 16; // r=16
      const circumference = 2 * Math.PI * radius; // ~100.53
      let currentOffset = 0;
      
      const items = [
          { id: 'q1', val: distribution.q1, color: 'text-rose-500' },
          { id: 'q2', val: distribution.q2, color: 'text-blue-500' },
          { id: 'q3', val: distribution.q3, color: 'text-amber-400' },
          { id: 'q4', val: distribution.q4, color: 'text-slate-300' },
      ];
      
      return items.filter(i => i.val > 0).map(item => {
          const percent = (item.val / totalDist) * 100;
          const strokeLength = (percent / 100) * circumference;
          const segment = {
              ...item,
              strokeDasharray: `${strokeLength} ${circumference}`,
              strokeDashoffset: -currentOffset,
              percent
          };
          currentOffset += strokeLength;
          return segment;
      });
  }, [distribution, totalDist]);


  return (
    <div className="w-full h-full flex flex-col bg-[#F2F4F7]">
      <div className="px-6 pt-8 pb-4 shrink-0 flex justify-between items-center">
        <h1 className="text-[28px] font-bold text-gray-900 tracking-tight">{t('stats.title')}</h1>
        {streak > 1 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                <Flame className="w-4 h-4 fill-current" />
                <span className="text-xs font-bold">{streak} {t('stats.streak')}</span>
            </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-5 pb-32">
        
        {/* Hero Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-blue-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
            <div className="relative z-10 flex gap-6">
                <div className="flex-1 flex flex-col justify-center">
                    <span className="text-5xl font-black text-gray-900 font-['Inter'] leading-none tracking-tight">{velocity}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-2">{t('stats.tasks_completed')}</span>
                </div>
                <div className={`w-[140px] flex flex-col gap-6 border-l border-gray-100 pl-6 ${focusHours === 0 ? 'justify-center' : ''}`}>
                    <div className="flex flex-col">
                        {avgSpeed ? (
                            <>
                                <div className="flex items-baseline gap-1 mb-0.5">
                                    <span className="text-2xl font-bold text-gray-900 font-['Inter']">
                                        {avgSpeed.val}<span className="text-sm text-gray-500 ml-0.5">{avgSpeed.unit}</span>
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase ml-1 ${avgSpeed.fast ? 'text-green-600' : 'text-amber-500'}`}>
                                        {avgSpeed.fast ? t('stats.speed.fast') : t('stats.speed.slow')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                     {avgSpeed.fast ? <Zap className="w-3 h-3 text-yellow-500 fill-current" /> : <Clock className="w-3 h-3 text-gray-400" />}
                                     <span className="text-[10px] font-bold text-gray-400 uppercase">{t('stats.avg_speed')}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="text-xl font-bold text-gray-300">--</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{t('stats.avg_speed')}</span>
                            </>
                        )}
                    </div>
                    {focusHours > 0 && (
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-gray-700 font-['Inter']">
                                {displayFocusHours}
                            </span>
                             <span className="text-[10px] font-bold text-gray-400 uppercase">{t('stats.focus_hours')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Donut Chart Distribution */}
        {totalDist > 0 && (
            <div className="bg-white rounded-[24px] p-5 shadow-sm">
                 <h3 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    {t('stats.distribution')}
                </h3>
                
                <div className="flex items-center justify-between">
                    {/* Donut */}
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            {/* Background Ring */}
                            {totalDist === 0 && <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-100" strokeWidth="4" />}
                            
                            {/* Segments */}
                            {donutSegments.map((seg, i) => (
                                <circle 
                                    key={i}
                                    cx="18" cy="18" r="16" 
                                    fill="none" 
                                    className={`${seg.color} transition-all duration-1000 ease-out`}
                                    strokeWidth="4"
                                    strokeDasharray={seg.strokeDasharray}
                                    strokeDashoffset={seg.strokeDashoffset}
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                />
                            ))}
                        </svg>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black text-gray-900 leading-none">{totalDist}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Total</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col gap-2 min-w-[120px]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                <span className="text-xs font-bold text-gray-600">Q1</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">{Math.round((distribution.q1 / totalDist) * 100)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-xs font-bold text-gray-600">Q2</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">{Math.round((distribution.q2 / totalDist) * 100)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                <span className="text-xs font-bold text-gray-600">Q3</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">{Math.round((distribution.q3 / totalDist) * 100)}%</span>
                        </div>
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                <span className="text-xs font-bold text-gray-600">Q4</span>
                            </div>
                            <span className="text-xs font-bold text-gray-900">{Math.round((distribution.q4 / totalDist) * 100)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Minimalist Trend Chart */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                {t('stats.trend')}
            </h3>
            <div className="flex justify-between items-end h-[60px] px-2">
                {trendData.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group w-full">
                        <div className="relative w-2 bg-gray-100 rounded-full h-[40px] flex items-end overflow-hidden">
                             <div 
                                className={`w-full rounded-full transition-all duration-500 ${day.dateObj.getDay() === new Date().getDay() ? 'bg-black' : 'bg-indigo-500'}`}
                                style={{ height: `${day.heightPercent}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                             ></div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase ${day.dateObj.getDay() === new Date().getDay() ? 'text-black' : 'text-gray-300'}`}>
                            {day.label.slice(0, 1)}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {/* Quote */}
        <div className="pt-4 px-4 pb-6">
            <p className="text-[12px] font-medium text-gray-400 leading-relaxed text-center">
                {t('stats.quote')}
            </p>
        </div>

      </div>
    </div>
  );
};
