import { useEffect, useRef } from "react";
import type { Screen } from "../types";

export interface MoreMenuItem {
  id: Screen;
  icon: string;
  label: string;
  desc: string;
}

interface MoreMenuProps {
  /** Tiles to show, in display order. */
  items: MoreMenuItem[];
  /** The screen the user is currently on (gets the active state). */
  current: Screen;
  /** Accessible name for the panel ("More" / "Más"). */
  title: string;
  /** "dropdown" = desktop panel under the header, "sheet" = mobile bottom sheet. */
  variant: "dropdown" | "sheet";
  /** Navigate and close. */
  onSelect: (id: Screen) => void;
  /** Close without navigating (outside click / Escape / backdrop tap). */
  onClose: () => void;
}

/**
 * The "More" menu: a grid of friendly tiles (icon + label + one warm
 * line) for the screens that don't fit in the primary nav. Works as a
 * desktop dropdown panel or a mobile bottom sheet.
 */
export default function MoreMenu({
  items,
  current,
  title,
  variant,
  onSelect,
  onClose,
}: MoreMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape in both presentations.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock the page behind the mobile sheet so the backdrop always covers.
  useEffect(() => {
    if (variant !== "sheet") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [variant]);

  const tiles = (
    <div className="more-grid" role="menu" aria-label={title}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className={`more-tile${current === item.id ? " active" : ""}`}
          onClick={() => onSelect(item.id)}
        >
          <span className="tile-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="tile-text">
            <span className="tile-label">{item.label}</span>
            <span className="tile-desc">{item.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );

  if (variant === "sheet") {
    return (
      <div className="more-backdrop" onClick={onClose}>
        <div
          ref={panelRef}
          className="more-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="more-grabber" aria-hidden="true" />
          <div className="more-sheet-title">{title}</div>
          {tiles}
        </div>
      </div>
    );
  }

  return (
    <div ref={panelRef} className="more-panel">
      {tiles}
    </div>
  );
}
