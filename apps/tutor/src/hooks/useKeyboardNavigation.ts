import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for keyboard navigation support
 * Provides common keyboard shortcuts and navigation patterns
 */
export function useKeyboardNavigation(
    shortcuts: Record<string, (e: KeyboardEvent) => void>,
    enabled: boolean = true
) {
    const shortcutsRef = useRef(shortcuts);

    // Keep latest shortcuts without re-registering listeners every render
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when user is typing in input fields
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            // Build shortcut key
            const key = [
                e.ctrlKey || e.metaKey ? 'ctrl' : '',
                e.altKey ? 'alt' : '',
                e.shiftKey ? 'shift' : '',
                e.key.toLowerCase(),
            ]
                .filter(Boolean)
                .join('+');

            const handler = shortcutsRef.current[key];
            if (handler) {
                e.preventDefault();
                handler(e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled]);
}

/**
 * Hook for focus management
 */
export function useFocusManagement() {
    const focusFirstElement = useCallback((container: HTMLElement | null) => {
        if (!container) return;

        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        if (firstElement) {
            firstElement.focus();
        }
    }, []);

    const trapFocus = useCallback((container: HTMLElement | null) => {
        if (!container) return;

        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        container.addEventListener('keydown', handleTab);
        return () => container.removeEventListener('keydown', handleTab);
    }, []);

    return { focusFirstElement, trapFocus };
}
