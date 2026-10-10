import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LangProvider, useStrings, type Strings } from "./i18n";
import {
  getBills,
  getContractorPayments,
  getContractors,
  getExpenses,
  getInvoices,
  getQuotes,
  getSetting,
  initDb,
  setSetting,
  generateRecurringInvoices,
} from "./db";
import { getPack } from "./data/categories";
import type { CategoryPack } from "./data/categories/types";
import type {
  Bill,
  Contractor,
  ContractorPayment,
  Expense,
  Invoice,
  Lang,
  Quote,
  Screen,
} from "./types";
import Onboarding from "./screens/Onboarding";
import Home from "./screens/Home";
import Invoices from "./screens/Invoices";
import Quotes from "./screens/Quotes";
import Bills from "./screens/Bills";
import Expenses from "./screens/Expenses";
import Customers from "./screens/Customers";
import Contractors from "./screens/Contractors";
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
  stateCode: string;
  setStateCode: (c: string) => void;
}

const BizContext = createContext<BizState>({
  biz: "freelancer",
  setBiz: () => undefined,
  pack: getPack("freelancer"),
  stateCode: "",
  setStateCode: () => undefined,
});

export function useBiz(): BizState {
  return useContext(BizContext);
}

interface BizNameState {
  bizName: string;
  setBizName: (n: string) => void;
}

const BizNameContext = createContext<BizNameState>({
  bizName: "",
  setBizName: () => undefined,
});

export function useBizName(): BizNameState {
  return useContext(BizNameContext);
}

/* ---------- header / nav ---------- */

const NAV_ITEMS: { id: Screen; icon: string; label: (t: Strings) => string }[] = [
  { id: "home", icon: "🏠", label: (t) => t.nav.home },
  { id: "invoices", icon: "🧾", label: (t) => t.nav.invoices },
  { id: "quotes", icon: "📝", label: (t) => t.nav.quotes },
  { id: "bills", icon: "📄", label: (t) => t.nav.bills },
  { id: "expenses", icon: "💸", label: (t) => t.nav.expenses },
  { id: "customers", icon: "👥", label: (t) => t.nav.customers },
  { id: "contractors", icon: "🤝", label: (t) => t.nav.contractors },
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
  const { bizName, setBizName } = useBizName();
  const { setStateCode } = useBiz();
  const [screen, setScreen] = useState<Screen>("home");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorPayments, setContractorPayments] = useState<ContractorPayment[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [inv, exp, bl, qu, co, cp] = await Promise.all([
      getInvoices(),
      getExpenses(),
      getBills(),
      getQuotes(),
      getContractors(),
      getContractorPayments(),
    ]);
    setInvoices(inv);
    setExpenses(exp);
    setBills(bl);
    setQuotes(qu);
    setContractors(co);
    setContractorPayments(cp);
  }, []);

  useEffect(() => {
    initDb()
      .then(() => generateRecurringInvoices())
      .then(refresh)
      .then(() => getSetting("businessType"))
      .then((saved) => {
        // A restored backup may carry a business type — honor it.
        if (saved) setBiz(saved);
        return getSetting("businessName");
      })
      .then((savedName) => {
        if (savedName) setBizName(savedName);
        return getSetting("businessState");
      })
      .then((savedState) => {
        // A restored backup may carry a business state — honor it.
        if (savedState) setStateCode(savedState);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [refresh, setBiz, setBizName, setStateCode]);

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">CL</span>
          <span>
            {bizName || "CuentaLibre"}
            <div className="tagline">{bizName ? "CuentaLibre" : t.tagline}</div>
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
          <Home invoices={invoices} expenses={expenses} bills={bills} go={setScreen} />
        )}
        {ready && screen === "invoices" && (
          <Invoices invoices={invoices} refresh={refresh} />
        )}
        {ready && screen === "quotes" && (
          <Quotes quotes={quotes} refresh={refresh} />
        )}
        {ready && screen === "bills" && (
          <Bills bills={bills} refresh={refresh} />
        )}
        {ready && screen === "expenses" && (
          <Expenses expenses={expenses} refresh={refresh} />
        )}
        {ready && screen === "customers" && <Customers invoices={invoices} />}
        {ready && screen === "contractors" && (
          <Contractors
            contractors={contractors}
            payments={contractorPayments}
            refresh={refresh}
          />
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
  const [bizName, setBizNameState] = useState<string>(
    () => localStorage.getItem("cl-bizname") ?? ""
  );
  const [stateCode, setStateCodeState] = useState<string>(
    () => localStorage.getItem("cl-bizstate") ?? ""
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

  const setBizName = useCallback((n: string) => {
    setBizNameState(n);
    localStorage.setItem("cl-bizname", n);
    setSetting("businessName", n).catch(() => undefined);
  }, []);

  const setStateCode = useCallback((c: string) => {
    setStateCodeState(c);
    localStorage.setItem("cl-bizstate", c);
    setSetting("businessState", c).catch(() => undefined);
  }, []);

  const pack = useMemo(() => getPack(biz), [biz]);

  const finishOnboarding = useCallback(
    (l: Lang, name: string, id: string, sc: string) => {
      setLang(l);
      setBizName(name);
      setBiz(id);
      setStateCode(sc);
      localStorage.setItem("cl-onboarded", "1");
      setOnboarded(true);
    },
    [setLang, setBizName, setBiz, setStateCode]
  );

  return (
    <LangStateContext.Provider value={{ lang, setLang }}>
      <LangProvider value={lang}>
        <BizContext.Provider value={{ biz, setBiz, pack, stateCode, setStateCode }}>
          <BizNameContext.Provider value={{ bizName, setBizName }}>
          {!onboarded ? (
            <Onboarding onDone={finishOnboarding} />
          ) : (
            <Shell setBiz={setBiz} />
          )}
          </BizNameContext.Provider>
        </BizContext.Provider>
      </LangProvider>
    </LangStateContext.Provider>
  );
}
