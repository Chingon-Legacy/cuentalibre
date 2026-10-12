import { useEffect, useState } from "react";
import { useStrings } from "../i18n";

export interface TourStep {
  /** CSS selector of the element to highlight. */
  selector: string;
  title: string;
  body: string;
}

interface Props {
  steps: TourStep[];
  onDone: () => void;
}

/**
 * Friendly first-run tour: highlights one element at a time and shows
 * a small card with a plain-words explanation near it. Each step
 * targets a CSS selector; if the target is missing the step is skipped.
 */
export default function Tour({ steps, onDone }: Props) {
  const t = useStrings();
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    const step = steps[idx];
    const el = document.querySelector(step.selector) as HTMLElement | null;
    document
      .querySelectorAll(".tour-highlight")
      .forEach((e) => e.classList.remove("tour-highlight"));
    if (!el) {
      // Target missing (e.g. a hidden nav) — skip this step.
      setPos(null);
      if (idx < steps.length - 1) {
        setIdx(idx + 1);
      } else {
        onDone();
      }
      return;
    }
    el.classList.add("tour-highlight");
    // Scroll FIRST and measure AFTER. The old code used a smooth scroll and
    // measured synchronously, so the rect was the pre-scroll one and the card
    // could land completely off-screen with no way to reach it. An instant
    // scroll makes the measurement valid right away.
    el.scrollIntoView({ block: "center", behavior: "auto" });
    const place = () => {
      const r = el.getBoundingClientRect();
      const cardH = 210;
      const width = Math.min(320, window.innerWidth - 32);
      let top = r.bottom + 12;
      if (top + cardH > window.innerHeight) {
        top = Math.max(12, r.top - cardH - 12);
      }
      // Never let the card escape the viewport in either direction.
      top = Math.max(12, Math.min(top, window.innerHeight - cardH - 12));
      const left = Math.min(Math.max(16, r.left), window.innerWidth - width - 16);
      setPos({ top, left, width });
    };
    place();
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("resize", place);
      el.classList.remove("tour-highlight");
    };
  }, [idx, steps, onDone]);

  const last = idx >= steps.length - 1;
  const step = steps[idx];

  return (
    <div
      className="tour-card"
      role="dialog"
      aria-label={step.title}
      style={
        pos
          ? { top: pos.top, left: pos.left, width: pos.width }
          : { visibility: "hidden" }
      }
    >
      <div className="tour-step">
        {idx + 1} / {steps.length}
      </div>
      <h3>{step.title}</h3>
      <p>{step.body}</p>
      <div className="tour-actions">
        <button type="button" className="btn ghost small" onClick={onDone}>
          {t.tour.skip}
        </button>
        <div>
          {idx > 0 && (
            <button
              type="button"
              className="btn secondary small"
              onClick={() => setIdx(idx - 1)}
            >
              {t.tour.back}
            </button>
          )}
          <button
            type="button"
            className="btn small"
            onClick={() => (last ? onDone() : setIdx(idx + 1))}
          >
            {last ? t.tour.done : t.tour.next}
          </button>
        </div>
      </div>
    </div>
  );
}
