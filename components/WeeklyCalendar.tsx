import React, { useState, useRef, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';

export const WeeklyCalendar: React.FC = () => {
  const { selectedDate, setSelectedDate } = useTasks();
  const { language } = useLanguage();
  
  // State for the Monday of the currently displayed week
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  });

  const calendarRef = useRef<HTMLDivElement>(null);

  // Generate 7 days for current week view
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];
  const isSelected = (date: Date) => formatDateKey(date) === selectedDate;
  const isToday = (date: Date) => formatDateKey(date) === formatDateKey(new Date());

  const changeWeek = (direction: 'prev' | 'next') => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() + (direction === 'next' ? 7 : -7));
    setWeekStart(newStart);
  };

  // Swipe Logic
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX.current;

    if (Math.abs(diff) > 50) {
        changeWeek(diff > 0 ? 'prev' : 'next');
    }
  };

  const weekTitle = weekStart.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white pb-4 pt-2 px-2 select-none">
        <div className="flex justify-between items-center mb-4 px-4">
             <h2 className="text-sm font-bold text-gray-900">{weekTitle}</h2>
        </div>
        
        <div 
            ref={calendarRef}
            className="flex justify-between items-center px-2 touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {days.map((date, index) => {
                const selected = isSelected(date);
                const today = isToday(date);
                const dayName = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'narrow' });
                const dayNum = date.getDate();

                return (
                    <div 
                        key={index} 
                        onClick={() => setSelectedDate(formatDateKey(date))}
                        className={`flex flex-col items-center justify-center w-10 h-14 rounded-2xl transition-all cursor-pointer relative ${
                            selected 
                                ? 'bg-black text-white shadow-md scale-110' 
                                : 'text-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        <span className={`text-[10px] font-medium mb-0.5 ${selected ? 'text-gray-300' : ''}`}>{dayName}</span>
                        <span className={`text-[16px] font-bold ${today && !selected ? 'text-blue-600' : ''}`}>{dayNum}</span>
                        
                        {/* Dot for today if not selected */}
                        {today && !selected && (
                            <div className="absolute bottom-1.5 w-1 h-1 bg-blue-600 rounded-full"></div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
};