import { motion } from 'framer-motion';
import { useSettingsStore } from '../../stores/settingsStore';

interface FullPageLoaderProps {
    message?: string;
    /** Secondary line under the main message (e.g. Fetching lesson) */
    stage?: string;
}

/** Arc spinner — white ring segment on gradient tile */
function LoaderArc({ className = '' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
            <circle
                cx="20"
                cy="20"
                r="14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="52 36"
                className="text-white/95"
            />
        </svg>
    );
}

export default function FullPageLoader({ message = 'Loading', stage }: FullPageLoaderProps) {
    const reduceAnimations = useSettingsStore((state) => state.settings.accessibility.reduceAnimations);

    return (
        <div
            className="relative min-h-screen overflow-hidden flex items-center justify-center dark:bg-slate-950"
            style={{
                background: 'linear-gradient(165deg, #faf9fc 0%, #f3f0f8 42%, #ece8f4 100%)',
            }}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            {!reduceAnimations && (
                <>
                    <div
                        className="pointer-events-none absolute top-[18%] left-[22%] h-72 w-72 rounded-full opacity-40 blur-3xl"
                        style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, transparent 70%)' }}
                    />
                    <div
                        className="pointer-events-none absolute bottom-[20%] right-[18%] h-64 w-64 rounded-full opacity-35 blur-3xl"
                        style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.28) 0%, transparent 70%)' }}
                    />
                </>
            )}

            <motion.div
                className="relative z-10 flex flex-col items-center gap-5 px-6"
                initial={reduceAnimations ? false : { opacity: 0, y: 12 }}
                animate={reduceAnimations ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
                <motion.div
                    className="relative"
                    animate={
                        reduceAnimations
                            ? undefined
                            : { y: [0, -4, 0], rotate: [-10, -8, -10] }
                    }
                    transition={
                        reduceAnimations
                            ? undefined
                            : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
                    }
                >
                    <div
                        className="relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-[1.15rem] shadow-[0_12px_40px_-8px_rgba(124,58,237,0.45),0_4px_14px_-4px_rgba(236,72,153,0.25)]"
                        style={{
                            transform: 'rotate(-10deg)',
                            background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 48%, #7c3aed 100%)',
                        }}
                    >
                        <motion.div
                            animate={reduceAnimations ? undefined : { rotate: 360 }}
                            transition={
                                reduceAnimations
                                    ? undefined
                                    : { duration: 0.7, repeat: Infinity, ease: 'linear' }
                            }
                            className="h-9 w-9"
                        >
                            <LoaderArc className="h-full w-full" />
                        </motion.div>
                    </div>
                    <div
                        className="absolute -bottom-3 left-1/2 h-3 w-12 -translate-x-1/2 rounded-full opacity-30 blur-md"
                        style={{ background: 'linear-gradient(90deg, transparent, #a855f7, transparent)' }}
                        aria-hidden
                    />
                </motion.div>

                {/* Indeterminate progress bar */}
                <div className="h-1 w-36 overflow-hidden rounded-full bg-violet-100 dark:bg-slate-800">
                    {!reduceAnimations ? (
                        <motion.div
                            className="h-full w-1/2 rounded-full"
                            style={{ background: 'linear-gradient(90deg, #ec4899, #a855f7)' }}
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    ) : (
                        <div
                            className="h-full w-1/2 rounded-full"
                            style={{ background: 'linear-gradient(90deg, #ec4899, #a855f7)' }}
                        />
                    )}
                </div>

                <div className="flex flex-col items-center gap-1">
                    {message.trim() ? (
                    <div className="flex items-baseline gap-0.5">
                        <p className="text-[15px] font-medium tracking-[0.02em] text-slate-600 dark:text-slate-300">
                            {message.replace(/\.+$/, '')}
                        </p>
                        {!reduceAnimations ? (
                            <span className="inline-flex w-5" aria-hidden>
                                {[0, 1, 2].map((i) => (
                                    <motion.span
                                        key={i}
                                        className="text-[15px] font-medium text-slate-500 dark:text-slate-400"
                                        animate={{ opacity: [0.25, 1, 0.25] }}
                                        transition={{
                                            duration: 1.1,
                                            repeat: Infinity,
                                            delay: i * 0.18,
                                            ease: 'easeInOut',
                                        }}
                                    >
                                        .
                                    </motion.span>
                                ))}
                            </span>
                        ) : (
                            <span className="text-[15px] font-medium text-slate-500 dark:text-slate-400">...</span>
                        )}
                    </div>
                    ) : null}
                    {stage ? (
                        <p className="text-xs font-medium text-violet-600/80 dark:text-violet-300/70">{stage}</p>
                    ) : null}
                </div>
            </motion.div>
        </div>
    );
}
