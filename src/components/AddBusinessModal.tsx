import { useState } from "react";
import { useBiz } from "../App";
import { businessTypes } from "../data/categories";
import { US_STATES } from "../data/us-states";
import { useLang, useStrings } from "../i18n";

/**
 * Short "add another business" flow: name → type → state.
 * Language is already chosen globally, so it's skipped here.
 * On create, the app switches to the new business automatically.
 */
export default function AddBusinessModal({ onClose }: { onClose: () => void }) {
  const t = useStrings();
  const lang = useLang();
  const { addBusinessFlow } = useBiz();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("freelancer");
  const [stateCode, setStateCode] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (saving || !name.trim() || !stateCode) return;
    setSaving(true);
    try {
      await addBusinessFlow(name.trim(), selected, stateCode);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t.addbiz.title}>
        <div className="modal-pad">
          <div className="toolbar">
            <h2 style={{ margin: 0 }}>🏢 {t.addbiz.title}</h2>
            <button type="button" className="btn small secondary" onClick={onClose}>
              ✕ {t.addbiz.cancel}
            </button>
          </div>

          <div className="steps-dots" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i === step ? "active" : i < step ? "done" : ""} />
            ))}
          </div>

          {step === 0 && (
            <>
              <h3>{t.addbiz.nameTitle}</h3>
              <p className="subtitle">{t.addbiz.nameSub}</p>
              <div className="field" style={{ maxWidth: 420 }}>
                <input
                  type="text"
                  value={name}
                  autoFocus
                  maxLength={80}
                  placeholder={t.addbiz.namePh}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) setStep(1);
                  }}
                />
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn secondary" onClick={onClose}>
                  {t.addbiz.cancel}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!name.trim()}
                  onClick={() => setStep(1)}
                >
                  {t.addbiz.next}
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h3>{t.addbiz.bizTitle}</h3>
              <p className="subtitle">{t.addbiz.bizSub}</p>
              <div className="biz-grid">
                {businessTypes.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`biz-card${selected === b.id ? " selected" : ""}`}
                    onClick={() => setSelected(b.id)}
                  >
                    <span className="icon">{b.icon}</span>
                    {lang === "es" ? b.es : b.en}
                  </button>
                ))}
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn secondary" onClick={() => setStep(0)}>
                  {t.addbiz.back}
                </button>
                <button type="button" className="btn" onClick={() => setStep(2)}>
                  {t.addbiz.next}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h3>{t.addbiz.stateTitle}</h3>
              <p className="subtitle">{t.addbiz.stateSub}</p>
              <div className="field" style={{ maxWidth: 420 }}>
                <select
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  aria-label={t.addbiz.stateTitle}
                >
                  <option value="" disabled>
                    {t.addbiz.statePh}
                  </option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn secondary" onClick={() => setStep(1)}>
                  {t.addbiz.back}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!stateCode || saving}
                  onClick={create}
                >
                  {t.addbiz.create}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
