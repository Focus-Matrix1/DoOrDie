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
    'matrix.title': 'Focus Matrix',
    'matrix.inbox': 'Inbox',
    'matrix.empty': 'Empty',
    'matrix.q2.empty': 'First Things First: Invest in Q2.',
    'matrix.inbox.hint': 'Hold & Drag to Matrix',
    'matrix.inbox.zero': 'Inbox Zero 🎉',
    'q1.title': 'Urgent & Important',
    'q1.subtitle': 'Crisis · Tackle',
    'q2.title': 'Not\u00A0Urgent & Important',
    'q2.subtitle': 'Compound · Value',
    'q3.title': 'Urgent & Not\u00A0Important',
    'q3.subtitle': 'Trivia · Interruption',
    'q4.title': 'Not\u00A0Urgent & Not\u00A0Important',
    'q4.subtitle': 'Relax · Reset',
    
    'list.title': 'Tasks',
    'list.hint.hardcore': 'Hardcore Enabled',
    'list.hint.normal': 'Swipe Left to Delete · Right to Sort',
    'list.empty': 'No tasks',
    'list.action.categorize': 'Sort',
    'list.action.delete': 'Delete',
    'list.action.complete': 'Done',
    'list.move_to': 'Move "{title}" to...',
    'list.cancel': 'Cancel',
    'list.section.planned': 'Planned',
    'list.section.backlog': 'Inbox / Backlog',
    'list.section.completed': 'Completed',
    'list.header.inbox': 'Inbox',
    'list.header.today': 'Today',
    'list.header.completed': 'Completed',
    'list.inbox_zero.celebrate': 'Inbox Zero! 🎉',

    'detail.title': 'Task Details',
    'detail.save': 'Save Changes',
    'detail.delete': 'Delete Task',
    'detail.created': 'Created',
    'detail.category': 'Category',
    'detail.date': 'Planned Completion Date',
    'detail.date.placeholder': 'Select Date',
    'detail.duration': 'Duration',
    'detail.hardcore_locked': 'Hardcore Mode: Editing Disabled',

    'habits.title': 'Habits',
    'habits.add': 'New Habit',
    'habits.streak': 'Streak',
    'habits.empty': 'No habits yet. Start small.',
    'habits.delete_confirm': 'Delete this habit?',
    'habits.today': 'Today',
    'habits.daily_badge': 'DAILY',
    'habits.freq.every': 'Every ',
    'habits.freq.day': 'Day',
    'habits.freq.suffix': '',
    'habits.all_done': 'All habits completed today',
    'habits.completed_section': 'Completed Today',

    'category.sheet.title': 'Quick Sort',

    'profile.title': 'Profile',
    'profile.settings': 'Settings',
    'stats.title': 'Insights',
    'stats.tasks_completed': 'Velocity',
    'stats.avg_speed': 'Avg Speed',
    'stats.speed.fast': 'Efficient ⚡️',
    'stats.speed.slow': 'Dragging 🐢',
    'stats.focus_hours': 'Focus Hours',
    'stats.streak': 'Day Streak',
    'stats.trend': 'Flow Rhythm',
    'stats.distribution': 'Energy Allocation',
    'stats.habit_consistency': 'Habit Consistency',
    'stats.quote': '“First Things First” doesn’t mean doing everything, but investing your best energy in Q2.',
    'stats.habit.heatmap.achieved': 'Achieved',
    'stats.habit.heatmap.missed': 'Missed',
    'stats.habit.heatmap.start': '✨ Start your first day',

    'settings.account': 'Account',
    'settings.preferences': 'Preferences',
    'settings.app': 'App',
    'settings.danger': 'Danger Zone',
    'user.guest': 'Guest User',
    'user.tier': 'Free Tier',
    'user.pro': 'Pro',
    'user.hardcore': 'Hardcore Mode',
    'user.hardcore.desc': 'Once created, tasks cannot be edited. Only complete or delete.',
    'user.ai': 'AI Auto-Classify',
    'user.ai.desc': 'Automatically sort tasks and estimate duration',
    'user.language': 'Language',
    'user.clear': 'Clear All Data',
    'user.clear.confirm': 'Are you sure you want to clear all tasks? This cannot be undone.',
    'user.install': 'Install App',
    'user.install.desc': 'Add to Home Screen',
    'user.version': 'Focus Matrix v2.1',
    'user.edit_name': 'Edit Name',
    'user.edit_avatar': 'Edit Avatar',
    'user.save_name': 'Save',
    'user.cancel': 'Cancel',

    'add.title': 'New Task',
    'add.placeholder': 'What needs to be done?',
    'add.description_placeholder': 'Add details (optional)',
    'add.button': 'Add',
    'add.hint': '↵ Enter to save',
    
    'install.title': 'Add to Home Screen',
    'install.ios.step1': '1. Tap Share button',
    'install.ios.step2': '2. Tap "Add to Home Screen"',
    'install.android.step1': '1. Tap menu icon (⋮)',
    'install.android.step2': '2. Tap "Install App"',
    'install.button.close': 'Got it',

    'cloud.title': 'Cloud Backup',
    'cloud.desc': 'Sync tasks across devices',
    'cloud.sync': 'Sync Now',
    'cloud.syncing': 'Syncing...',
    'cloud.restore_success': 'Data restored from cloud!',
    'cloud.upload_success': 'Backup successful!',
    'cloud.sync_error': 'Sync Error (Tap to Retry)',
    'auth.login': 'Log In',
    'auth.login_to_sync': 'Login to Sync',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Log Out',
    'auth.phone': 'Phone Number',
    'auth.password': 'Password',
    'auth.placeholder.phone': 'Mobile Number',
    'auth.placeholder.pass': 'Password',
    'auth.switch.login': 'Already have an account? Log In',
    'auth.switch.signup': 'No account? Sign Up',
    'auth.error': 'Authentication failed. Please check credentials.',

    'ai.sorted': 'Auto-sorted to',
    'ai.unsure': 'Insufficient info to classify',

    // Initial Data - Concise & Educational
    'initial.task.drag': 'Hold & Drag to Q1 (Red)',
    'initial.task.swipe': 'Swipe Left to Delete 👈',
    'initial.task.hardcore': 'Try Hardcore Mode 🛡️',
    'initial.task.workout': 'Plan Workout 💪',
    'initial.task.read': 'Read 15 Mins 📖',
    
    'initial.habit.water': 'Drink Water',
    'initial.habit.read': 'Read 10 Pages',
  },
  zh: {
    'matrix.title': '专注矩阵',
    'matrix.inbox': '收集箱',
    'matrix.empty': '空',
    'matrix.q2.empty': '要事第一：请投资你的第二象限。',
    'matrix.inbox.hint': '长按任务拖入矩阵',
    'matrix.inbox.zero': '太棒了，清空了 🎉',
    'q1.title': '重要且紧急',
    'q1.subtitle': '危机 · 攻坚',
    'q2.title': '重要不紧急',
    'q2.subtitle': '复利 · 增值',
    'q3.title': '紧急不重要',
    'q3.subtitle': '琐事 · 干扰',
    'q4.title': '不重要不紧急',
    'q4.subtitle': '松弛 · 重置',
    
    'list.title': '清单',
    'list.hint.hardcore': '硬核模式已开启',
    'list.hint.normal': '左滑删除 · 右滑归类',
    'list.empty': '暂无任务',
    'list.action.categorize': '归类',
    'list.action.delete': '删除',
    'list.action.complete': '完成',
    'list.move_to': '将 "{title}" 移动到...',
    'list.cancel': '取消',
    'list.section.planned': '待办',
    'list.section.backlog': '收集箱 / 待定',
    'list.section.completed': '已完成',
    'list.header.inbox': '收集箱',
    'list.header.today': '今日计划',
    'list.header.completed': '已完成',
    'list.inbox_zero.celebrate': '清空收集箱！🎉',

    'detail.title': '任务详情',
    'detail.save': '保存修改',
    'detail.delete': '删除任务',
    'detail.created': '创建时间',
    'detail.category': '所属分类',
    'detail.date': '计划完成日期',
    'detail.date.placeholder': '点击选择日期',
    'detail.duration': '持续时间',
    'detail.hardcore_locked': '硬核模式：禁止编辑',

    'habits.title': '习惯追踪',
    'habits.add': '新建习惯',
    'habits.streak': '连胜',
    'habits.empty': '暂无习惯，从坚持一件小事开始。',
    'habits.delete_confirm': '删除这个习惯？',
    'habits.today': '今日',
    'habits.daily_badge': '每日',
    'habits.freq.every': '每 ',
    'habits.freq.day': '天',
    'habits.freq.suffix': ' 一次',
    'habits.all_done': '今日已全部达成',
    'habits.completed_section': '今日已完成',

    'category.sheet.title': '快速分类',

    'profile.title': '个人中心',
    'profile.settings': '设置',
    'stats.title': '数据概览',
    'stats.tasks_completed': '本周产出',
    'stats.avg_speed': '平均流转',
    'stats.speed.fast': '高效 ⚡️',
    'stats.speed.slow': '拖延 🐢',
    'stats.focus_hours': '投入时长',
    'stats.streak': '连续产出',
    'stats.trend': '产出节奏',
    'stats.distribution': '精力分布',
    'stats.habit_consistency': '习惯养成趋势',
    'stats.quote': '“要事第一”并不是指把所有事都做完，而是把最大的精力投放在第二象限。',
    'stats.habit.heatmap.achieved': '已达成',
    'stats.habit.heatmap.missed': '未达成',
    'stats.habit.heatmap.start': '✨ 开始你的第一天',

    'settings.account': '账号',
    'settings.preferences': '偏好设置',
    'settings.app': '应用',
    'settings.danger': '危险区域',
    'user.guest': '访客用户',
    'user.tier': '免费版',
    'user.pro': '专业版',
    'user.hardcore': '硬核模式',
    'user.hardcore.desc': '开启后任务一旦创建不可修改，只能完成或删除。',
    'user.ai': 'AI 自动分类',
    'user.ai.desc': '根据标题自动归类并预估用时',
    'user.language': '语言设置',
    'user.clear': '清空所有数据',
    'user.clear.confirm': '确定要清空所有任务和习惯吗？此操作无法撤销。',
    'user.install': '安装应用',
    'user.install.desc': '添加到主屏幕以获得最佳体验',
    'user.version': 'Focus Matrix v2.1',
    'user.edit_name': '修改用户名',
    'user.edit_avatar': '修改头像',
    'user.save_name': '保存',
    'user.cancel': '取消',

    'add.title': '新任务',
    'add.placeholder': '准备做点什么？',
    'add.description_placeholder': '添加备注（选填）',
    'add.button': '添加',
    'add.hint': '↵ 回车保存',

    'install.title': '添加到主屏幕',
    'install.ios.step1': '1. 点击底部“分享”按钮',
    'install.ios.step2': '2. 下滑找到并点击“添加到主屏幕”',
    'install.android.step1': '1. 点击浏览器菜单图标 (⋮)',
    'install.android.step2': '2. 点击“安装应用”或“添加到主屏幕”',
    'install.button.close': '知道了',

    'cloud.title': '云端备份',
    'cloud.desc': '登录后在多设备间同步数据',
    'cloud.sync': '同步数据',
    'cloud.syncing': '同步中...',
    'cloud.restore_success': '云端数据已恢复！',
    'cloud.upload_success': '备份成功！',
    'cloud.sync_error': '同步失败 (点击重试)',
    'auth.login': '登录',
    'auth.login_to_sync': '登录以同步',
    'auth.signup': '注册',
    'auth.logout': '退出登录',
    'auth.phone': '手机号',
    'auth.password': '密码',
    'auth.placeholder.phone': '请输入手机号',
    'auth.placeholder.pass': '请输入密码',
    'auth.switch.login': '已有账号？去登录',
    'auth.switch.signup': '没有账号？去注册',
    'auth.error': '认证失败，请检查账号密码。',

    'ai.sorted': '已自动归类至',
    'ai.unsure': '信息不足无法分类',

    // Initial Data - Concise & Educational
    'initial.task.drag': '长按拖入 Q1 (红色)',
    'initial.task.swipe': '👈 向左滑动删除',
    'initial.task.hardcore': '体验硬核模式 🛡️',
    'initial.task.workout': '制定健身计划 💪',
    'initial.task.read': '阅读 15 分钟 📖',

    'initial.habit.water': '喝水',
    'initial.habit.read': '阅读 10 页',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      if (typeof window === 'undefined') return 'en';
      const saved = localStorage.getItem('focus-matrix-lang');
      if (saved === 'zh' || saved === 'en') return saved;
      const nav = window.navigator;
      if (nav.languages && nav.languages.length > 0) {
        for (const lang of nav.languages) {
           if (lang.toLowerCase().startsWith('zh')) return 'zh';
           if (lang.toLowerCase().startsWith('en')) return 'en';
        }
      }
      const browserLang = nav.language.toLowerCase();
      return browserLang.startsWith('zh') ? 'zh' : 'en';
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