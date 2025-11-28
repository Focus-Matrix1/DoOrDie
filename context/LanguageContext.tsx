import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Matrix View
    'matrix.title': 'Focus Matrix',
    'matrix.inbox': 'Inbox',
    'matrix.empty': 'Empty',
    'matrix.inbox.hint': 'Hold & Drag to Matrix',
    'matrix.inbox.zero': 'Inbox Zero 🎉',
    'q1.title': 'Do First',
    'q2.title': 'Schedule',
    'q3.title': 'Delegate',
    'q4.title': 'Eliminate',
    
    // List View
    'list.title': 'Active Tasks',
    'list.hint.hardcore': 'Hardcore Enabled: No Editing',
    'list.hint.normal': 'Swipe Left to Delete · Right to Sort',
    'list.empty': 'No active tasks',
    'list.action.categorize': 'Categorize',
    'list.action.delete': 'Delete',
    'list.move_to': 'Move "{title}" to...',
    'list.cancel': 'Cancel',

    // Stats View
    'stats.title': 'Weekly Report',
    'stats.tasks_completed': 'Tasks Completed',
    'stats.focus_score': 'Focus Score',
    'stats.avg_time': 'Avg Time',
    'stats.vs_last_week': 'vs last week',
    'stats.quote': '"You are becoming a person who gets things done."',
    'stats.badge.title': 'Deep Work Master',
    'stats.badge.desc': 'Completed 5 Q1 tasks in a row',

    // User View
    'user.guest': 'Guest User',
    'user.tier': 'Free Tier',
    'user.hardcore': 'Hardcore Mode',
    'user.hardcore.desc': 'Disables dragging to sort active tasks. Forces you to clear the list.',
    'user.language': 'Language',
    'user.export': 'Export JSON',
    'user.clear': 'Clear All Data',
    'user.clear.confirm': 'Are you sure you want to clear all tasks? This cannot be undone.',
    'user.install': 'Install App',
    'user.install.desc': 'Add to Home Screen for full experience',
    'user.version': 'Focus Matrix v1.1.0',

    // Add Modal
    'add.title': 'New Task',
    'add.placeholder': 'What needs to be done?',
    'add.button': 'Add',
    'add.hint': '↵ Enter to save',
    
    // Install Modal
    'install.title': 'Add to Home Screen',
    'install.ios.step1': '1. Tap the Share button',
    'install.ios.step2': '2. Scroll down and tap "Add to Home Screen"',
    'install.android.step1': '1. Tap the menu icon (⋮)',
    'install.android.step2': '2. Tap "Install App" or "Add to Home screen"',
    'install.button.close': 'Got it',
  },
  zh: {
    // Matrix View
    'matrix.title': '专注矩阵',
    'matrix.inbox': '收集箱',
    'matrix.empty': '空',
    'matrix.inbox.hint': '长按任务拖入矩阵',
    'matrix.inbox.zero': '太棒了，清空了 🎉',
    'q1.title': '立刻做',
    'q2.title': '计划做',
    'q3.title': '授权做',
    'q4.title': '尽量做',
    
    // List View
    'list.title': '今日清单',
    'list.hint.hardcore': '硬核模式已开启：禁止编辑',
    'list.hint.normal': '左滑删除 · 右滑归类',
    'list.empty': '暂无任务',
    'list.action.categorize': '归类',
    'list.action.delete': '删除',
    'list.move_to': '将 "{title}" 移动到...',
    'list.cancel': '取消',

    // Stats View
    'stats.title': '周报',
    'stats.tasks_completed': '完成任务',
    'stats.focus_score': '专注分',
    'stats.avg_time': '平均耗时',
    'stats.vs_last_week': '对比上周',
    'stats.quote': '“你正在变成一个真正说到做到的人。”',
    'stats.badge.title': '深度工作大师',
    'stats.badge.desc': '连续完成 5 个第一象限任务',

    // User View
    'user.guest': '访客用户',
    'user.tier': '免费版',
    'user.hardcore': '硬核模式',
    'user.hardcore.desc': '开启后禁止手动拖拽排序，强制面对现实。',
    'user.language': '语言设置',
    'user.export': '导出数据',
    'user.clear': '清空所有数据',
    'user.clear.confirm': '确定要清空所有任务吗？此操作无法撤销。',
    'user.install': '安装应用',
    'user.install.desc': '添加到主屏幕以获得最佳体验',
    'user.version': 'Focus Matrix v1.1.0',

    // Add Modal
    'add.title': '新任务',
    'add.placeholder': '准备做点什么？',
    'add.button': '添加',
    'add.hint': '↵ 回车保存',

    // Install Modal
    'install.title': '添加到主屏幕',
    'install.ios.step1': '1. 点击底部“分享”按钮',
    'install.ios.step2': '2. 下滑找到并点击“添加到主屏幕”',
    'install.android.step1': '1. 点击浏览器菜单图标 (⋮)',
    'install.android.step2': '2. 点击“安装应用”或“添加到主屏幕”',
    'install.button.close': '知道了',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      if (typeof window === 'undefined') return 'en';
      const saved = localStorage.getItem('focus-matrix-lang');
      return (saved === 'zh' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('focus-matrix-lang', language);
    } catch (e) {
      console.warn('Failed to save language setting');
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};