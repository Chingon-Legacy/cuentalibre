import { useState } from "react";
import { useLangState } from "../App";
import { businessTypes } from "../data/categories";
import { useLang, useStrings } from "../i18n";
import type { Lang } from "../types";

interface Props {
  onDone: (lang: Lang, businessName: string, bizId: string) => void;
}

/**
 * First-run setup, in this order:
 *  1. Language — so every later step is already in their words.
 *  2. Business name — shown in the header and on invoices.
 *  3. Business type — loads the right bilingual category pack,
 *     which keeps their books organized long-term.
 */
export default function Onboarding({ onDone }: Props) {
  const t = useStrings();
  const lang = useLang();
  const { lang: cur, setLang } = useLangState();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("restaurant");

  const steps = [t.onboarding.langTitle, t.onboarding.nameTitle, t.onboarding.bizTitle];

  return (
    <div className="onboarding">
      <div className="brand-row">
        <span className="brand-mark">CL</span> CuentaLibre
      </div>

      <div className="steps-dots" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i === step ? "active" : i < step ? "done" : ""} />
        ))}
      </div>

      {step === 0 && (
        <>
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
        </>
      )}

      {step === 1 && (
        <>
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
                if (e.key === "Enter" && name.trim()) setStep(2);
              }}
            />
          </div>
          <div className="wizard-nav">
            <button type="button" className="btn secondary" onClick={() => setStep(0)}>
              {t.onboarding.back}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!name.trim()}
              onClick={() => setStep(2)}
            >
              {t.onboarding.next}
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1>{steps[2]}</h1>
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
            <button type="button" className="btn secondary" onClick={() => setStep(1)}>
              {t.onboarding.back}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => onDone(cur, name.trim(), selected)}
            >
              {t.onboarding.start}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
