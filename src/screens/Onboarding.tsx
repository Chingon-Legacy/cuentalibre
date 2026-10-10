import { useState } from "react";
import { businessTypes } from "../data/categories";
import { useLang, useStrings } from "../i18n";

export default function Onboarding({ onDone }: { onDone: (id: string) => void }) {
  const t = useStrings();
  const lang = useLang();
  const [selected, setSelected] = useState("restaurant");

  return (
    <div className="onboarding">
      <div className="brand-row">
        <span className="brand-mark">CL</span> CuentaLibre
      </div>
      <h1>{t.onboarding.title}</h1>
      <p className="subtitle">{t.onboarding.subtitle}</p>
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
      <button type="button" className="btn" onClick={() => onDone(selected)}>
        {t.onboarding.start}
      </button>
    </div>
  );
}
