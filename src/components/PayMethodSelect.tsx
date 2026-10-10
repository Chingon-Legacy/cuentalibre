import { useStrings } from "../i18n";
import type { PayMethod } from "../types";

const METHODS: PayMethod[] = ["cash", "card", "transfer", "check"];

/** Small "how was it paid?" dropdown for invoice/expense/bill forms. */
export default function PayMethodSelect({
  value,
  onChange,
  label,
}: {
  value: PayMethod | null;
  onChange: (v: PayMethod | null) => void;
  label?: string;
}) {
  const t = useStrings();
  return (
    <div className="field">
      <label>{label ?? t.paymethod.label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange((e.target.value as PayMethod) || null)}
      >
        <option value="">{t.paymethod.notSet}</option>
        {METHODS.map((m) => (
          <option key={m} value={m}>
            {t.paymethod[m]}
          </option>
        ))}
      </select>
    </div>
  );
}
