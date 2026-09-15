import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastProps {
    toast: Toast;
    onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastProps) {
    useEffect(() => {
        if (toast.duration !== 0) {
            const timer = setTimeout(() => {
                onClose(toast.id);
            }, toast.duration || 5000);

            return () => clearTimeout(timer);
        }
    }, [toast.id, toast.duration, onClose]);

    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
        warning: AlertTriangle,
    };

    const colors = {
        success: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900/60 text-green-800 dark:text-green-200',
        error: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200',
        info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-200',
        warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200',
    };

    const iconColors = {
        success: 'text-green-500',
        error: 'text-red-500',
        info: 'text-blue-500',
        warning: 'text-amber-500',
    };

    const Icon = icons[toast.type];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md ${colors[toast.type]}`}
            role="alert"
            aria-live="polite"
        >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[toast.type]}`} />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
                onClick={() => onClose(toast.id)}
                className="flex-shrink-0 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    return (
        <div
            className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
            aria-live="assertive"
            aria-atomic="true"
        >
            <AnimatePresence>
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem toast={toast} onClose={onClose} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
}
