import { useState } from "react";
import { useStrings } from "../i18n";

/** Chingón Legacy donation page (PayPal Giving Fund). */
export const DONATE_URL =
  "https://www.paypal.com/donate?hosted_button_id=E7Y3X9D6Y6SK6";

/** Open the donation page in the system browser. */
export function openDonate(): void {
  window.open(DONATE_URL, "_blank", "noopener");
}

/**
 * Startup "support us" dialog. Shown on launch until the user checks
 * "Don't show this again". Fully bilingual, same as everything else.
 */
export default function SupportDialog({ onClose }: { onClose: () => void }) {
  const t = useStrings();
  const [hide, setHide] = useState(false);

  const close = () => {
    if (hide) {
      try {
        localStorage.setItem("cl-hide-support", "1");
      } catch {
        // Private browsing etc. — just don't remember it.
      }
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={close}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t.settings.supportTitle}
      >
        <div className="modal-pad">
          <h2 style={{ marginTop: 0 }}>❤ {t.settings.supportTitle}</h2>
          <p style={{ lineHeight: 1.6 }}>{t.settings.supportBody}</p>
          <label
            className="check-row"
            style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0" }}
          >
            <input
              type="checkbox"
              checked={hide}
              onChange={(e) => setHide(e.target.checked)}
            />
            <span>{t.settings.dontShowAgain}</span>
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                openDonate();
                close();
              }}
            >
              {t.settings.donate}
            </button>
            <button type="button" className="btn secondary" onClick={close}>
              {t.settings.maybeLater}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
