import React, { useState, useEffect, ReactNode, ErrorInfo, Component } from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { LanguageProvider } from './context/LanguageContext';
import { MatrixView } from './components/MatrixView';
import { ListView } from './components/ListView';
import { HabitView } from './components/StatsView';
import { ProfileView } from './components/UserView';
import { LayoutGrid, ListTodo, User, Plus, Check, AlertTriangle, Repeat, Sparkles, HelpCircle, X } from 'lucide-react';
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

/**
 * ErrorBoundary class component fixed to correctly inherit from Component with typed props and state.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

// --- AI Feedback Toast ---
const AiFeedbackToast = () => {
    const { aiFeedback, clearAiFeedback } = useTasks();

    if (!aiFeedback) return null;

    const isSuccess = aiFeedback.type === 'success';
    
    return (
        <div 
            onClick={clearAiFeedback}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in flex justify-center w-full max-w-[90%]"
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
  const [currentView, setCurrentView] = useState<ViewState>('matrix');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const { addSuccessTrigger } = useTasks();
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
    // Desktop Container Wrapper
    // Changed sm:bg-[#121212] to sm:bg-gray-200 (#E5E7EB) for better visibility
    <div className="w-full h-[100dvh] bg-[#F5F7FA] sm:bg-gray-200 sm:flex sm:items-center sm:justify-center overflow-hidden">
        {/* Mobile Device Simulation Container */}
        <div 
            className="w-full h-full sm:w-[430px] sm:h-[92vh] sm:max-h-[932px] sm:rounded-[44px] bg-[#F5F7FA] sm:shadow-[0_0_0_12px_#1c1c1e,0_0_0_14px_#3a3a3c,0_40px_80px_-15px_rgba(0,0,0,0.8)] overflow-hidden text-gray-900 relative flex flex-col transition-all duration-300 transform-gpu"
            style={{ 
                // Creating a containing block for fixed position children
                transform: 'translate3d(0, 0, 0)' 
            }}
        >
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
            <div className="bg-white/95 backdrop-blur-xl flex justify-around items-start pt-4 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] z-50 absolute bottom-0 left-0 right-0 border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
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
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <TaskProvider>
          <AppContent />
        </TaskProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}