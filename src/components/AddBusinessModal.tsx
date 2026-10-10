import { useState } from "react";
import { useBiz } from "../App";
import { businessTypes } from "../data/categories";
import { US_STATES } from "../data/us-states";
import { useLang, useStrings } from "../i18n";
import type { EntityType } from "../types";

/**
 * Short "add another business" flow: entity → name → type → state.
 * Language is already chosen globally, so it's skipped here.
 * Nonprofits skip the trade-type step (they use the nonprofit pack).
 * On create, the app switches to the new business automatically.
 */
export default function AddBusinessModal({ onClose }: { onClose: () => void }) {
  const t = useStrings();
  const lang = useLang();
  const { addBusinessFlow } = useBiz();
  const [step, setStep] = useState(0);
  const [entity, setEntity] = useState<EntityType>("forprofit");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("freelancer");
  const [stateCode, setStateCode] = useState("");
  const [saving, setSaving] = useState(false);

  const isNfp = entity === "nonprofit";

  const create = async () => {
    if (saving || !name.trim() || !stateCode) return;
    setSaving(true);
    try {
      await addBusinessFlow(name.trim(), isNfp ? "nonprofit" : selected, stateCode, entity);
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
            {(isNfp ? [0, 1, 3] : [0, 1, 2, 3]).map((i) => (
              <span key={i} className={i === step ? "active" : i < step ? "done" : ""} />
            ))}
          </div>

          {step === 0 && (
            <>
              <h3>{t.onboarding.entityTitle}</h3>
              <p className="subtitle">{t.onboarding.entitySub}</p>
              <div className="lang-pick">
                {(["forprofit", "nonprofit"] as EntityType[]).map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`lang-card${entity === e ? " selected" : ""}`}
                    onClick={() => setEntity(e)}
                  >
                    <span className="lang-big">
                      {e === "forprofit"
                        ? t.onboarding.entityForProfit
                        : t.onboarding.entityNonprofit}
                    </span>
                    <span className="lang-sub">
                      {e === "forprofit"
                        ? t.onboarding.entityForProfitDesc
                        : t.onboarding.entityNonprofitDesc}
                    </span>
                  </button>
                ))}
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn secondary" onClick={onClose}>
                  {t.addbiz.cancel}
                </button>
                <button type="button" className="btn" onClick={() => setStep(1)}>
                  {t.addbiz.next}
                </button>
              </div>
            </>
          )}

          {step === 1 && (
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
                    if (e.key === "Enter" && name.trim()) setStep(isNfp ? 3 : 2);
                  }}
                />
              </div>
              <div className="wizard-nav">
                <button type="button" className="btn secondary" onClick={() => setStep(0)}>
                  {t.addbiz.back}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={!name.trim()}
                  onClick={() => setStep(isNfp ? 3 : 2)}
                >
                  {t.addbiz.next}
                </button>
              </div>
            </>
          )}

          {step === 2 && !isNfp && (
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
                <button type="button" className="btn secondary" onClick={() => setStep(1)}>
                  {t.addbiz.back}
                </button>
                <button type="button" className="btn" onClick={() => setStep(3)}>
                  {t.addbiz.next}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
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
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setStep(isNfp ? 1 : 2)}
                >
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
