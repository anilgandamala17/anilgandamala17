import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ASSET_BASE = '/tutor-media/assets/mascot';

const SOURCES = {
  mp4: `${ASSET_BASE}/student-avatar-loop-fallback.mp4`,
  webm: `${ASSET_BASE}/student-avatar-loop.webm`,
  poster: `${ASSET_BASE}/student-avatar-poster.png`,
} as const;

type StudentAvatarVideoProps = {
  readiness?: number;
  className?: string;
};

/**
 * Orbit-center student loop.
 * Renders via canvas with near-white chroma-key so the studio plate blends into
 * the hero card (mix-blend-mode on <video> is unreliable across engines).
 */
export default function StudentAvatarVideo({ className = '' }: StudentAvatarVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const restartingRef = useRef(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.loop = !reduced;

    const markReady = () => setReady(true);
    const onError = () => setFailed(true);

    const restart = () => {
      if (reduced || restartingRef.current) return;
      restartingRef.current = true;
      try {
        el.currentTime = 0.001;
      } catch {
        /* ignore */
      }
      void el.play().finally(() => {
        restartingRef.current = false;
      });
    };

    const onEnded = () => restart();
    const onTimeUpdate = () => {
      if (reduced || !el.duration || !Number.isFinite(el.duration)) return;
      if (el.duration > 0 && el.currentTime >= el.duration - 0.08) restart();
    };

    el.addEventListener('canplay', markReady);
    el.addEventListener('loadeddata', markReady);
    el.addEventListener('error', onError);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTimeUpdate);

    if (el.readyState >= 2) markReady();

    if (reduced) {
      el.pause();
      el.currentTime = 0;
      const showFrame = () => {
        el.pause();
        setReady(true);
      };
      if (el.readyState >= 2) showFrame();
      else el.addEventListener('loadeddata', showFrame, { once: true });
    } else {
      const play = () => void el.play().catch(() => undefined);
      if (el.readyState >= 2) play();
      else el.addEventListener('canplay', play, { once: true });
    }

    return () => {
      el.removeEventListener('canplay', markReady);
      el.removeEventListener('loadeddata', markReady);
      el.removeEventListener('error', onError);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [reduced]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.loop = !reduced;
    if (reduced) {
      el.pause();
      el.currentTime = 0;
    } else {
      void el.play().catch(() => undefined);
    }
  }, [reduced]);

  // Canvas chroma-key loop — keys out near-white studio background
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || failed) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let lastPaint = 0;
    // Cap chroma-key work — full-res getImageData every frame tanks the dashboard main thread.
    const MIN_FRAME_MS = 1000 / 18;

    const paint = (now = performance.now()) => {
      if (!running) return;
      raf = requestAnimationFrame(paint);
      if (document.hidden) return;
      if (now - lastPaint < MIN_FRAME_MS) return;
      lastPaint = now;
      if (video.paused || video.ended) return;
      const vw = video.videoWidth || 420;
      const vh = video.videoHeight || 546;
      if (vw > 0 && vh > 0) {
        const maxW = 320;
        const scale = Math.min(1, maxW / vw);
        const w = Math.round(vw * scale);
        const h = Math.round(vh * scale);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(video, 0, 0, w, h);
        const frame = ctx.getImageData(0, 0, w, h);
        const d = frame.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const maxc = Math.max(r, g, b);
          const minc = Math.min(r, g, b);
          const neutral = maxc - minc < 28;
          if (neutral && minc > 200) {
            d[i + 3] = 0;
          } else if (neutral && minc > 175) {
            d[i + 3] = Math.min(d[i + 3], Math.round(((220 - minc) / 45) * 255));
          }
        }
        ctx.putImageData(frame, 0, 0);
      }
    };

    const start = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    };

    video.addEventListener('play', start);
    video.addEventListener('seeked', start);
    video.addEventListener('loadeddata', start);
    if (video.readyState >= 2) start();

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      video.removeEventListener('play', start);
      video.removeEventListener('seeked', start);
      video.removeEventListener('loadeddata', start);
    };
  }, [failed, reduced, ready]);

  return (
    <div
      className={`dash-avatar-frame relative w-full aspect-square max-w-[148px] sm:max-w-[156px] md:max-w-[164px] mx-auto ${className}`}
      role="img"
      aria-label="Animated student learning companion"
    >
      <div
        className="absolute inset-[18%] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(14,165,233,0.14) 0%, rgba(79,70,229,0.05) 50%, transparent 72%)',
        }}
      />

      <motion.img
        src={SOURCES.poster}
        alt=""
        aria-hidden
        className="absolute inset-0 m-auto w-[86%] h-[86%] object-contain pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: ready && !failed ? 0 : 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{
          filter: ready ? 'none' : 'blur(6px) saturate(1.05)',
          zIndex: 1,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Offscreen source — must remain "rendered" for decode/autoplay */}
      <video
        ref={videoRef}
        autoPlay={!reduced}
        loop={!reduced}
        muted
        playsInline
        preload="auto"
        aria-hidden
        tabIndex={-1}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: 'none',
          left: 0,
          top: 0,
        }}
      >
        <source src={SOURCES.mp4} type="video/mp4" />
        <source src={SOURCES.webm} type="video/webm" />
      </video>

      {!failed && (
        <canvas
          ref={canvasRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            zIndex: 2,
            visibility: ready ? 'visible' : 'hidden',
            background: 'transparent',
            width: '88%',
            height: 'auto',
            maxHeight: '92%',
          }}
        />
      )}

      {failed && (
        <img
          src={SOURCES.poster}
          alt="Student companion"
          className="absolute inset-0 m-auto w-[86%] h-[86%] object-contain"
          style={{ zIndex: 2, mixBlendMode: 'multiply' }}
        />
      )}
    </div>
  );
}
