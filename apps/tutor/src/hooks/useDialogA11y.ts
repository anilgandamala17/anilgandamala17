import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus trap, Escape-to-close, and body scroll lock for modal dialogs.
 */
export function useDialogA11y(options: {
  open: boolean;
  onClose?: () => void;
  /** When true, Escape does not close (e.g. while submitting). */
  disableEscape?: boolean;
}) {
  const { open, onClose, disableEscape = false } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const container = containerRef.current;
    const focusables = () =>
      container
        ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
            (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
          )
        : [];

    const first = focusables()[0];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableEscape && onClose) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !container) return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open, onClose, disableEscape]);

  return containerRef;
}
