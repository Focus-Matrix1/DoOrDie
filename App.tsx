import React, { useState, useEffect, ReactNode, ErrorInfo } from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { LanguageProvider } from './context/LanguageContext';
import { MatrixView } from './components/MatrixView';
import { ListView } from './components/ListView';
import { HabitView } from './components/StatsView';
import { ProfileView } from './components/UserView';
import { LayoutGrid, ListTodo, User, Plus, Check, AlertTriangle, Repeat, Sparkles, HelpCircle, X, Wifi } from 'lucide-react';
import { ViewState } from './types';
import { AddModal } from './components/AddModal';
import { INTERACTION, ANIMATION_DURATIONS } from './constants';

// --- Error Boundary Component ---
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    try {
        localStorage.clear();
        window.location.reload();
    } catch(e) {
        console.error("Failed to clear storage", e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-[#F5F7FA]">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
            The app encountered an error. This is usually caused by corrupted local data.
          </p>
          <div className="bg-white p-4 rounded-xl border border-gray-200 mb-8 w-full max-w-sm overflow-hidden">
             <code className="text-xs text-red-500 block break-words text-left">
                {this.state.error?.message || "Unknown error"}
             </code>
          </div>
          <button 
            onClick={this.handleReset}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-200 hover:scale-105 active:scale-95 transition-all"
          >
            Reset App Data & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- High Fidelity Phone Frame ---
const PhoneFrame: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth > 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    if (!isDesktop) {
        return (
            <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-[#F5F7FA]">
                {children}
            </div>
        );
    }

    // iPhone 15 Pro Titanium Simulation
    // Using complex gradients and shadows to simulate the brushed metal and bezel depth
    return (
        <div className="min-h-screen w-full bg-[#d0d3d8] flex items-center justify-center p-8 overflow-y-auto font-sans">
            <div className="relative shrink-0 my-auto scale-100 transition-transform">
                
                {/* 1. Outer Shadow (Environment Reflection) */}
                <div className="rounded-[60px] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.5),0_10px_30px_-15px_rgba(0,0,0,0.3)]">
                    
                    {/* 2. Titanium Frame Body */}
                    <div className="
                        relative
                        bg-gradient-to-br from-[#6b6b6b] via-[#8e8e8e] to-[#606060]
                        p-[3px]
                        rounded-[60px]
                        shadow-[inset_0_0_2px_1px_rgba(255,255,255,0.2)]
                    ">
                        {/* Frame Texture/Finish Overlay */}
                        <div className="
                            bg-[#222] 
                            p-[10px] 
                            rounded-[57px] 
                            shadow-[inset_0_0_4px_2px_rgba(0,0,0,0.8)]
                        ">
                            
                            {/* Physical Buttons */}
                            <div className="absolute top-[130px] -left-[4px] w-[3px] h-[26px] bg-[#4a4a4a] rounded-l-md shadow-[inset_-1px_0_1px_rgba(0,0,0,0.5)]"></div>
                            <div className="absolute top-[180px] -left-[4px] w-[3px] h-[50px] bg-[#4a4a4a] rounded-l-md shadow-[inset_-1px_0_1px_rgba(0,0,0,0.5)]"></div>
                            <div className="absolute top-[250px] -left-[4px] w-[3px] h-[50px] bg-[#4a4a4a] rounded-l-md shadow-[inset_-1px_0_1px_rgba(0,0,0,0.5)]"></div>
                            <div className="absolute top-[200px] -right-[4px] w-[3px] h-[80px] bg-[#4a4a4a] rounded-r-md shadow-[inset_1px_0_1px_rgba(0,0,0,0.5)]"></div>

                            {/* 3. Screen Bezel (Black Border) */}
                            <div 
                                className="
                                    relative 
                                    w-[375px] h-[812px] 
                                    bg-[#F5F7FA] 
                                    rounded-[48px] 
                                    overflow-hidden 
                                    flex flex-col
                                    shadow-[0_0_0_2px_#000]
                                    border border-black
                                " 
                                style={{ 
                                    transform: 'translateZ(0)',
                                    // Adjusted Safe Area: tighter top (44px), zero bottom
                                    '--sa-top': '44px', 
                                    '--sa-bottom': '0px' 
                                } as React.CSSProperties}
                            >
                                
                                {/* Dynamic Island */}
                                <div className="absolute top-[11px] left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
                                    <div className="w-[120px] h-[35px] bg-black rounded-[20px] flex items-center justify-center gap-4 shadow-sm">
                                        <div className="w-[30%] h-full"></div> {/* Sensors hidden in black */}
                                        <div className="w-2 h-2 rounded-full bg-[#1a1a1a]/60 ml-auto mr-4"></div> {/* Lens */}
                                    </div>
                                </div>
                                
                                {/* Status Bar Left */}
                                <div className="absolute top-[15px] left-[32px] text-black font-semibold text-[14px] z-[900] pointer-events-none tracking-tight">
                                    9:41
                                </div>

                                {/* Status Bar Right - Signal, Wifi, Battery */}
                                <div className="absolute top-[19px] right-[28px] flex items-center gap-1.5 z-[900] pointer-events-none text-black">
                                     {/* Signal Bars */}
                                     <div className="flex items-end gap-[1px] h-[10px]">
                                         <div className="w-[3px] h-[6px] bg-black rounded-[0.5px]"></div>
                                         <div className="w-[3px] h-[8px] bg-black rounded-[0.5px]"></div>
                                         <div className="w-[3px] h-[10px] bg-black rounded-[0.5px]"></div>
                                         <div className="w-[3px] h-[12px] bg-black/30 rounded-[0.5px]"></div>
                                     </div>
                                     {/* Wifi Icon */}
                                     <Wifi className="w-4 h-4 text-black" strokeWidth={2.5} />
                                     {/* Battery Icon (Fixed Single Element) */}
                                     <div className="relative w-[22px] h-[10px] mr-0.5">
                                        <div className="w-full h-full border-[1px] border-black/40 rounded-[3px] p-[1px]">
                                             <div className="w-full h-full bg-black rounded-[1px]"></div>
                                        </div>
                                        {/* Battery Nub */}
                                        <div className="absolute -right-[2.5px] top-1/2 -translate-y-1/2 w-[1.5px] h-[4px] bg-black/40 rounded-r-[1px]"></div>
                                     </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 w-full h-full relative">
                                    {children}
                                </div>

                                {/* Home Indicator - Floating */}
                                <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-black/80 rounded-full z-[999] pointer-events-none backdrop-blur-sm"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="text-center mt-6 text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase opacity-50">
                    iPhone 15 Pro
                </div>
            </div>
        </div>
    );
};

// --- AI Feedback Toast ---
const AiFeedbackToast = () => {
    const { aiFeedback, clearAiFeedback } = useTasks();

    if (!aiFeedback) return null;
    const isSuccess = aiFeedback.type === 'success';
    
    return (
        <div 
            onClick={clearAiFeedback}
            className="fixed left-1/2 -translate-x-1/2 z-[100] animate-fade-in flex justify-center w-full max-w-[90%]"
            // Tighter positioning near Dynamic Island
            style={{ top: 'calc(6px + env(safe-area-inset-top) + var(--sa-top, 0px))' }}
        >
            <div className={`bg-white/95 backdrop-blur-md border border-white/40 shadow-xl rounded-full pl-3 pr-4 py-2 relative overflow-hidden flex items-center gap-3 cursor-pointer ${
                isSuccess ? 'shadow-purple-500/10' : 'shadow-gray-500/10'
            }`}>
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                     isSuccess ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                 }`}>
                     {isSuccess ? <Sparkles className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                 </div>
                 <div className="text-xs font-bold text-gray-800 leading-none whitespace-nowrap">
                     {aiFeedback.message}
                 </div>
                 <button className="text-gray-400 hover:text-gray-600 ml-1">
                     <X className="w-3.5 h-3.5" />
                 </button>
            </div>
        </div>
    );
};

// --- Main App Content ---

const AppContent: React.FC = () => {
  const { addSuccessTrigger } = useTasks();
  const [currentView, setCurrentView] = useState<ViewState>('matrix');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isSuccessAnim, setSuccessAnim] = useState(false);

  useEffect(() => {
    if (addSuccessTrigger > 0) {
        setSuccessAnim(true);
        if (navigator.vibrate) navigator.vibrate(INTERACTION.VIBRATION.SUCCESS);
        const timer = setTimeout(() => setSuccessAnim(false), ANIMATION_DURATIONS.SUCCESS_FEEDBACK);
        return () => clearTimeout(timer);
    }
  }, [addSuccessTrigger]);

  const NavButton = ({ view, icon: Icon }: { view: ViewState; icon: React.ElementType }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center gap-1 w-12 group transition-colors duration-${ANIMATION_DURATIONS.VIEW_TRANSITION} ${currentView === view ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <Icon className={`w-6 h-6 stroke-[2.5] transition-transform duration-${ANIMATION_DURATIONS.VIEW_TRANSITION} ${currentView === view ? 'scale-110' : 'group-active:scale-90'}`} />
    </button>
  );

  return (
    <div className="w-full h-full bg-[#F5F7FA] overflow-hidden relative flex flex-col">
        <AiFeedbackToast />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative z-0">
            <div className={`w-full h-full absolute inset-0 transition-opacity duration-${ANIMATION_DURATIONS.VIEW_TRANSITION} ${currentView === 'matrix' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
                <MatrixView />
            </div>
            <div className={`w-full h-full absolute inset-0 transition-opacity duration-${ANIMATION_DURATIONS.VIEW_TRANSITION} ${currentView === 'list' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
                <ListView />
            </div>
             <div className={`w-full h-full absolute inset-0 transition-opacity duration-${ANIMATION_DURATIONS.VIEW_TRANSITION} ${currentView === 'habits' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
                <HabitView />
            </div>
            <div className={`w-full h-full absolute inset-0 transition-opacity duration-${ANIMATION_DURATIONS.VIEW_TRANSITION} ${currentView === 'profile' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
                <ProfileView />
            </div>
        </div>

        {/* Bottom Navigation */}
        <div 
            className="bg-white/95 backdrop-blur-xl flex justify-around items-start pt-3 px-4 pb-5 z-50 absolute bottom-0 left-0 right-0 border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]"
        >
            <NavButton view="matrix" icon={LayoutGrid} />
            <NavButton view="list" icon={ListTodo} />
            
            {/* Add Button with Success Animation */}
            <button 
                onClick={() => setAddModalOpen(true)}
                className="relative -top-8 group"
            >
                <div 
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl shadow-black/20 transition-all duration-${ANIMATION_DURATIONS.VIEW_TRANSITION} border-[4px] border-white ring-1 ring-gray-100 ${
                        isSuccessAnim ? 'bg-green-500 scale-110 rotate-12' : 'bg-black group-hover:scale-105 group-active:scale-95'
                    }`}
                >
                    {isSuccessAnim ? (
                        <Check className="w-8 h-8 stroke-[3]" />
                    ) : (
                        <Plus className="w-8 h-8 stroke-[3]" />
                    )}
                </div>
            </button>

            <NavButton view="habits" icon={Repeat} />
            <NavButton view="profile" icon={User} />
        </div>

        <AddModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <TaskProvider>
            <PhoneFrame>
              <AppContent />
            </PhoneFrame>
        </TaskProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}