import { motion, useReducedMotion } from 'framer-motion';

/** Same boy, pre-framed head → chest for the fixed-height banner */
const HERO_IMG = '/tutor-media/mode-selection/hero-banner-strip.png';

export default function ModeSelectionHero() {
  const reduce = useReducedMotion();

  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <section className="ms-hero" aria-labelledby="ms-hero-title">
      <motion.div className="ms-hero__banner" {...fade}>
        <div className="ms-hero__media">
          <img
            src={HERO_IMG}
            alt="Indian high-school student in an Aɪra branded polo, smiling in a studio portrait"
            width={1920}
            height={320}
            decoding="async"
            fetchPriority="high"
            className="ms-hero__img"
          />
        </div>

        <div className="ms-hero__content">
          <div className="ms-hero__copy">
            <p className="ms-pill ms-pill--on-banner">
              <span className="ms-pill__dot" aria-hidden />
              Student learning path
            </p>
            <h1 id="ms-hero-title" className="ms-display ms-display--on-banner">
              Choose how you learn
            </h1>
            <p className="ms-lede ms-lede--on-banner">
              Board mastery or national entrance prep — one focused platform for Indian students.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
