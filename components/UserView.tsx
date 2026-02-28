
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Settings, Zap, Clock, TrendingUp, Cloud, Languages, ShieldAlert, Trash2, X, Loader2, RefreshCw, BarChart3, CheckCircle2, Bot, AlertTriangle, Download, Smartphone, Share, MoreVertical, Flame, CalendarDays, ChevronRight, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Habit, Task } from '../types';

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

const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const HabitHeatmap: React.FC<{ habit: Habit }> = ({ habit }) => {
    const { t, language } = useLanguage();
    const [tooltip, setTooltip] = useState<{ date: string, isCompleted: boolean, x: number, y: number } | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    const { weeks, monthLabels } = useMemo(() => {
        const daysToShow = 168; 
        const result = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthLabels: { name: string, index: number }[] = [];
        let lastMonth = -1;
        for (let i = daysToShow - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = getLocalDateStr(d);
            const isCompleted = habit.completedDates.includes(dateStr);
            const month = d.getMonth();
            const weekIndex = Math.floor((daysToShow - 1 - i) / 7);
            const dayOfWeek = (daysToShow - 1 - i) % 7;
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
        for (let i = 0; i < result.length; i += 7) { weeks.push(result.slice(i, i + 7)); }
        return { weeks, monthLabels };
    }, [habit.completedDates, language]);

    const handleCellClick = (e: React.MouseEvent, date: string, isCompleted: boolean) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const containerRect = scrollContainerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        if (tooltip && tooltip.date === date) { setTooltip(null); } 
        else {
            setTooltip({ date, isCompleted, x: rect.left - containerRect.left + rect.width / 2, y: rect.top - containerRect.top - 8 });
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
                <div ref={scrollContainerRef} className="overflow-x-auto no-scrollbar pb-1 relative" onClick={() => setTooltip(null)}>
                    <div className="flex h-5 mb-1 relative min-w-max">
                        {monthLabels.map((label, i) => (
                            <span key={i} className="absolute text-[9px] font-bold text-gray-300 uppercase tracking-tighter" style={{ left: `${label.index * 13}px` }}>{label.name}</span>
                        ))}
                    </div>
                    <div className="flex gap-[3px] min-w-max relative">
                        {weeks.map((week, wIdx) => (
                            <div key={wIdx} className="flex flex-col gap-[3px]">
                                {week.map((day) => (
                                    <div 
                                        key={day.date}
                                        onClick={(e) => { e.stopPropagation(); handleCellClick(e, day.date, day.isCompleted); }}
                                        className={`w-[10px] h-[10px] rounded-[2px] transition-all duration-300 cursor-pointer hover:ring-1 hover:ring-gray-300 ${day.isCompleted ? `${habit.color} shadow-[0_0_4px_rgba(0,0,0,0.05)]` : 'bg-gray-100'}`}
                                    />
                                ))}
                            </div>
                        ))}
                        {tooltip && (
                            <div className="absolute z-20 pointer-events-none transition-all duration-200" style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px`, transform: 'translate(-50%, -100%)' }}>
                                <div className="bg-gray-900/90 backdrop-blur-md text-white px-2 py-1.5 rounded-lg shadow-xl flex flex-col items-center min-w-[80px]">
                                    <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">{tooltip.date}</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${tooltip.isCompleted ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                                        <span className="text-[10px] font-black whitespace-nowrap">{tooltip.isCompleted ? t('stats.habit.heatmap.achieved') : t('stats.habit.heatmap.missed')}</span>
                                    </div>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900/90 rotate-45"></div>
                                </div>
                            </div>
                        )}
                    </div>
                    {habit.completedDates.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-5">
                            <div className="bg-white/90 backdrop-blur-sm border border-gray-100 px-3 py-1.5 rounded-full shadow-sm animate-pulse">
                                <span className="text-[10px] font-bold text-gray-400 italic">{t('stats.habit.heatmap.start')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InstallGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useLanguage();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    return (
        <div className="fixed inset-0 z-[130] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
            <div className="bg-white w-full max-w-[320px] rounded-[32px] p-6 shadow-2xl animate-fade-in space-y-5" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">{t('user.install')}</h3>
                    <button onClick={onClose} className="p-1.5 bg-gray-50 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                <div className="space-y-5">
                    <p className="text-sm text-gray-500 leading-relaxed">{t('user.install.desc')}</p>
                    {isIOS ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0"><Share className="w-4 h-4 text-indigo-600" /></div><p className="text-xs font-bold text-gray-700">{t('install.ios.step1')}</p></div>
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600 font-bold text-xs">+</div><p className="text-xs font-bold text-gray-700">{t('install.ios.step2')}</p></div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0"><MoreVertical className="w-4 h-4 text-indigo-600" /></div><p className="text-xs font-bold text-gray-700">{t('install.android.step1')}</p></div>
                            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0"><Download className="w-4 h-4 text-indigo-600" /></div><p className="text-xs font-bold text-gray-700">{t('install.android.step2')}</p></div>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl transition-transform active:scale-95 text-sm">{t('install.button.close')}</button>
            </div>
        </div>
    );
};

const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // 1. Get automated sync status from Context
    const { hardcoreMode, toggleHardcoreMode, clearAllTasks, aiMode, setAiMode, isApiKeyMissing, syncStatus, syncData } = useTasks();
    const { language, setLanguage, t } = useLanguage();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [showAuth, setShowAuth] = useState(false);
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser?.user_metadata?.display_name) {
                setNewName(currentUser.user_metadata.display_name);
            }
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser?.user_metadata?.display_name) {
                setNewName(currentUser.user_metadata.display_name);
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleUpdateName = async () => {
        if (!newName.trim()) return;
        setAuthLoading(true);
        try {
            const { data, error } = await supabase.auth.updateUser({
                data: { display_name: newName.trim() }
            });
            if (error) throw error;
            setUser(data.user);
            setIsEditingName(false);
        } catch (err: any) {
            setAuthError(err.message || t('auth.error'));
        } finally {
            setAuthLoading(false);
        }
    };

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
        } catch (err: any) { setAuthError(err.message || t('auth.error')); } finally { setAuthLoading(false); }
    };

    if (showAuth) {
        return (
            <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-white w-full max-w-[320px] rounded-[32px] p-6 shadow-2xl animate-fade-in">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">{isLoginMode ? t('auth.login') : t('auth.signup')}</h3>
                        <button onClick={() => setShowAuth(false)} className="p-1.5 bg-gray-50 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
                    </div>
                    <form onSubmit={handleAuth} className="space-y-3">
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('auth.placeholder.phone')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none text-sm font-medium" required />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth.placeholder.pass')} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 outline-none text-sm font-medium" required minLength={6} />
                        {authError && <div className="text-red-500 text-[10px]">{authError}</div>}
                        <button type="submit" disabled={authLoading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">{authLoading && <Loader2 className="w-4 h-4 animate-spin" />}{isLoginMode ? t('auth.login') : t('auth.signup')}</button>
                    </form>
                    <div className="mt-4 text-center"><button onClick={() => setIsLoginMode(!isLoginMode)} className="text-xs font-semibold text-gray-400 hover:text-gray-600">{isLoginMode ? t('auth.switch.signup') : t('auth.switch.login')}</button></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-[340px] rounded-[32px] p-5 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-5 px-1">
                    <h3 className="text-lg font-bold text-gray-900">{t('profile.settings')}</h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 active:scale-90 transition-transform">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-3">
                     {/* Cloud Card - Automated Sync UI */}
                     <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-100/50">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                    <Cloud className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-gray-900 block leading-tight">{t('cloud.title')}</span>
                                    <span className="text-[10px] text-gray-400">
                                        {user ? (user.user_metadata?.display_name || user.email?.split('@')[0]) : t('user.guest')}
                                    </span>
                                </div>
                            </div>
                            {user && <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Pro</span>}
                        </div>
                        
                        {user ? (
                             <div className="grid grid-cols-1 gap-2">
                                {isEditingName ? (
                                    <div className="flex flex-col gap-2 mb-2">
                                        <input 
                                            type="text" 
                                            value={newName} 
                                            onChange={e => setNewName(e.target.value)} 
                                            placeholder={t('user.edit_name')}
                                            className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 outline-none text-xs font-medium"
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleUpdateName}
                                                disabled={authLoading}
                                                className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-bold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                                            >
                                                {authLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                                                {t('user.save_name')}
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setIsEditingName(false);
                                                    setNewName(user.user_metadata?.display_name || user.email?.split('@')[0] || '');
                                                }}
                                                className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-[10px] font-bold active:scale-[0.98] transition-all"
                                            >
                                                {t('user.cancel')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsEditingName(true)}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 text-left px-1 mb-1"
                                    >
                                        {t('user.edit_name')}
                                    </button>
                                )}

                                {/* Automated Sync Status Indicator / Force Sync Button */}
                                <button 
                                    onClick={() => syncData()} 
                                    disabled={syncStatus === 'syncing'}
                                    className={`bg-white py-2 rounded-xl text-[10px] font-bold shadow-sm border border-gray-100 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all ${
                                        syncStatus === 'error' ? 'text-red-500 border-red-100' : 'text-gray-700'
                                    }`}
                                >
                                    {syncStatus === 'syncing' ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500"/>
                                    ) : syncStatus === 'saved' ? (
                                        <Check className="w-3.5 h-3.5 text-green-500"/>
                                    ) : syncStatus === 'error' ? (
                                        <AlertTriangle className="w-3.5 h-3.5"/>
                                    ) : (
                                        <Cloud className="w-3.5 h-3.5 text-gray-400"/>
                                    )}
                                    
                                    {syncStatus === 'syncing' ? t('cloud.syncing') : 
                                     syncStatus === 'saved' ? t('cloud.upload_success') : 
                                     syncStatus === 'error' ? "Sync Error (Tap to Retry)" :
                                     t('cloud.sync')}
                                </button>
                                
                                <button onClick={async () => { await supabase.auth.signOut(); setUser(null); }} className="text-red-400 hover:text-red-500 text-[10px] font-bold py-1.5 mt-1">Log Out</button>
                             </div>
                        ) : ( 
                            <button onClick={() => setShowAuth(true)} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 active:scale-[0.98] transition-transform">
                                Login to Sync
                            </button> 
                        )}
                    </div>
                    
                    {/* Settings List */}
                    <div className="space-y-1">
                        {/* AI Mode */}
                        <div onClick={() => setAiMode(!aiMode)} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform"><Bot className="w-4 h-4" /></div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-700 leading-tight">{t('user.ai')}</span>
                                    <span className={`text-[9px] font-medium leading-tight ${isApiKeyMissing ? 'text-orange-500' : 'text-gray-400'}`}>
                                        {isApiKeyMissing ? 'Missing API Key' : 'Auto-classify'}
                                    </span>
                                </div>
                            </div>
                            <div className={`w-9 h-5 rounded-full relative transition-colors ${aiMode ? 'bg-purple-600' : 'bg-gray-200'}`}>
                                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform shadow-sm ${aiMode ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </div>

                        {/* Install App */}
                        <div onClick={() => setShowInstallGuide(true)} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:scale-110 transition-transform"><Smartphone className="w-4 h-4" /></div>
                                <span className="text-sm font-bold text-gray-700">{t('user.install')}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>

                        {/* Language */}
                        <div onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors group">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><Languages className="w-4 h-4" /></div>
                                <span className="text-sm font-bold text-gray-700">{t('user.language')}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{language === 'en' ? 'EN' : '中'}</span>
                        </div>

                        {/* Hardcore Mode */}
                        <div onClick={toggleHardcoreMode} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform"><ShieldAlert className="w-4 h-4" /></div>
                                <span className="text-sm font-bold text-gray-700">{t('user.hardcore')}</span>
                            </div>
                             <div className={`w-9 h-5 rounded-full relative transition-colors ${hardcoreMode ? 'bg-rose-500' : 'bg-gray-200'}`}>
                                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform shadow-sm ${hardcoreMode ? 'translate-x-4' : ''}`}></div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div onClick={() => { if(window.confirm(t('user.clear.confirm'))) clearAllTasks(); }} className="mt-4 p-3 rounded-2xl flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 active:bg-red-100 cursor-pointer transition-colors">
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs font-bold">{t('user.clear')}</span>
                    </div>

                    <div className="text-center">
                        <span className="text-[10px] text-gray-300 font-mono tracking-widest uppercase">{t('user.version')}</span>
                    </div>
                </div>
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
      supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
      return () => subscription.unsubscribe();
  }, []);

  const completedTasks = useMemo(() => tasks.filter(t => t.completed), [tasks]);
  const last7DaysTasks = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    return completedTasks.filter(t => (t.completedAt || t.createdAt) >= sevenDaysAgo.getTime());
  }, [completedTasks]);

  const focusHours = useMemo(() => last7DaysTasks.reduce((acc, t) => acc + parseDuration(t.duration), 0), [last7DaysTasks]);
  const displayFocusHours = focusHours < 1 ? `${Math.round(focusHours * 60)}m` : `${focusHours.toFixed(1)}h`;
  
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
      const items = [{ id: 'q1', val: distribution.q1, color: 'text-rose-500' }, { id: 'q2', val: distribution.q2, color: 'text-blue-500' }, { id: 'q3', val: distribution.q3, color: 'text-amber-400' }, { id: 'q4', val: distribution.q4, color: 'text-slate-300' }];
      return items.filter(i => i.val > 0).map(item => {
          const percent = (item.val / totalDist) * 100;
          const strokeLength = (percent / 100) * circumference;
          const segment = { ...item, strokeDasharray: `${strokeLength} ${circumference}`, strokeDashoffset: -currentOffset, percent };
          currentOffset += strokeLength;
          return segment;
      });
  }, [distribution, totalDist]);

  const weeklyTrend = useMemo(() => {
      const days = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          const dayStr = d.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { weekday: 'narrow' });
          const dateKey = getLocalDateStr(d);
          const count = completedTasks.filter(t => t.completedAt && getLocalDateStr(new Date(t.completedAt)) === dateKey).length;
          days.push({ day: dayStr, count });
      }
      return days;
  }, [completedTasks, language]);

  const maxDaily = Math.max(...weeklyTrend.map(d => d.count), 1);
  const completionRate = tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);
  const displayPhone = user?.user_metadata?.display_name || user?.email?.split('@')[0].replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || t('user.guest');

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F4F7] relative">
      <div 
        className="px-6 pb-6 shrink-0 flex items-center justify-between"
        // Reduced to 20px
        style={{ paddingTop: 'calc(20px + env(safe-area-inset-top) + var(--sa-top, 0px))' }}
      >
        <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-lg border-4 border-white"><User className="w-6 h-6" /></div>
             <div><h1 className="text-xl font-bold text-gray-900">{displayPhone}</h1><span className="text-[11px] px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100 font-bold">{user ? 'Pro' : t('user.tier')}</span></div>
        </div>
        <div className="flex items-center gap-3">
             <button onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className="p-3 bg-white rounded-full shadow-sm text-gray-600 active:scale-95 transition-transform"><Languages className="w-5 h-5" /></button>
             <button onClick={() => setShowSettings(true)} className="p-3 bg-white rounded-full shadow-sm text-gray-600 active:scale-95 transition-transform"><Settings className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-4 pb-32">
        <div className="bg-white rounded-[24px] p-6 shadow-sm relative overflow-hidden">
             <div className="flex gap-6">
                <div className="flex-1"><span className="text-4xl font-black text-gray-900 font-['Inter']">{last7DaysTasks.length}</span><p className="text-xs font-bold text-gray-400 uppercase mt-1">{t('stats.tasks_completed')}</p></div>
                <div className="w-[1px] bg-gray-100"></div>
                <div className="flex-1"><span className="text-4xl font-black text-gray-900 font-['Inter']">{displayFocusHours}</span><p className="text-xs font-bold text-gray-400 uppercase mt-1">{t('stats.focus_hours')}</p></div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /><span className="text-sm font-bold text-gray-700">{completionRate}%</span><span className="text-[10px] text-gray-400 uppercase font-bold">Rate</span></div>
                </div>
            </div>
        </div>
        <div className="bg-white rounded-[24px] p-5 shadow-sm">
            <h3 className="text-[13px] font-bold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-gray-500" />{t('stats.trend')}</h3>
            <div className="flex items-end justify-between h-24 gap-2">
                {weeklyTrend.map((d, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                        <div className="w-full bg-gray-100 rounded-md relative transition-all duration-500 group-hover:bg-indigo-100" style={{ height: `${Math.max((d.count / maxDaily) * 100, 5)}%` }}>{d.count > 0 && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</div>}</div>
                        <span className="text-[10px] font-bold text-gray-300">{d.day}</span>
                    </div>
                ))}
            </div>
        </div>
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
        {habits.length > 0 && (
            <div className="space-y-3">
                <h3 className="text-[13px] font-bold text-gray-900 ml-1 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-gray-500" />{t('stats.habit_consistency')}</h3>
                {habits.map(habit => ( <HabitHeatmap key={habit.id} habit={habit} /> ))}
            </div>
        )}
      </div>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};
