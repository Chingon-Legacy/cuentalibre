import { useState } from "react";
import { useLangState } from "../App";
import "../onboarding-polish.css";
import { businessTypes } from "../data/categories";
import { US_STATES } from "../data/us-states";
import { useLang, useStrings } from "../i18n";
import type { EntityType, Lang } from "../types";

interface Props {
  onDone: (
    lang: Lang,
    businessName: string,
    entityType: EntityType,
    typeId: string,
    stateCode: string
  ) => Promise<void>;
}

/**
 * First-run setup, in this order:
 *  1. Language — so every later step is already in their words.
 *  2. Organization kind — for-profit gets trade categories,
 *     nonprofit gets donation/revenue categories and the 990 helper.
 *  3. Business name — shown in the header and on invoices/receipts.
 *  4. Business type — loads the right bilingual category pack
 *     (for-profits only; nonprofits use the nonprofit pack).
 *  5. Business state — sets the default sales-tax rate on invoices
 *     (state base rate; the user can override it per invoice).
 */
export default function Onboarding({ onDone }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { lang: cur, setLang } = useLangState();
  const [step, setStep] = useState(0);
  const [entity, setEntity] = useState<EntityType>("forprofit");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("restaurant");
  const [stateCode, setStateCode] = useState("");
  const [celebrating, setCelebrating] = useState(false);
  const [setupError, setSetupError] = useState(false);

  const isNfp = entity === "nonprofit";
  // Step ids shown as dots: nonprofits skip the trade-type step.
  const dotSteps = isNfp ? [0, 1, 2, 4] : [0, 1, 2, 3, 4];

  // Final "Start" tap: celebrate briefly, then hand off to the app.
  // If saving the setup fails, come back with a friendly retry
  // instead of hanging on the celebration forever.
  const finish = () => {
    if (celebrating) return;
    setCelebrating(true);
    setSetupError(false);
    setTimeout(async () => {
      try {
        await onDone(cur, name.trim(), entity, isNfp ? "nonprofit" : selected, stateCode);
      } catch {
        setCelebrating(false);
        setSetupError(true);
      }
    }, 1600);
  };

  return (
    <div className="onboarding">
      <div className="brand-row">
        <span className="brand-left">
          <span className="brand-mark">CL</span> CuentaLibre
        </span>
        <div
          className="lang-toggle on-light"
          role="group"
          aria-label="Language / Idioma"
        >
          {(["en", "es"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              className={cur === l ? "active" : ""}
              onClick={() => setLang(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="steps-dots" aria-hidden="true">
        {dotSteps.map((i) => (
          <span key={i} className={i === step ? "active" : i < step ? "done" : ""} />
        ))}
      </div>

      {step === 0 && (
        <div className="onboard-step" key="step-0">
          <h1>{t.onboarding.langTitle}</h1>
          <p className="subtitle">{t.onboarding.langSub}</p>
          <div className="lang-pick">
            {(["en", "es"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                className={`lang-card${cur === l ? " selected" : ""}`}
                onClick={() => setLang(l)}
              >
                <span className="lang-big">{l === "en" ? "English" : "Español"}</span>
                <span className="lang-sub">
                  {l === "en" ? "Use CuentaLibre in English" : "Usar CuentaLibre en español"}
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="btn" onClick={() => setStep(1)}>
            {t.onboarding.next}
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="onboard-step" key="step-1">
          <h1>{t.onboarding.entityTitle}</h1>
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
                  {e === "forprofit" ? t.onboarding.entityForProfit : t.onboarding.entityNonprofit}
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
            <button type="button" className="btn secondary" onClick={() => setStep(0)}>
              {t.onboarding.back}
            </button>
            <button type="button" className="btn" onClick={() => setStep(2)}>
              {t.onboarding.next}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="onboard-step" key="step-2">
          <h1>{t.onboarding.nameTitle}</h1>
          <p className="subtitle">{t.onboarding.nameSub}</p>
          <div className="field" style={{ maxWidth: 420, margin: "0 auto" }}>
            <input
              type="text"
              value={name}
              autoFocus
              maxLength={80}
              placeholder={t.onboarding.namePh}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) setStep(isNfp ? 4 : 3);
              }}
            />
          </div>
          <div className="wizard-nav">
            <button type="button" className="btn secondary" onClick={() => setStep(1)}>
              {t.onboarding.back}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!name.trim()}
              onClick={() => setStep(isNfp ? 4 : 3)}
            >
              {t.onboarding.next}
            </button>
          </div>
        </div>
      )}

      {step === 3 && !isNfp && (
        <div className="onboard-step" key="step-3">
          <h1>{t.onboarding.bizTitle}</h1>
          <p className="subtitle">{t.onboarding.bizSub}</p>
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
            <button type="button" className="btn secondary" onClick={() => setStep(2)}>
              {t.onboarding.back}
            </button>
            <button type="button" className="btn" onClick={() => setStep(4)}>
              {t.onboarding.next}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="onboard-step" key="step-4">
          <h1>{t.onboarding.stateTitle}</h1>
          <p className="subtitle">{t.onboarding.stateSub}</p>
          <div className="field" style={{ maxWidth: 420, margin: "0 auto" }}>
            <select
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              aria-label={t.onboarding.stateTitle}
            >
              <option value="" disabled>
                {t.onboarding.statePh}
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
              onClick={() => setStep(isNfp ? 2 : 3)}
            >
              {t.onboarding.back}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!stateCode}
              onClick={finish}
            >
              {t.onboarding.start}
            </button>
          </div>
        </div>
      )}

      {setupError && !celebrating && (
        <div className="panel" role="alert">
          <p className="status-note">⚠️ {t.onboarding.setupFailed}</p>
          <div className="form-actions" style={{ justifyContent: "center" }}>
            <button type="button" className="btn" onClick={finish}>
              {t.onboarding.tryAgain}
            </button>
          </div>
        </div>
      )}

      {celebrating && (
        <div className="onboard-celebrate" role="status" aria-live="polite">
          <div className="celebrate-card">
            <div className="celebrate-emoji" aria-hidden="true">
              🎉
            </div>
            <h1>{t.onboarding.celebrateTitle}</h1>
            <p>{t.onboarding.celebrateSub}</p>
          </div>
        </div>
      )}
    </div>
  );
}
