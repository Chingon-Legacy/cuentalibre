import { fmtMoney, useLang, useStrings } from "../i18n";
import type { Service } from "../types";

/** "Pick a service" dropdown: choosing one fills the amount on invoice/quote forms. */
export default function ServicePicker({
  services,
  onPick,
}: {
  services: Service[];
  onPick: (s: Service) => void;
}) {
  const t = useStrings();
  const lang = useLang();
  if (services.length === 0) return null;
  return (
    <div className="field">
      <label>🏷️ {t.services.title}</label>
      <select
        value=""
        onChange={(e) => {
          const s = services.find((x) => String(x.id) === e.target.value);
          if (s) onPick(s);
        }}
        aria-label={t.services.pick}
      >
        <option value="">{t.services.pick}</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — {fmtMoney(s.price, lang)}
          </option>
        ))}
      </select>
    </div>
  );
}
