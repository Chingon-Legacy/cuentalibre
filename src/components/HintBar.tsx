import { useEffect, useState } from "react";
import { getSetting, setSetting } from "../db";

interface Props {
  id: string;
  text: string;
}

/**
 * A dismissible friendly hint bar: 💡 icon + one warm sentence + × button.
 * Dismissal persists via the settings store (`hintSeen:<id> = "1"`).
 */
export default function HintBar({ id, text }: Props) {
  // Start hidden; reveal only if the user hasn't dismissed this hint.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alive = true;
    getSetting(`hintSeen:${id}`)
      .then((v) => {
        if (alive) setVisible(v !== "1");
      })
      .catch(() => {
        if (alive) setVisible(true);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (!visible) return null;

  const dismiss = async () => {
    setVisible(false);
    try {
      await setSetting(`hintSeen:${id}`, "1");
    } catch {
      // The write failed, but the hint is already hidden for this session.
    }
  };

  return (
    <div
      role="note"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--amber-light)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "10px 12px",
        marginBottom: 16,
        fontSize: 14,
        lineHeight: 1.45,
        color: "var(--ink)",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 18, flexShrink: 0 }}>
        💡
      </span>
      <span style={{ flex: 1 }}>{text}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss hint"
        style={{
          flexShrink: 0,
          border: "none",
          background: "transparent",
          color: "var(--ink-faint)",
          fontSize: 18,
          lineHeight: 1,
          cursor: "pointer",
          padding: 4,
        }}
      >
        ×
      </button>
    </div>
  );
}
