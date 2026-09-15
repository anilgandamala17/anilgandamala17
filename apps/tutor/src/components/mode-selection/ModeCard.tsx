import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Check, Flame, Star } from 'lucide-react';
import Logo from './Logo';

export type ModeAccent = 'curriculum' | 'competitive';

export interface ModeCardTag {
  label: string;
  icon: LucideIcon;
}

export interface ModeCardProps {
  accent: ModeAccent;
  image: string;
  badge: string;
  eyebrow: string;
  title: string;
  description: string;
  tags: ModeCardTag[];
  ctaLabel: string;
  onSelect: () => void;
  isSelecting: boolean;
  disabled?: boolean;
  markId: string;
  /** First-screen card: load immediately for LCP. */
  eager?: boolean;
}

export default function ModeCard({
  accent,
  image,
  badge,
  eyebrow,
  title,
  description,
  tags,
  ctaLabel,
  onSelect,
  isSelecting,
  disabled,
  markId,
  eager,
}: ModeCardProps) {
  const BadgeIcon = accent === 'curriculum' ? Star : Flame;

  return (
    <article className={`ms-card ms-card--${accent}`}>
      <button
        type="button"
        className="ms-card__hit"
        onClick={onSelect}
        disabled={disabled}
        aria-label={ctaLabel}
        aria-busy={isSelecting}
      >
        <div className="ms-card__media">
          <img
            src={image}
            alt=""
            width={800}
            height={600}
            decoding="async"
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : 'low'}
          />
          <span className={`ms-badge ms-badge--${accent}`}>
            <BadgeIcon className="h-3 w-3" aria-hidden />
            {badge}
          </span>
          <div className="ms-card__logo-chip">
            <Logo size="sm" showWordmark={false} chip markId={markId} />
          </div>
        </div>

        <div className="ms-card__body">
          <p className={`ms-card__eyebrow ms-card__eyebrow--${accent}`}>{eyebrow}</p>
          <h3 className="ms-card__title">{title}</h3>
          <p className="ms-card__desc">{description}</p>

          <ul className="ms-tags" aria-label="Highlights">
            {tags.map((tag) => {
              const Icon = tag.icon;
              return (
                <li key={tag.label} className={`ms-tag ms-tag--${accent}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {tag.label}
                </li>
              );
            })}
          </ul>

          <span className={`ms-cta ms-cta--${accent}`} aria-hidden>
            {isSelecting ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2.5} />
                Opening…
              </>
            ) : (
              <>
                <span>{ctaLabel}</span>
                <ArrowRight className="ms-cta__arrow h-4 w-4" />
              </>
            )}
          </span>
        </div>
      </button>
    </article>
  );
}
