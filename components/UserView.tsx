import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert, Download, ChevronRight, User, Trash2, Languages, Share, Download as InstallIcon, X } from 'lucide-react';

export const UserView: React.FC = () => {
  const { hardcoreMode, toggleHardcoreMode, tasks, clearAllTasks } = useTasks();
  const { language, setLanguage, t } = useLanguage();
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "focus_matrix_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleClearData = () => {
    if (window.confirm(t('user.clear.confirm'))) {
        clearAllTasks();
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F2F4F7] relative">
      <div className="px-6 pt-10 pb-8 shrink-0">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-lg ring-4 ring-white">
                <User className="w-8 h-8" />
            </div>
            <div>
                <h1 className="text-[24px] font-bold text-gray-900">{t('user.guest')}</h1>
                <span className="text-[13px] text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200 text-xs font-medium shadow-sm">
                    {t('user.tier')}
                </span>
            </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-4">
        
        {/* Language Toggle */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
            onClick={toggleLanguage}
        >
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl"><Languages className="w-5 h-5 text-indigo-500" /></div>
                    <h3 className="text-[15px] font-bold text-gray-900">{t('user.language')}</h3>
                </div>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md transition-all ${language === 'en' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>EN</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md transition-all ${language === 'zh' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>中</span>
                </div>
            </div>
        </div>

        {/* Hardcore Mode Toggle */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
            onClick={toggleHardcoreMode}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 rounded-xl"><ShieldAlert className="w-5 h-5 text-rose-500" /></div>
                    <h3 className="text-[15px] font-bold text-gray-900">{t('user.hardcore')}</h3>
                </div>
                {/* Switch */}
                <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${hardcoreMode ? 'bg-rose-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 left-0.5 transition-transform duration-200 ${hardcoreMode ? 'translate-x-5' : ''}`}></div>
                </div>
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed pl-[52px]">
                {t('user.hardcore.desc')}
            </p>
        </div>

        {/* Install / Add to Home Screen */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
            onClick={() => setShowInstallModal(true)}
        >
             <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-900 rounded-xl"><InstallIcon className="w-5 h-5 text-white" /></div>
                    <h3 className="text-[15px] font-bold text-gray-900">{t('user.install')}</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
             <p className="text-[12px] text-gray-500 leading-relaxed pl-[52px]">
                {t('user.install.desc')}
            </p>
        </div>

        {/* Export Data */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer group"
            onClick={handleExport}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl"><Download className="w-5 h-5 text-blue-500" /></div>
                <span className="text-[15px] font-bold text-gray-900">{t('user.export')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>

        {/* Clear Data */}
        <div 
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer group"
            onClick={handleClearData}
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-xl"><Trash2 className="w-5 h-5 text-red-500" /></div>
                <span className="text-[15px] font-bold text-red-600">{t('user.clear')}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-200 transition-colors" />
        </div>

        <div className="text-center mt-12 mb-8">
            <span className="text-[10px] text-gray-400 font-medium">{t('user.version')}</span>
        </div>
      </div>

        {/* Install Guide Modal */}
        {showInstallModal && (
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-4" onClick={() => setShowInstallModal(false)}>
                <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-slide-up sm:animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">{t('install.title')}</h3>
                        <button onClick={() => setShowInstallModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    
                    <div className="space-y-6">
                        {/* iOS Guide */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded">iOS</span>
                                <span className="text-xs font-semibold text-gray-400">Safari</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <Share className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span>{t('install.ios.step1')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <div className="w-5 h-5 flex items-center justify-center bg-gray-200 rounded text-gray-600 font-bold text-[10px]">+</div>
                                    <span>{t('install.ios.step2')}</span>
                                </div>
                            </div>
                        </div>

                         {/* Android Guide */}
                         <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded">Android</span>
                                <span className="text-xs font-semibold text-gray-400">Chrome</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <span className="font-bold text-lg leading-none text-gray-400">⋮</span>
                                    <span>{t('install.android.step1')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <InstallIcon className="w-4 h-4 text-gray-600 shrink-0" />
                                    <span>{t('install.android.step2')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowInstallModal(false)}
                        className="w-full mt-6 bg-black text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform"
                    >
                        {t('install.button.close')}
                    </button>
                </div>
            </div>
        )}

    </div>
  );
};