import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Camera, ImagePlus, Plus, X } from 'lucide-react';
import { toast } from '@/stores/toastStore';

export type ChatAttachFile = {
  name: string;
  dataUrl?: string;
  type: string;
};

type ChatAttachMenuProps = {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
  onImageCaptured: (file: ChatAttachFile) => void;
};

/**
 * Plus menu: Upload photo / Take picture — all actions are functional.
 */
export default function ChatAttachMenu({
  disabled,
  onFilesSelected,
  onImageCaptured,
}: ChatAttachMenuProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.docx,.txt"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFilesSelected(files);
          e.target.value = '';
          setOpen(false);
        }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="shrink-0 flex items-center justify-center rounded-full w-9 h-9 min-w-[36px] min-h-[36px] transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-[var(--dash-focus-ring)]"
        style={{
          color: open ? 'var(--teaching-accent, #1d4ed8)' : 'var(--teaching-panel-text-muted, #64748b)',
          background: open ? 'color-mix(in srgb, var(--teaching-accent, #1d4ed8) 12%, transparent)' : 'transparent',
        }}
        aria-label="Attach photo or document"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="Attach"
      >
        <Plus className="w-5 h-5" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute bottom-[calc(100%+8px)] left-0 z-40 min-w-[200px] overflow-hidden rounded-[var(--dash-radius-md,0.75rem)] border shadow-lg"
          style={{
            background: 'var(--dash-surface-0, #fff)',
            borderColor: 'var(--dash-border, #e2e8f0)',
            boxShadow: 'var(--dash-shadow-2, 0 8px 24px rgba(15,23,42,0.12))',
          }}
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm font-semibold transition-colors hover:bg-[var(--dash-surface-1,#f8fafc)] min-h-[44px]"
            style={{ color: 'var(--dash-text, #0f172a)' }}
            onClick={() => {
              fileRef.current?.click();
            }}
          >
            <ImagePlus className="h-4 w-4 shrink-0" style={{ color: 'var(--teaching-accent)' }} />
            Upload photo
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2.5 border-t px-3.5 py-3 text-left text-sm font-semibold transition-colors hover:bg-[var(--dash-surface-1,#f8fafc)] min-h-[44px]"
            style={{
              color: 'var(--dash-text, #0f172a)',
              borderColor: 'var(--dash-border, #e2e8f0)',
            }}
            onClick={() => {
              setOpen(false);
              setCameraOpen(true);
            }}
          >
            <Camera className="h-4 w-4 shrink-0" style={{ color: 'var(--teaching-accent)' }} />
            Take picture
          </button>
        </div>
      ) : null}

      {cameraOpen ? (
        <CameraCaptureModal
          onClose={() => setCameraOpen(false)}
          onCapture={(file) => {
            onImageCaptured(file);
            setCameraOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function CameraCaptureModal({
  onClose,
  onCapture,
}: {
  onClose: () => void;
  onCapture: (file: ChatAttachFile) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera is not supported in this browser. Use Upload photo instead.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
      } catch (err) {
        const name = err instanceof DOMException ? err.name : '';
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setError('Camera permission denied. You can still upload a photo from your device.');
        } else if (name === 'NotFoundError') {
          setError('No camera found on this device. Use Upload photo instead.');
        } else {
          setError('Could not open the camera. Use Upload photo instead.');
        }
        toast.info('Camera unavailable — try uploading a photo.');
      }
    })();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      cancelled = true;
      stopStream();
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, stopStream]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Could not capture image.');
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    onCapture({
      name: `camera-${stamp}.jpg`,
      dataUrl,
      type: 'image/jpeg',
    });
    stopStream();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Take a picture"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[var(--dash-radius-lg,1rem)] border shadow-xl"
        style={{
          background: 'var(--dash-surface-0, #fff)',
          borderColor: 'var(--dash-border)',
        }}
      >
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3" style={{ borderColor: 'var(--dash-border)' }}>
          <h2 className="text-sm font-extrabold" style={{ color: 'var(--dash-text)' }}>
            Take picture
          </h2>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-[var(--dash-radius-sm)] hover:bg-[var(--dash-surface-1)]"
            aria-label="Close camera"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-[4/3] bg-slate-900">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="text-sm text-white/90 max-w-sm">{error}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />
          )}
        </div>

        <div className="flex gap-2 p-4">
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="flex-1 min-h-[44px] rounded-[var(--dash-radius-sm)] border text-sm font-bold"
            style={{ borderColor: 'var(--dash-border)', color: 'var(--dash-text-2)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={!ready || Boolean(error)}
            className="flex-1 min-h-[44px] rounded-[var(--dash-radius-sm)] text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'var(--teaching-accent, #1d4ed8)' }}
          >
            Capture
          </button>
        </div>
      </div>
    </div>
  );
}
