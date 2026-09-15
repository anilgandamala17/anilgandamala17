import { create } from 'zustand';
import type { Toast, ToastType } from '../components/common/Toast';

interface ToastStore {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
    clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    showToast: (message, type = 'info', duration = 5000) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const toast: Toast = { id, message, type, duration };
        set((state) => ({ toasts: [...state.toasts, toast] }));
    },
    removeToast: (id) => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
    clearAll: () => {
        set({ toasts: [] });
    },
}));

// Convenience functions
export const toast = {
    success: (message: string, duration?: number) => useToastStore.getState().showToast(message, 'success', duration),
    error: (message: string, duration?: number) => useToastStore.getState().showToast(message, 'error', duration),
    info: (message: string, duration?: number) => useToastStore.getState().showToast(message, 'info', duration),
    warning: (message: string, duration?: number) => useToastStore.getState().showToast(message, 'warning', duration),
};
