
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Settings, Zap, Clock, TrendingUp, Cloud, Languages, ShieldAlert, Trash2, X, Loader2, RefreshCw, BarChart3, CheckCircle2, Bot, AlertTriangle, Download, Smartphone, Share, MoreVertical, Flame, CalendarDays } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Habit } from '../types';

// --- Helper Functions ---
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

// --- Heatmap Component ---
const HabitHeatmap: React.FC<{ habit: Habit }> = ({ habit }) => {
    const { t, language } = useLanguage();
    const [tooltip, setTooltip] = useState<{ date: string, isCompleted: boolean, x: number, y: number } | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const { weeks, monthLabels } = useMemo(() => {
        const daysToShow = 91; // 13 weeks
        const result = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const monthLabels: { name: string, index: number }[] = [];
        let lastMonth = -1;

        for (let i = daysToShow - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const isCompleted = habit.completedDates.includes(dateStr);
            
            const month = d.getMonth();
            const weekIndex = Math.floor((daysToShow - 1 - i) / 7);
            const dayOfWeek = (daysToShow - 1 - i) % 7;

            // If it's a new month and at the start of a week column, add label
            if (month !== lastMonth && dayOfWeek === 0) {
                monthLabels.push({
                    name: d.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short' }),
                    index: weekIndex
                });
                lastMonth = month;
            }

            result.push({ date: dateStr, isCompleted, dObj: d });
        }
        
        const weeks = [];
        for (let i = 0; i < result.length; i += 7) {
            weeks.push(result.slice(i, i + 7));
        }
        return { weeks, monthLabels };
    }, [habit.completedDates, language]);

    const handleCellClick = (e: React.MouseEvent, date: string, isCompleted: boolean) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const containerRect = scrollContainerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        
        // Toggle tooltip if same cell clicked
        if (tooltip && tooltip.date === date) {
            setTooltip(null);
        } else {
            setTooltip({
                date,
                isCompleted,
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top - 8
            });
        }
    };

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${habit.color}`}></div>
                    <span className="text-sm font-bold text-gray-800">{habit.title}</span>
                </div>
                {habit.streak > 0 && (
                    <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                        <Flame className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-black">{habit.streak}</span>
                    </div>
                )}
            </div>
            
            <div className="relative">
                <div 
                    ref={scrollContainerRef}
                    className="overflow-x-auto no-scrollbar pb-1 relative"
                    onClick={() => setTooltip(null)}
                >
                    {/* Month Labels */}
                    <div className="flex h-5 mb-1 relative min-w-max">
                        {monthLabels.map((label, i) => (
                            <span 
                                key={i} 
                                className="absolute text-[9px] font-bold text-gray-300 uppercase tracking-tighter"
                                style={{ left: `${label.index * 13}px` }}
                            >
                                {label.name}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-[3px] min-w-max relative">
                        {weeks.map((week, wIdx) => (
                            <div key={wIdx} className="flex flex-col gap-[3px]">
                                {week.map((day) => (
                                    <div 
                                        key={day.date}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCellClick(e, day.date, day.isCompleted);
                                        }}
                                        className={`w-[10px] h-[10px] rounded-[2px] transition-all duration-300 cursor-pointer hover:ring-1 hover:ring-gray-300 ${
                                            day.isCompleted 
                                                ? `${habit.color} shadow-[0_0_4px_rgba(0,0,0,0.05)]` 
                                                : 'bg-gray-100'
                                        }`}
                                    />
                                ))}
                            </div>
                        ))}

                        {/* Tooltip Popup */}
                        {tooltip && (
                            <div 
                                className="absolute z-20 pointer-events-none transition-all duration-200"
                                style={{ 
                                    left: `${tooltip.x}px`, 
                                    top: `${tooltip.y}px`,
                                    transform: 'translate(-50%, -100%)' 
                                }}
                            >
                                <div className="bg-gray-900/90 backdrop-blur-md text-white px-2 py-1.5 rounded-lg shadow-xl flex flex-col items-center min-w-[80px]">
                                    <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">{tooltip.date}</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${tooltip.isCompleted ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                                        <span className="text-[10px] font-black whitespace-nowrap">
                                            {tooltip.isCompleted ? (language === 'zh' ? '已达成' : 'Achieved') : (language === 'zh' ? '未达成' : 'Missed')}
                                        </span>
                                    </div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Empty State Overlay */}
                    {habit.completedDates.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-5">
                            <div className="bg-white/90 backdrop-blur-sm border border-gray-100 px-3 py-1.5 rounded-full shadow-sm animate-pulse">
                                <span className="text-[10px] font-bold text-gray-400 italic">
                                    {language === 'zh' ? '✨ 开始你的第一天' : '✨ Start your first day'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Install Guide Modal ---
const InstallGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLanguage();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    return (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl slide-up space-y-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">{t('user.install')}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-50 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                
                <div className="space-y-6">
                    <p className="text-sm text-gray-500 leading-relaxed">
                        {t('user.install.desc')}
                    </p>

                    {isIOS ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                    <Share className="w-4 h-4 text-indigo-600" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">{t('install.ios.step1')}</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600 font-bold text-xs">
                                    +
                                </div>
                                <p className="text-sm font-medium text-gray-700">{t('install.ios.step2')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                    <MoreVertical className="w-4 h-4 text-indigo-600" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">{t('install.android.step1')}</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                    <Download className="w-4 h-4 text-indigo-600" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">{t('install.android.step2')}</p>
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={onClose}
                    className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl transition-transform active:scale-95"
                >
                    {t('install.button.close')}
                </button>
            </div>
        </div>
    );
};

// --- Settings Modal Component ---
const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { hardcoreMode, toggleHardcoreMode, clearAllTasks, tasks, habits, restoreTasks, aiMode, setAiMode, isApiKeyMissing } = useTasks();
    const { language, setLanguage, t } = useLanguage();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
        return () => subscription.unsubscribe();
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');
        const email = `${phone}@focus.app`;
        try {
            if (isLoginMode) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
            }
            setShowAuth(false);
        } catch (err: any) {
            setAuthError(err.message || t('auth.error'));
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSync = async (restoreMode = false) => {
        if (!user) { setShowAuth(true); return; }
        setSyncing(true);
        try {
            if (restoreMode) {
                const { data, error } = await supabase.from('backups').select('data').eq('user_id', user.id).single();
                if (error && error.code !== 'PGRST116') throw error;
                if (data && data.data) {
                    restoreTasks(data.data);
                    alert(t('cloud.restore_success'));
                }
            } else {
                const { error } = await supabase.from('backups').upsert({
                    user_id: user.id,
                    data: { tasks, habits }, 
                    updated_at: new Date().toISOString()
                });
                if (error) throw error;
                alert(t('cloud.upload_success'));
            }
        } catch (err: any) {
            alert("Sync Failed: " + err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    if (showAuth) {
        return (
            <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl slide-up">
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-900">{isLoginMode ? t('auth.login') : t('auth.signup')}</h3>
                        <button onClick={() => setShowAuth(false)} className="p-2 bg-gray-50 rounded-full"><X className="w-6 h-6 text-gray-400" /></button>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('auth.placeholder.phone')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none" required />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth.placeholder.pass')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none" required minLength={6} />
                        {authError && <div className="text-red-500 text-xs">{authError}</div>}
                        <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">{authLoading && <Loader2 className="w-5 h-5 animate-spin" />}{isLoginMode ? t('auth.login') : t('auth.signup')}</button>
                    </form>
                    <div className="mt-4 text-center"><button onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm font-semibold text-gray-500">{isLoginMode ? t('auth.switch.signup') : t('auth.switch.login')}</button></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[110] bg-black/10 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl slide-up h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">{t('profile.settings')}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="space-y-4">
                     {/* Cloud Sync */}
                     <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Cloud className="w-5 h-5 text-indigo-500" />
                            <span className="font-bold text-gray-900">{t('cloud.title')}</span>
                            {user && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Pro</span>}
                        </div>
                        {user ? (
                             <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleSync(false)} disabled={syncing} className="bg-white py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1">{syncing ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>} Backup</button>
                                <button onClick={() => handleSync(true)} disabled={syncing} className="bg-white py-2 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1">Restore</button>
                                <button onClick={handleLogout} className="col-span-2 text-red-500 text-xs font-bold py-2">Log Out</button>
                             </div>
                        ) : (
                            <button onClick={() => setShowAuth(true)} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200">Login to Sync</button>
                        )}
                    </div>

                    {/* AI Config Section */}
                    <div className="bg-white border border-gray-100 p-4 rounded-2xl space-y-4">
                         {/* Toggle */}
                         <div onClick={() => setAiMode(!aiMode)} className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Bot className="w-5 h-5 text-purple-600" />
                                <div>
                                    <span className="font-bold text-gray-700 block flex items-center gap-2">
                                        {t('user.ai')}
                                    </span>
                                    <span className={`text-[10px] font-medium ${isApiKeyMissing ? 'text-orange-500' : 'text-gray-400'}`}>
                                        {isApiKeyMissing ? 'API Key Missing' : t('user.ai.desc')}
                                    </span>
                                </div>
                            </div>
                            <div className={`w-10 h-6 rounded-full relative transition-colors ${aiMode ? 'bg-purple-600' : 'bg-gray-200'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform ${aiMode ? 'translate-x-4' : ''}`}></div></div>
                        </div>
                    </div>

                    {/* Install App Button */}
                    <div 
                        onClick={() => setShowInstallGuide(true)} 
                        className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl active:bg-gray-50 cursor-pointer group"
                    >
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-gray-500 group-hover:text-black transition-colors" />
                            <span className="font-bold text-gray-700 group-hover:text-black transition-colors">{t('user.install')}</span>
                        </div>
                        <Download className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors" />
                    </div>

                    {/* Language */}
                    <div onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl active:bg-gray-50 cursor-pointer">
                        <div className="flex items-center gap-3"><Languages className="w-5 h-5 text-gray-500" /><span className="font-bold text-gray-700">{t('user.language')}</span></div>
                        <span className="font-bold text-gray-900">{language === 'en' ? 'English' : '中文'}</span>
                    </div>

                    {/* Hardcore */}
                    <div onClick={toggleHardcoreMode} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl active:bg-gray-50 cursor-pointer">
                        <div className="flex items-center gap-3"><ShieldAlert className="w-5 h-5 text-rose-500" /><span className="font-bold text-gray-700">{t('user.hardcore')}</span></div>
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${hardcoreMode ? 'bg-rose-500' : 'bg-gray-200'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform ${hardcoreMode ? 'translate-x-4' : ''}`}></div></div>
                    </div>

                    {/* Clear Data */}
                    <div onClick={() => { if(window.confirm(t('user.clear.confirm'))) clearAllTasks(); }} className="flex items-center gap-3 bg-white border border-gray-100 p-4 rounded-2xl active:bg-red-50 text-red-500 cursor-pointer">
                        <Trash2 className="w-5 h-5" /><span className="font-bold">{t('user.clear')}</span>
                    </div>
                    
                    <div className="text-center text-xs text-gray-300 pt-4">{t('user.version')}</div>
                </div>

                {/* Conditional Sub-modals */}
                {showInstallGuide && <InstallGuide onClose={() => setShowInstallGuide(false)} />}
            </div>
        </div>
    );
};

export const ProfileView: React.FC = () => {
  const { tasks, habits } = useTasks();
  const { t, language, setLanguage } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
      // Initial fetch
      supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));

      // Real-time listener for Auth changes (Login/Logout)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
      });

      return () => {
          subscription.unsubscribe();
      };
  }, []);

  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);

  // --- Statistics Calculation ---

  // 1. Last 7 Days Range
  const last7DaysTasks = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    return completedTasks.filter(t => (t.completedAt || t.createdAt) >= sevenDaysAgo.getTime());
  }, [completedTasks]);

  // 2. Velocity
  const velocity = last7DaysTasks.length;

  // 3. Focus Hours
  const focusHours = useMemo(() => last7DaysTasks.reduce((acc, t) => acc + parseDuration(t.duration), 0), [last7DaysTasks]);
  const displayFocusHours = focusHours < 1 ? `${Math.round(focusHours * 60)}m` : `${focusHours.toFixed(1)}h`;
  
  // 4. Distribution (Donut Data)
  const distribution = useMemo(() => {
    const counts = { q1: 0, q2: 0, q3: 0, q4: 0 };
    last7DaysTasks.forEach(t => { if (counts[t.category as keyof typeof counts] !== undefined) counts[t.category as keyof typeof counts]++; });
    return counts;
  }, [last7DaysTasks]);
  const totalDist = distribution.q1 + distribution.q2 + distribution.q3 + distribution.q4;

  const donutSegments = useMemo(() => {
      if (totalDist === 0) return [{ color: 'text-gray-100', offset: 0, percent: 100 }];
      const radius = 16;
      const circumference = 2 * Math.PI * radius; 
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
          const segment = { ...item, strokeDasharray: `${strokeLength} ${circumference}`, strokeDashoffset: -currentOffset, percent };
          currentOffset += strokeLength;
          return segment;
      });
  }, [distribution, totalDist]);

  // 5. Weekly Trend (Bar Chart Data)
  const weeklyTrend = useMemo(() => {
      const days = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dayStr = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W
          const dateKey = d.toISOString().split('T')[0];
          // Count completed on this day
          const count = completedTasks.filter(t => {
              if (!t.completedAt) return false;
              const tDate = new Date(t.completedAt).toISOString().split('T')[0];
              return tDate === dateKey;
          }).length;
          days.push({ day: dayStr, count });
      }
      return days;
  }, [completedTasks]);

  const maxDaily = Math.max(...weeklyTrend.map(d => d.count), 1);

  // 6. Completion Rate
  const completionRate = useMemo(() => {
      const total = tasks.length;
      if (total === 0) return 0;
      return Math.round((tasks.filter(t => t.completed).length / total) * 100);
  }, [tasks]);

  // 7. Best Day
  const bestDay = useMemo(() => {
      if (completedTasks.length === 0) return '-';
      const daysMap: Record<string, number> = {};
      completedTasks.forEach(t => {
          if (!t.completedAt) return;
          const dayName = new Date(t.completedAt).toLocaleDateString('en-US', { weekday: 'short' });
          daysMap[dayName] = (daysMap[dayName] || 0) + 1;
      });
      return Object.entries(daysMap).sort((a,b) => b[1] - a[1])[0]?.[0] || '-';
  }, [completedTasks]);

  const displayPhone = user?.email?.split('@')[0].replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || t('user.guest');

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F4F7] relative">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-lg border-4 border-white">
                <User className="w-6 h-6" />
             </div>
             <div>
                 <h1 className="text-xl font-bold text-gray-900">{displayPhone}</h1>
                 <span className="text-[11px] px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100 font-bold">{user ? 'Pro' : t('user.tier')}</span>
             </div>
        </div>
        
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} 
                className="p-3 bg-white rounded-full shadow-sm text-gray-600 active:scale-95 transition-transform"
                title="Switch Language"
             >
                <Languages className="w-5 h-5" />
             </button>
             <button onClick={() => setShowSettings(true)} className="p-3 bg-white rounded-full shadow-sm text-gray-600 active:scale-95 transition-transform">
                <Settings className="w-5 h-5" />
             </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-4 pb-32">
        
        {/* Main Stats Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm relative overflow-hidden">
             <div className="flex gap-6">
                <div className="flex-1">
                    <span className="text-4xl font-black text-gray-900 font-['Inter']">{velocity}</span>
                    <p className="text-xs font-bold text-gray-400 uppercase mt-1">{t('stats.tasks_completed')}</p>
                </div>
                <div className="w-[1px] bg-gray-100"></div>
                <div className="flex-1">
                     <span className="text-4xl font-black text-gray-900 font-['Inter']">{displayFocusHours}</span>
                     <p className="text-xs font-bold text-gray-400 uppercase mt-1">{t('stats.focus_hours')}</p>
                </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-sm font-bold text-gray-700">{completionRate}%</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Rate</span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-sm font-bold text-gray-700">{bestDay}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Best Day</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Weekly Trend Bar Chart */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                {t('stats.trend')}
            </h3>
            <div className="flex items-end justify-between h-24 gap-2">
                {weeklyTrend.map((d, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                        <div 
                            className="w-full bg-gray-100 rounded-md relative transition-all duration-500 group-hover:bg-indigo-100"
                            style={{ height: `${Math.max((d.count / maxDaily) * 100, 5)}%` }}
                        >
                            {d.count > 0 && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {d.count}
                                </div>
                            )}
                            <div className={`absolute inset-0 bg-indigo-500 rounded-md opacity-0 transition-opacity ${d.count > 0 ? 'group-hover:opacity-20' : ''}`}></div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-300">{d.day}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Distribution Card */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm flex items-center justify-between">
            <div>
                 <h3 className="text-[13px] font-bold text-gray-900 mb-2">{t('stats.distribution')}</h3>
                 <div className="space-y-1">
                     <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-xs text-gray-500 font-medium">Q1: {Math.round(totalDist ? (distribution.q1/totalDist)*100 : 0)}%</span></div>
                     <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-xs text-gray-500 font-medium">Q2: {Math.round(totalDist ? (distribution.q2/totalDist)*100 : 0)}%</span></div>
                 </div>
            </div>
            <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {totalDist === 0 && <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-100" strokeWidth="4" />}
                    {donutSegments.map((seg, i) => (
                        <circle key={i} cx="18" cy="18" r="16" fill="none" className={`${seg.color} transition-all duration-1000 ease-out`} strokeWidth="4" strokeDasharray={seg.strokeDasharray} strokeDashoffset={seg.strokeDashoffset} stroke="currentColor" strokeLinecap="round" />
                    ))}
                </svg>
            </div>
        </div>

        {/* Habit Consistency Heatmaps */}
        {habits.length > 0 && (
            <div className="space-y-3">
                <h3 className="text-[13px] font-bold text-gray-900 ml-1 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-gray-500" />
                    {t('stats.habit_consistency')}
                </h3>
                {habits.map(habit => (
                    <HabitHeatmap key={habit.id} habit={habit} />
                ))}
            </div>
        )}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};
