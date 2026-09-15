const ASSET_BASE = '/tutor-media/assets/mascot';

const SOURCES = {
  // Loop video files are optional; frontend-only package ships SVG poster only.
  poster: `${ASSET_BASE}/student-avatar-poster.svg`,
} as const;

type StudentAvatarVideoProps = {
  readiness?: number;
  className?: string;
};

/**
 * Orbit-center student companion.
 * Falls back to the static SVG poster when loop video assets are not packaged.
 */
export default function StudentAvatarVideo({ className = '' }: StudentAvatarVideoProps) {
  return (
    <div className={`relative overflow-hidden ${className}`.trim()}>
      <img
        src={SOURCES.poster}
        alt="Student companion"
        className="absolute inset-0 m-auto w-[86%] h-[86%] object-contain"
        style={{ zIndex: 2, mixBlendMode: 'multiply' }}
        draggable={false}
      />
    </div>
  );
}
