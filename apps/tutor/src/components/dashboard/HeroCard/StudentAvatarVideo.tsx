import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const ASSET_BASE = '/tutor-media/assets/mascot';

const SOURCES = {
  webm: `${ASSET_BASE}/student-avatar-loop.webm`,
  mp4: `${ASSET_BASE}/student-avatar-loop.mp4`,
  mp4Fallback: `${ASSET_BASE}/student-avatar-loop-fallback.mp4`,
  poster: `${ASSET_BASE}/student-avatar-poster.png`,
} as const;

type StudentAvatarVideoProps = {
  readiness?: number;
  className?: string;
};

/**
 * Orbit-center floating student companion.
 * Prefers a chroma-keyed canvas loop (premium floating look); falls back to a
 * visible muted video / poster when canvas or playback fails.
 */
export default function StudentAvatarVideo({ className = '' }: StudentAvatarVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const restarting = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.loop = !reduced;

    const onReady = () => setReady(true);
    const onError = () => setFailed(true);
    const restart = () => {
      if (reduced || restarting.current) return;
      restarting.current = true;
      try {
        video.currentTime = 0.001;
      } catch {
        /* ignore seek errors */
      }
      void video.play().finally(() => {
        restarting.current = false;
      });
    };
    const onEnded = () => restart();
    const onTimeUpdate = () => {
      if (reduced || !video.duration || !Number.isFinite(video.duration)) return;
      if (video.duration > 0 && video.currentTime >= video.duration - 0.08) restart();
    };

    video.addEventListener('canplay', onReady);
    video.addEventListener('loadeddata', onReady);
    video.addEventListener('error', onError);
    video.addEventListener('ended', onEnded);
    video.addEventListener('timeupdate', onTimeUpdate);
    if (video.readyState >= 2) onReady();

    if (reduced) {
      video.pause();
      video.currentTime = 0;
      const freeze = () => {
        video.pause();
        setReady(true);
      };
      if (video.readyState >= 2) freeze();
      else video.addEventListener('loadeddata', freeze, { once: true });
    } else {
      const tryPlay = () => {
        void video.play().catch(() => {
          /* autoplay may be blocked; poster stays visible */
        });
      };
      if (video.readyState >= 2) tryPlay();
      else video.addEventListener('canplay', tryPlay, { once: true });
    }

    return () => {
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onError);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [reduced]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.loop = !reduced;
    if (reduced) {
      video.pause();
      video.currentTime = 0;
    } else {
      void video.play().catch(() => {});
    }
  }, [reduced]);

  // Chroma-key white plate onto canvas for the floating cutout look.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || failed) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let raf = 0;
    let alive = true;
    let last = 0;
    const minFrameMs = 1000 / 18;

    const tick = (now = performance.now()) => {
      if (!alive) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden || now - last < minFrameMs) return;
      if (video.paused || video.ended) return;
      last = now;

      const vw = video.videoWidth || 420;
      const vh = video.videoHeight || 546;
      if (vw <= 0 || vh <= 0) return;

      const scale = Math.min(1, 320 / vw);
      const w = Math.round(vw * scale);
      const h = Math.round(vh * scale);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      const data = frame.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const nearGray = max - min < 28;
        if (nearGray && min > 200) data[i + 3] = 0;
        else if (nearGray && min > 175) data[i + 3] = Math.min(data[i + 3], Math.round(((220 - min) / 45) * 255));
      }
      ctx.putImageData(frame, 0, 0);
    };

    const start = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };

    video.addEventListener('play', start);
    video.addEventListener('seeked', start);
    video.addEventListener('loadeddata', start);
    if (video.readyState >= 2) start();

    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      video.removeEventListener('play', start);
      video.removeEventListener('seeked', start);
      video.removeEventListener('loadeddata', start);
    };
  }, [failed, reduced, ready]);

  const showCanvas = ready && !failed && !reduced;

  return (
    <div
      className={`dash-avatar-frame relative mx-auto w-full max-w-[200px] sm:max-w-[220px] md:max-w-[240px] aspect-square ${className}`.trim()}
      role="img"
      aria-label="Animated student learning companion"
    >
      <div
        className="absolute inset-[14%] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(14,165,233,0.16) 0%, rgba(79,70,229,0.06) 50%, transparent 72%)',
        }}
      />

      {/* Always-visible poster until canvas/video is ready (no multiply — stays readable). */}
      <motion.img
        src={SOURCES.poster}
        alt=""
        aria-hidden
        className="absolute inset-0 m-auto w-[86%] h-[86%] object-contain pointer-events-none"
        initial={{ opacity: 1 }}
        animate={{ opacity: showCanvas ? 0 : 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ zIndex: 1 }}
        draggable={false}
      />

      <video
        ref={videoRef}
        autoPlay={!reduced}
        loop={!reduced}
        muted
        playsInline
        preload="auto"
        aria-hidden
        tabIndex={-1}
        poster={SOURCES.poster}
        onError={() => setFailed(true)}
        className={
          showCanvas
            ? 'absolute left-0 top-0 h-px w-px opacity-0 pointer-events-none'
            : 'dash-avatar-video absolute inset-0 h-full w-full object-cover'
        }
        style={showCanvas ? undefined : { zIndex: 2 }}
      >
        <source src={SOURCES.webm} type="video/webm" />
        <source src={SOURCES.mp4} type="video/mp4" />
        <source src={SOURCES.mp4Fallback} type="video/mp4" />
      </video>

      {!failed && (
        <canvas
          ref={canvasRef}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            zIndex: 3,
            visibility: showCanvas ? 'visible' : 'hidden',
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
          style={{ zIndex: 2 }}
          draggable={false}
        />
      )}
    </div>
  );
}
