import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  DEFAULT_TTS_LANGUAGE,
  TTS_LANGUAGE_OPTIONS,
} from '@/constants/ttsLanguages';

export type TeachingSettingsPopoverProps = {
  open: boolean;
  onClose: () => void;
  reduceAnimations: boolean;
  showCaptions: boolean;
  onShowCaptionsChange: (v: boolean) => void;
  autoPlay: boolean;
  onAutoPlayChange: (v: boolean) => void;
  onOpenFullSettings?: () => void;
  /** Video-only lessons: Language changes the soundtrack, not AI TTS. */
  videoSoundtrackHint?: boolean;
};

export default function TeachingSettingsPopover({
  open,
  onClose,
  reduceAnimations,
  showCaptions,
  onShowCaptionsChange,
  autoPlay,
  onAutoPlayChange,
  onOpenFullSettings,
  videoSoundtrackHint = false,
}: TeachingSettingsPopoverProps) {
  const { settings, updateAccessibility } = useSettingsStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    // Capture so Escape closes the popover before immersive exit handlers run.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (panelRef.current?.contains(target as Node)) return;
      // Native <select> menus can render outside the panel; keep open while focused.
      const active = document.activeElement;
      if (active instanceof HTMLSelectElement && panelRef.current?.contains(active)) return;
      if (target?.closest?.('select, option')) return;
      onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', onClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose]);

  const a11y = settings.accessibility;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="teaching-settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceAnimations ? 0 : 0.2 }}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            className="teaching-settings-popover"
            role="dialog"
            aria-label="Teaching settings"
            initial={reduceAnimations ? false : { opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceAnimations ? undefined : { opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: reduceAnimations ? 0 : 0.2 }}
          >
            <div className="teaching-settings-popover__header">
              <h3 className="teaching-settings-popover__title">Teaching Settings</h3>
              <button
                type="button"
                className="teaching-settings-popover__close touch-target"
                onClick={onClose}
                aria-label="Close settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="teaching-settings-popover__body">
              <label className="teaching-settings-row">
                <span>Voice</span>
                <input
                  type="checkbox"
                  checked={a11y.textToSpeech}
                  onChange={(e) => {
                    const on = e.target.checked;
                    updateAccessibility({ textToSpeech: on });
                    if (!on) {
                      window.dispatchEvent(new CustomEvent('stop-speech'));
                    }
                  }}
                />
              </label>

              <label className="teaching-settings-row">
                <span>Voice speed ({a11y.ttsSpeed.toFixed(1)}×)</span>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={a11y.ttsSpeed}
                  onChange={(e) => updateAccessibility({ ttsSpeed: parseFloat(e.target.value) })}
                  onPointerUp={(e) => {
                    // Commit restart after drag so playbackRate / TTS pace apply cleanly
                    const v = parseFloat((e.target as HTMLInputElement).value);
                    updateAccessibility({ ttsSpeed: v });
                  }}
                />
              </label>

              <label className="teaching-settings-row teaching-settings-row--select">
                <span>
                  Language
                  {videoSoundtrackHint && (
                    <span className="teaching-settings-row__hint">Changes the video soundtrack.</span>
                  )}
                </span>
                <select
                  value={a11y.ttsLanguage || DEFAULT_TTS_LANGUAGE}
                  onChange={(e) => updateAccessibility({ ttsLanguage: e.target.value })}
                >
                  {TTS_LANGUAGE_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </label>

              <label className="teaching-settings-row">
                <span>Captions</span>
                <input
                  type="checkbox"
                  checked={showCaptions}
                  onChange={(e) => onShowCaptionsChange(e.target.checked)}
                />
              </label>

              <label className="teaching-settings-row">
                <span>Auto-play lesson</span>
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => onAutoPlayChange(e.target.checked)}
                />
              </label>

              <label className="teaching-settings-row">
                <span>Reduce animations</span>
                <input
                  type="checkbox"
                  checked={a11y.reduceAnimations}
                  onChange={(e) => updateAccessibility({ reduceAnimations: e.target.checked })}
                />
              </label>
            </div>

            {onOpenFullSettings && (
              <div className="teaching-settings-popover__footer">
                <button
                  type="button"
                  className="teaching-settings-popover__link"
                  onClick={() => {
                    onClose();
                    onOpenFullSettings();
                  }}
                >
                  Open full settings
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
