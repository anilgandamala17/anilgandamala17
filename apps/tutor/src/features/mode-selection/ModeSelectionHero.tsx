import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  image: string;
  objectPosition: string;
  alt: string;
};

const SLIDES: readonly HeroSlide[] = [
  {
    id: 'path',
    eyebrow: 'Student learning path',
    title: 'Choose how you learn',
    lede: 'Board mastery or national entrance prep — one focused platform for Indian students.',
    image: '/tutor-media/mode-selection/hero-banner-strip.png',
    objectPosition: '92% 45%',
    alt: 'Indian high-school student in an Aɪra branded polo, smiling in a studio portrait',
  },
  {
    id: 'curriculum',
    eyebrow: 'Curriculum mode',
    title: 'Board mastery, step by step',
    lede: 'Structured lessons aligned to your board — build foundations with clarity and pace.',
    image: '/tutor-media/mode-selection/curriculum.png',
    objectPosition: '62% 28%',
    alt: 'Student studying with books in a bright library setting',
  },
  {
    id: 'entrance',
    eyebrow: 'Competitive mode',
    title: 'JEE · NEET exam prep',
    lede: 'Timed practice and focused drills for national entrance exams — stay sharp under pressure.',
    image: '/tutor-media/mode-selection/competitive.png',
    objectPosition: '58% 26%',
    alt: 'Student focused on exam preparation at a desk with a study lamp',
  },
  {
    id: 'ai-tutor',
    eyebrow: 'AI tutoring',
    title: 'A tutor that adapts to you',
    lede: 'Visual lessons and voice teaching that adjust to how you learn — anytime you need help.',
    image: '/tutor-media/mode-selection/hero-16x9.png',
    objectPosition: '72% 22%',
    alt: 'Confident student ready to learn with Aɪra AI tutoring',
  },
] as const;

const AUTOPLAY_MS = 5500;
const EASE = [0.16, 1, 0.3, 1] as const;

export default function ModeSelectionHero() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const count = SLIDES.length;
  const slide = SLIDES[index]!;
  const autoplayBlocked = reduce || paused || pageHidden;

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (autoplayBlocked) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplayBlocked, count]);

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  const slideMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reduce ? 0.15 : 0.35, ease: EASE },
  };

  return (
    <section className="ms-hero" aria-labelledby="ms-hero-title">
      <div
        ref={bannerRef}
        className="ms-hero__banner"
        role="region"
        aria-roledescription="carousel"
        aria-label="Student learning path highlights"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => {
          if (!bannerRef.current?.contains(e.relatedTarget as Node)) {
            setPaused(false);
          }
        }}
      >
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Slide {index + 1} of {count}: {slide.title}
        </div>

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={slide.id}
            className="ms-hero__slide"
            initial={slideMotion.initial}
            animate={slideMotion.animate}
            exit={slideMotion.exit}
            transition={slideMotion.transition}
          >
            <div className="ms-hero__media">
              <img
                src={slide.image}
                alt={slide.alt}
                width={1920}
                height={360}
                decoding="async"
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                className="ms-hero__img"
                data-slide={slide.id}
                draggable={false}
              />
            </div>
            <div className="ms-hero__scrim" aria-hidden />
            <div className="ms-hero__content">
              <div className="ms-hero__copy">
                <p className="ms-pill ms-pill--on-banner">
                  <span className="ms-pill__dot" aria-hidden />
                  {slide.eyebrow}
                </p>
                <h1
                  id={index === 0 ? 'ms-hero-title' : undefined}
                  className="ms-display ms-display--on-banner"
                >
                  {slide.title}
                </h1>
                <p className="ms-lede ms-lede--on-banner">{slide.lede}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="ms-hero__controls">
          <button
            type="button"
            className="ms-hero__nav-btn"
            aria-label="Previous slide"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            <ChevronLeft className="size-5" strokeWidth={2} aria-hidden />
          </button>

          <div className="ms-hero__dots" role="tablist" aria-label="Banner slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show slide ${i + 1}: ${s.title}`}
                className={`ms-hero__dot${i === index ? ' is-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                }}
              />
            ))}
          </div>

          <button
            type="button"
            className="ms-hero__nav-btn"
            aria-label="Next slide"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            <ChevronRight className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
