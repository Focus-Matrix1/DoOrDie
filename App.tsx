import React, { useState, useEffect, ReactNode, ErrorInfo, Component } from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { LanguageProvider } from './context/LanguageContext';
import { MatrixView } from './components/MatrixView';
import { ListView } from './components/ListView';
import { HabitView } from './components/StatsView';
import { ProfileView } from './components/UserView';
import { LayoutGrid, ListTodo, User, Plus, Check, AlertTriangle, Repeat } from 'lucide-react';
import { ViewState } from './types';
import { AddModal } from './components/AddModal';

// --- Error Boundary Component ---
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
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

// --- Main App Content ---

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('matrix');
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const { addSuccessTrigger } = useTasks();
  const [isSuccessAnim, setSuccessAnim] = useState(false);

  useEffect(() => {
    if (addSuccessTrigger > 0) {
        setSuccessAnim(true);
        if (navigator.vibrate) navigator.vibrate(50);
        const timer = setTimeout(() => setSuccessAnim(false), 800);
        return () => clearTimeout(timer);
    }
  }, [addSuccessTrigger]);

  const NavButton = ({ view, icon: Icon }: { view: ViewState; icon: React.ElementType }) => (
    <button 
      onClick={() => setCurrentView(view)}
      className={`flex flex-col items-center gap-1 w-12 group transition-colors duration-200 ${currentView === view ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <Icon className={`w-6 h-6 stroke-[2.5] transition-transform duration-200 ${currentView === view ? 'scale-110' : 'group-active:scale-90'}`} />
    </button>
  );

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-[#F5F7FA] overflow-hidden text-gray-900 relative">
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
            <div className={`w-full h-full transition-opacity duration-300 ${currentView === 'matrix' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}>
                <MatrixView />
            </div>
            <div className={`w-full h-full transition-opacity duration-300 ${currentView === 'list' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}>
                <ListView />
            </div>
             <div className={`w-full h-full transition-opacity duration-300 ${currentView === 'habits' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}>
                <HabitView />
            </div>
            <div className={`w-full h-full transition-opacity duration-300 ${currentView === 'profile' ? 'opacity-100 z-10' : 'opacity-0 hidden'}`}>
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
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl shadow-black/20 transition-all duration-300 border-[4px] border-white ring-1 ring-gray-100 ${
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
          <AppContent />
        </TaskProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}