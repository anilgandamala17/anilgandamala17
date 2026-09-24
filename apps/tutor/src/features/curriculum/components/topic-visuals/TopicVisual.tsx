import type { TopicVisualSpec } from './types';
import { renderVisualKind } from './kinds/catalog';

export function TopicVisual({
  spec,
  accent,
  titleHint,
}: {
  spec: TopicVisualSpec;
  accent: string;
  titleHint?: string;
}) {
  return (
    <div className="curr-topic-card__visual-art curr-topic-visual">
      <svg
        className="curr-topic-visual__svg"
        viewBox="0 0 240 120"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {renderVisualKind(spec.kind, {
          accent,
          variant: spec.variant,
          titleHint,
        })}
      </svg>
    </div>
  );
}
