/* eslint-disable react-refresh/only-export-components -- ErrorFallback is local to the boundary */
import { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { getRoutesForRole } from '../../utils/routes';
import { getLandingLoginUrl } from '../../lib/authSession';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// Wrapper component
function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
    const role = useAuthStore((s) => s.role);
    const routes = getRoutesForRole(role);

    const handleGoHome = () => {
        window.location.href = role ? routes.dashboard : getLandingLoginUrl('/student/mode-selection');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <motion.div
                className="max-w-md w-full bg-white/90 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">
                    Oops! Something went wrong
                </h2>

                <p className="text-gray-600 dark:text-slate-300 mb-6">
                    We encountered an unexpected error. Don't worry, your progress is saved.
                </p>

                {error && (
                    <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-3 mb-6 text-left">
                        <p className="text-sm text-gray-500 font-mono truncate">
                            {error.message}
                        </p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onRetry}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <button
                        onClick={handleGoHome}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Go Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
        }

        return this.props.children;
    }
}
