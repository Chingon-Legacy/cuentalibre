import { useState } from "react";
import type { Update } from "@tauri-apps/plugin-updater";
import { useStrings } from "../i18n";
import { installAppUpdate } from "../updater";

interface Props {
  update: Update;
  onDone: () => void;
}

/**
 * Friendly "a new version is ready" dialog. Simple, with instructions:
 * ask first, show download progress, then tell the user to restart
 * (the Windows installer restarts the app itself; macOS/Linux need
 * a manual relaunch).
 */
export default function UpdateDialog({ update, onDone }: Props) {
  const t = useStrings();
  const [phase, setPhase] = useState<"ask" | "downloading" | "installed" | "failed">("ask");
  const [pct, setPct] = useState(0);

  const close = async () => {
    try {
      await update.close();
    } catch {
      // Already installed or closed — nothing to release.
    }
    onDone();
  };

  const startInstall = async () => {
    setPhase("downloading");
    try {
      await installAppUpdate(update, setPct);
      setPhase("installed");
    } catch {
      setPhase("failed");
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal"
        role="dialog"
        aria-label={t.updater.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-pad">
          {phase === "ask" && (
            <>
              <h2 style={{ marginTop: 0 }}>⬆️ {t.updater.title}</h2>
              <p style={{ lineHeight: 1.6 }}>
                {t.updater.body.replace("{version}", update.version)}
              </p>
              <div className="form-actions">
                <button type="button" className="btn" onClick={startInstall}>
                  {t.updater.updateNow}
                </button>
                <button type="button" className="btn secondary" onClick={close}>
                  {t.updater.later}
                </button>
              </div>
            </>
          )}
          {phase === "downloading" && (
            <>
              <h2 style={{ marginTop: 0 }}>⬆️ {t.updater.title}</h2>
              <p style={{ lineHeight: 1.6 }}>
                {t.updater.downloading.replace("{pct}", String(pct))}
              </p>
              <div
                style={{
                  height: 10,
                  borderRadius: 5,
                  background: "var(--border)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: "var(--blue)",
                    transition: "width 0.2s",
                  }}
                />
              </div>
            </>
          )}
          {phase === "installed" && (
            <>
              <h2 style={{ marginTop: 0 }}>✅ {t.updater.installed}</h2>
              <p style={{ lineHeight: 1.6 }}>{t.updater.restartNote}</p>
              <div className="form-actions">
                <button type="button" className="btn" onClick={close}>
                  {t.updater.close}
                </button>
              </div>
            </>
          )}
          {phase === "failed" && (
            <>
              <h2 style={{ marginTop: 0 }}>⚠️ {t.updater.failed}</h2>
              <p style={{ lineHeight: 1.6 }}>{t.updater.failedNote}</p>
              <div className="form-actions">
                <button type="button" className="btn" onClick={close}>
                  {t.updater.close}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
