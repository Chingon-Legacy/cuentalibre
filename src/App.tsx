import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LangProvider, useStrings, type Strings } from "./i18n";
import { getExpenses, getInvoices, getSetting, initDb, setSetting } from "./db";
import { getPack } from "./data/categories";
import type { CategoryPack } from "./data/categories/types";
import type { Expense, Invoice, Lang, Screen } from "./types";
import Onboarding from "./screens/Onboarding";
import Home from "./screens/Home";
import Invoices from "./screens/Invoices";
import Expenses from "./screens/Expenses";
import Reports from "./screens/Reports";
import Settings from "./screens/Settings";

/* ---------- shared contexts ---------- */

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangStateContext = createContext<LangState>({
  lang: "en",
  setLang: () => undefined,
});

export function useLangState(): LangState {
  return useContext(LangStateContext);
}

export interface BizState {
  biz: string;
  setBiz: (id: string) => void;
  pack: CategoryPack;
}

const BizContext = createContext<BizState>({
  biz: "freelancer",
  setBiz: () => undefined,
  pack: getPack("freelancer"),
});

export function useBiz(): BizState {
  return useContext(BizContext);
}

/* ---------- header / nav ---------- */

const NAV_ITEMS: { id: Screen; icon: string; label: (t: Strings) => string }[] = [
  { id: "home", icon: "🏠", label: (t) => t.nav.home },
  { id: "invoices", icon: "🧾", label: (t) => t.nav.invoices },
  { id: "expenses", icon: "💸", label: (t) => t.nav.expenses },
  { id: "reports", icon: "📊", label: (t) => t.nav.reports },
  { id: "settings", icon: "⚙️", label: (t) => t.nav.settings },
];

function LangToggle() {
  const { lang, setLang } = useLangState();
  return (
    <div className="lang-toggle" role="group" aria-label="Language / Idioma">
      {(["en", "es"] as Lang[]).map((l) => (
        <button
          key={l}
          className={lang === l ? "active" : ""}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function Shell({ setBiz }: { setBiz: (id: string) => void }) {
  const t = useStrings();
  const [screen, setScreen] = useState<Screen>("home");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [inv, exp] = await Promise.all([getInvoices(), getExpenses()]);
    setInvoices(inv);
    setExpenses(exp);
  }, []);

  useEffect(() => {
    initDb()
      .then(refresh)
      .then(() => getSetting("businessType"))
      .then((saved) => {
        // A restored backup may carry a business type — honor it.
        if (saved) setBiz(saved);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [refresh, setBiz]);

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">CL</span>
          <span>
            CuentaLibre
            <div className="tagline">{t.tagline}</div>
          </span>
        </div>
        <nav className="main-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-btn${screen === item.id ? " active" : ""}`}
              onClick={() => setScreen(item.id)}
            >
              {item.label(t)}
            </button>
          ))}
        </nav>
        <LangToggle />
      </header>

      <main>
        {ready && screen === "home" && (
          <Home invoices={invoices} expenses={expenses} go={setScreen} />
        )}
        {ready && screen === "invoices" && (
          <Invoices invoices={invoices} refresh={refresh} />
        )}
        {ready && screen === "expenses" && (
          <Expenses expenses={expenses} refresh={refresh} />
        )}
        {ready && screen === "reports" && (
          <Reports invoices={invoices} expenses={expenses} />
        )}
        {ready && screen === "settings" && <Settings refresh={refresh} />}
      </main>

      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={screen === item.id ? "active" : ""}
            onClick={() => setScreen(item.id)}
          >
            <span className="micon">{item.icon}</span>
            {item.label(t)}
          </button>
        ))}
      </nav>
    </>
  );
}

/* ---------- app root ---------- */

export default function App() {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("cl-lang");
    return saved === "es" ? "es" : "en";
  });
  const [biz, setBizState] = useState<string>(
    () => localStorage.getItem("cl-biz") ?? "freelancer"
  );
  const [onboarded, setOnboarded] = useState<boolean>(
    () => localStorage.getItem("cl-onboarded") === "1"
  );

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("cl-lang", l);
    document.documentElement.lang = l;
  }, []);

  const setBiz = useCallback((id: string) => {
    setBizState(id);
    localStorage.setItem("cl-biz", id);
    setSetting("businessType", id).catch(() => undefined);
  }, []);

  const pack = useMemo(() => getPack(biz), [biz]);

  const finishOnboarding = useCallback(
    (id: string) => {
      setBiz(id);
      localStorage.setItem("cl-onboarded", "1");
      setOnboarded(true);
    },
    [setBiz]
  );

  return (
    <LangStateContext.Provider value={{ lang, setLang }}>
      <LangProvider value={lang}>
        <BizContext.Provider value={{ biz, setBiz, pack }}>
          {!onboarded ? (
            <Onboarding onDone={finishOnboarding} />
          ) : (
            <Shell setBiz={setBiz} />
          )}
        </BizContext.Provider>
      </LangProvider>
    </LangStateContext.Provider>
  );
}
