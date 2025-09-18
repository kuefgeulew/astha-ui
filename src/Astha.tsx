import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Share2,
  SendHorizontal,
  Receipt,
  Landmark,
  ShieldCheck,
  PlaneTakeoff,
  KeyRound,
  MoreHorizontal,
  ListChecks,
  Users,
  Settings,
  FileText,
  CreditCard as CreditCardIcon,
  BarChart2,
  Percent,
  Palette,
  GripVertical,
  Check,
  X,
  Pencil,
  Flame,
} from "lucide-react";

import EduflexScreen from "./screens/EduflexScreen";
import ForeignDashboard from "./screens/ForeignDashboard";
import VirtualCardsScreen from "./screens/VirtualCardsScreen";
import CashbackRewardsScreen from "./screens/CashbackRewardsScreen";
import EndorsementScreen from "./screens/EndorsementScreen";
import ThemeOverlay from "./screens/theme/ThemeOverlay";
import InsuranceScreen from "./screens/InsuranceScreen";

// ⬇️ FAB — shown only on Home
import FloatingFabDock from "./components/FloatingFabDock";

/* ======================== Theme — read astha_theme_v1 ======================== */

type ThemeLS = {
  primary: string;
  surface: "solid" | "glass";
  density: "comfortable" | "compact" | "spacious";
  radius: "md" | "xl" | "2xl";
  wallpaper:
    | "none"
    | "blue"
    | "sunset"
    | "emerald"
    | "charcoal"
    | "royal"
    | "aqua"
    | "rose"
    | "slate";
  actionPanel?: { from: string; to: string; linkedToPrimary?: boolean };
  pack?: string | null;
};
const THEME_LS_KEY = "astha_theme_v1";

const RADIUS_PX: Record<NonNullable<ThemeLS["radius"]>, number> = {
  md: 14,
  xl: 20,
  "2xl": 28,
};

function loadTheme(): ThemeLS {
  const base: ThemeLS = {
    primary: "#0B63B6",
    surface: "solid",
    density: "comfortable",
    radius: "2xl",
    wallpaper: "blue",
    actionPanel: { from: "#F6C34C", to: "#EA9E0C", linkedToPrimary: false },
    pack: null,
  };
  try {
    const raw = localStorage.getItem(THEME_LS_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<ThemeLS>;
    const oldFrom = localStorage.getItem("astha-actions-from") || undefined;
    const oldTo = localStorage.getItem("astha-actions-to") || undefined;
    return {
      ...base,
      ...parsed,
      actionPanel: {
        ...base.actionPanel!,
        ...(parsed.actionPanel ?? {}),
        ...(oldFrom || oldTo
          ? { from: oldFrom ?? base.actionPanel!.from, to: oldTo ?? base.actionPanel!.to }
          : {}),
      },
    };
  } catch {
    return base;
  }
}

function wallpaperBg(w: NonNullable<ThemeLS["wallpaper"]>, primary: string) {
  switch (w) {
    case "none":
    case "blue":
      return `linear-gradient(180deg, ${primary} 0%, #0A4F90 100%)`;
    case "sunset":
      return "linear-gradient(180deg, #F59E0B 0%, #EA580C 60%, #7C2D12 100%)";
    case "emerald":
      return "linear-gradient(180deg, #10B981 0%, #059669 60%, #064E3B 100%)";
    case "charcoal":
      return "linear-gradient(180deg, #1F2937 0%, #111827 100%)";
    case "royal":
      return "linear-gradient(180deg, #4C35B3 0%, #2A186F 100%)";
    case "aqua":
      return "linear-gradient(180deg, #0EA5E9 0%, #0369A1 100%)";
    case "rose":
      return "linear-gradient(180deg, #E11D48 0%, #9F1239 100%)";
    case "slate":
      return "linear-gradient(180deg, #475569 0%, #0F172A 100%)";
    default:
      return `linear-gradient(180deg, ${primary} 0%, #0A4F90 100%)`;
  }
}

/* ============================ Component start ============================ */

const DISPLAY_NAME = "Nazia Haque";
const PROFILE_ID = "11RxHel4R4ivzXL70DyE5fhnR2KIc_PgA";

const PROFILE_SOURCES = [
  `https://drive.google.com/uc?export=view&id=${PROFILE_ID}`,
  `https://lh3.googleusercontent.com/d/${PROFILE_ID}=s256`,
  `https://drive.google.com/thumbnail?id=${PROFILE_ID}&sz=w256`,
];

type Screen =
  | "home"
  | "foreign"
  | "virtual"
  | "insurance"
  | "endorsement"
  | "eduflex"
  | "rewards";

type Phase = "splash" | "login" | "app";

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

function FailoverImg({
  sources,
  alt,
  className,
}: {
  sources: string[];
  alt: string;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const src = sources[i] || "";
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        if (i < sources.length - 1) setI((x) => x + 1);
      }}
    />
  );
}

const DRAWER_ITEMS = [
  { icon: Users, label: "Home" },
  { icon: Landmark, label: "Products" },
  { icon: CreditCardIcon, label: "Apply for New Product" },
  { icon: FileText, label: "Statements & Certificates" },
  { icon: SendHorizontal, label: "Transfers" },
  { icon: ListChecks, label: "Set Standing Instruction" },
  { icon: Receipt, label: "Bills & Card Payments" },
  { icon: Users, label: "Beneficiary Management" },
  { icon: Search, label: "Transactions" },
  { icon: Settings, label: "Transfer Limit" },
  { icon: Settings, label: "Services" },
  { icon: Settings, label: "User profile/ Settings" },
  { icon: Users, label: "Refer Astha" },
  { icon: MoreHorizontal, label: "Others" },
];

function Drawer({
  open,
  onClose,
  lastLogin,
  lastFailure,
}: {
  open: boolean;
  onClose: () => void;
  lastLogin: string;
  lastFailure?: string;
}) {
  return (
    <>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm bg-white shadow-2xl">
            <div className="relative h-44 bg-gradient-to-b from-blue-600 to-blue-700 px-6 pt-8 text-white">
              <div className="flex items-center gap-3">
                <FailoverImg
                  sources={PROFILE_SOURCES}
                  alt="Profile"
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white/50"
                />
                <div>
                  <div className="text-lg font-semibold leading-tight">
                    {DISPLAY_NAME}
                  </div>
                  <div className="mt-1 text-[11px] text-white/80">
                    Last login: {lastLogin}
                  </div>
                  <div className="text-[11px] text-white/70">
                    Last failure: {lastFailure || "—"}
                  </div>
                </div>
              </div>
            </div>
            <div className="h-[calc(100vh-11rem)] overflow-y-auto p-2">
              {DRAWER_ITEMS.map((item, idx) => (
                <button
                  key={idx}
                  className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-[15px] hover:bg-neutral-100"
                >
                  <item.icon className="h-5 w-5 text-blue-600" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </aside>
        </>
      )}
    </>
  );
}

/* ====================== Splash & Login (visual-only) ====================== */

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 grid place-items-center bg-white">
      <div className="text-center">
        <div className="mx-auto grid h-28 w-28 place-items-center rounded-2xl bg-blue-600 shadow-lg">
          <div className="h-20 w-20 rounded-xl bg-white/95" />
        </div>
        <div className="mt-4 text-xl font-semibold text-slate-800">
          BRAC Bank PLC
        </div>
        <div className="text-blue-700/90">Bank Smart</div>
        <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5">Integrity</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5">Customer Focus</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5">Innovation</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5">Inclusiveness</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-8 left-6 h-24 w-24 rotate-12 rounded-2xl border border-blue-200" />
        <div className="absolute bottom-10 right-10 h-16 w-16 -rotate-12 rounded-xl border border-rose-200" />
        <div className="absolute bottom-4 right-28 h-10 w-10 rotate-6 rounded-xl border border-amber-200" />
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [bn, setBn] = useState(false);

  return (
    <div className="min-h-screen w-full bg-neutral-50">
      <div className="mx-auto max-w-md px-5 pb-16 pt-10">
        {/* Logo + lang */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-col items-center gap-2">
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-blue-600 shadow-lg">
              <div className="h-14 w-14 rounded-xl bg-white/95" />
            </div>
            <div className="text-blue-700">Bank Smart</div>
            <div className="text-[10px] text-slate-400">vP7.7</div>
          </div>
          <button
            className="rounded-full border px-3 py-1 text-sm"
            onClick={() => setBn((s) => !s)}
          >
            {bn ? "EN" : "বাংলা"}
          </button>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="mb-4 text-center text-2xl font-bold">
            Login to <span className="text-blue-700">BRAC Bank Astha</span>
          </div>

        <label className="mb-1 block text-sm text-slate-600">Username</label>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="mb-3 w-full rounded-xl border px-3 py-2"
            placeholder="Enter Username"
          />

          <label className="mb-1 block text-sm text-slate-600">Password</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="mb-4 w-full rounded-xl border px-3 py-2"
            placeholder="Enter Password"
          />

          <div className="mb-4 flex items-center justify-between text-xs">
            <a className="text-blue-700">Forgot Username?</a>
            <a className="text-blue-700">Forgot Password?</a>
          </div>

          <button
            className="w-full rounded-full bg-blue-700 py-3 text-white"
            onClick={() => {
              localStorage.setItem("astha_authed", "1");
              onLogin();
            }}
          >
            LOGIN
          </button>
        </div>

        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md rounded-t-3xl bg-amber-400 px-6 py-4 text-center text-sm text-slate-900 shadow-lg">
          <div className="grid grid-cols-3 gap-3">
            <div>ATM/Branch Near Me</div>
            <div>Offers Near Me</div>
            <div>Contact us</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====================== Root App ====================== */
export default function Astha() {
  const [phase, setPhase] = useState<Phase>(() =>
    localStorage.getItem("astha_authed") === "1" ? "app" : "splash"
  );
  const [drawer, setDrawer] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [tab, setTab] =
    useState<"Accounts" | "FDR/DPS" | "Credit Card" | "Loans">("Accounts");
  const [nickname, setNickname] = useState<string>(
    () => localStorage.getItem("astha_nickname") || "gloryhunter23"
  );

  // THEME state (from localStorage)
  const [theme, setTheme] = useState<ThemeLS>(() => loadTheme());
  const [showTheme, setShowTheme] = useState(false);

  // expose CSS variables for easy theming inside the phone frame
  const frameStyle = useMemo(
    () =>
      ({
        ["--bb-primary" as any]: theme.primary,
        ["--bb-card-radius" as any]: `${RADIUS_PX[theme.radius]}px`,
      } as React.CSSProperties),
    [theme]
  );

  // Re-sync theme when storage changes
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_LS_KEY || e.key === "astha-actions-from" || e.key === "astha-actions-to") {
        setTheme(loadTheme());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const formatNow = () =>
    new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "medium",
      hour12: true,
      timeZone: "Asia/Dhaka",
    }).format(new Date());

  const [lastLogin, setLastLogin] = useState<string>(
    () => localStorage.getItem("astha_last_login") || formatNow()
  );
  const [lastFailure] = useState<string | undefined>(
    () => localStorage.getItem("astha_last_fail") || undefined
  );

  useEffect(() => {
    if (phase === "splash") {
      const t = setTimeout(() => {
        setPhase(localStorage.getItem("astha_authed") === "1" ? "app" : "login");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    localStorage.setItem("astha_nickname", nickname);
  }, [nickname]);

  useEffect(() => {
    if (phase === "app") {
      const now = formatNow();
      setLastLogin(now);
      localStorage.setItem("astha_last_login", now);
    }
  }, [phase]);

  /* ======================= Shortcuts (Action grid) ======================= */

  const DEFAULT_ACTIONS = useMemo(
    () =>
      ([
        { label: "Payments", icon: Receipt, isNew: false },
        { label: "Transfers", icon: SendHorizontal, isNew: false },
        { label: "Foreign Txn", icon: BarChart2, isNew: true },
        { label: "Travel Insurance", icon: PlaneTakeoff, isNew: true },
        { label: "Endorsement", icon: ShieldCheck, isNew: true },
        { label: "Virtual Cards", icon: KeyRound, isNew: true },
        { label: "Eduflex", icon: Landmark, isNew: true },
        { label: "Rewards & Cashback", icon: Percent, isNew: true },
      ] as const).map((x) => ({ ...x })),
    []
  );

  type ActionItem = (typeof DEFAULT_ACTIONS)[number];
  const SHORTCUTS_KEY = "astha_shortcuts_v1";

  const [actions, setActions] = useState<ActionItem[]>(() => {
    const raw = localStorage.getItem(SHORTCUTS_KEY);
    if (!raw) return DEFAULT_ACTIONS;
    try {
      const labels: string[] = JSON.parse(raw);
      const map = new Map(DEFAULT_ACTIONS.map((a) => [a.label, a]));
      return labels.map((l) => map.get(l)!).filter(Boolean);
    } catch {
      return DEFAULT_ACTIONS;
    }
  });

  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<ActionItem[] | null>(null);
  const dragIndex = useRef<number | null>(null);

  const list = editMode && draft ? draft : actions;

  function startEdit() {
    setDraft(actions.slice());
    setEditMode(true);
  }
  function cancelEdit() {
    setDraft(null);
    setEditMode(false);
  }
  function confirmEdit() {
    if (!draft) return;
    setActions(draft);
    localStorage.setItem(
      SHORTCUTS_KEY,
      JSON.stringify(draft.map((a) => a.label))
    );
    setDraft(null);
    setEditMode(false);
  }

  function onDragStart(i: number) {
    dragIndex.current = i;
  }
  function onDragOver(e: React.DragEvent, overIndex: number) {
    e.preventDefault();
    if (!draft) return;
    const from = dragIndex.current;
    if (from == null || from === overIndex) return;
    const next = draft.slice();
    const [moved] = next.splice(from, 1);
    next.splice(overIndex, 0, moved);
    dragIndex.current = overIndex;
    setDraft(next);
  }

  const handleAction = (label: string) => {
    if (editMode) return;
    if (label === "Foreign Txn") setScreen("foreign");
    if (label === "Virtual Cards") setScreen("virtual");
    if (label === "Travel Insurance") setScreen("insurance");
    if (label === "Endorsement") setScreen("endorsement");
    if (label === "Eduflex") setScreen("eduflex");
    if (label === "Rewards & Cashback") setScreen("rewards");
  };

  if (phase === "splash") return <SplashScreen onDone={() => setPhase("login")} />;
  if (phase === "login") return <LoginScreen onLogin={() => setPhase("app")} />;

  const Header = (
    <>
      <header className="relative z-10 mt-1 flex items-center justify-between px-4 pt-4 text-white">
        <div className="flex items-center gap-2">
          <button
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full p-2 hover:bg-white/10" aria-label="Search">
            <Search className="h-6 w-6" />
          </button>
          {/* THEME BUTTON */}
          <button
            className="flex items-center gap-1 rounded-full px-3 py-1 hover:bg-white/10"
            aria-label="Customize theme"
            onClick={() => setShowTheme(true)}
            title="Customize theme"
          >
            <Palette className="h-5 w-5" />
            <span className="text-sm leading-none">Theme</span>
          </button>
          <button className="rounded-full p-2 hover:bg-white/10" aria-label="Notifications">
            <Bell className="h-6 w-6" />
          </button>
          <button
            className="rounded-full p-2 hover:bg-white/10"
            aria-label="Power"
            onClick={() => {
              localStorage.removeItem("astha_authed");
              setPhase("login");
            }}
            title="Logout"
          >
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Welcome + Streak button row */}
      <div className="relative z-10 mt-4 flex items-center justify-between px-6 text-white">
        <div className="flex items-center gap-3">
          {/* clicking the avatar opens Profile QR overlay */}
          <button
            onClick={() => { location.hash = "#profileqr"; }}
            className="rounded-full ring-2 ring-white/70"
            aria-label="Open My QR & ID"
            title="My QR & ID"
          >
            <FailoverImg
              sources={PROFILE_SOURCES}
              alt="Profile"
              className="h-10 w-10 rounded-full object-cover"
            />
          </button>
          <div>
            <div className="text-sm text-white/90">Welcome</div>
            <div className="text-xl font-semibold">Nazia Haque</div>
            <button className="text-sm text-blue-100 underline">View Profile</button>
          </div>
        </div>

        {/* Streak pill (opens StreakOverlay via hash) */}
        <button
          onClick={() => {
            location.hash = "#streak";
          }}
          className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-slate-900 shadow hover:bg-amber-300"
          title="View your Astha streak"
        >
          <Flame className="h-4 w-4" />
          <span className="text-sm font-medium">Streak</span>
        </button>
      </div>
    </>
  );

  const cardRadius = `var(--bb-card-radius, 28px)`;
  const densePad =
    theme.density === "compact" ? "pt-6" : theme.density === "spacious" ? "pt-10" : "pt-8";

  const actionFrom =
    theme.actionPanel?.from ??
    localStorage.getItem("astha-actions-from") ??
    "#F6C34C";
  const actionTo =
    theme.actionPanel?.to ??
    localStorage.getItem("astha-actions-to") ??
    "#EA9E0C";

  const HomeScreen = (
    <>
      <div className="relative z-10 mt-3 flex gap-2 px-4">
        {["Accounts", "FDR/DPS", "Credit Card", "Loans"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={classNames(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              tab === t
                ? "bg-white text-blue-700 shadow"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <main className="relative z-10 mt-2 px-6">
        <div
          className="relative mx-auto w-[92%] px-5 pb-4 pt-5 shadow-xl"
          style={{
            backgroundColor: theme.surface === "solid" ? "#fff" : "rgba(255,255,255,0.85)",
            backdropFilter: theme.surface === "glass" ? ("blur(8px)" as any) : undefined,
            borderRadius: cardRadius as any,
          }}
        >
          {/* Active ribbon */}
          <div className="absolute -right-2 top-6 rotate-45">
            <div className="bg-emerald-500 px-8 py-1 text-[10px] tracking-wider text-white shadow-lg">
              Active
            </div>
          </div>

          <div className="text-slate-700">
            <div className="text-[15px] font-semibold tracking-wide">
              SAVINGS ACCOUNT STAFF
            </div>
            <div className="mt-1 text-xs text-slate-500">1074165690001</div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-500">Available Balance</div>
              <div className="mt-1 text-3xl font-bold text-emerald-600">
                171,155.00{" "}
                <span className="ml-1 align-middle text-base font-medium text-slate-500">
                  BDT
                </span>
              </div>
            </div>
            <button
              aria-label="Share"
              className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <div className="text-sm font-black tracking-widest text-slate-700">
              BRAC BANK
            </div>
          </div>
        </div>
      </main>

      {/* Action grid — editable / re-orderable */}
      <div className="mt-8 px-4 pb-6">
        <div
          className={classNames(
            "relative mx-auto shadow-2xl ring-1 ring-black/5",
            densePad
          )}
          style={{
            borderRadius: cardRadius as any,
            background: `linear-gradient(135deg, ${actionFrom}, ${actionTo})`,
            paddingLeft: 20,
            paddingRight: 20,
            paddingBottom: 20,
          }}
        >
          {/* Top-right edit toggles */}
          <div className="absolute right-3 top-3 flex items-center gap-2">
            {!editMode ? (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-800 shadow hover:bg-white"
                title="Reorder shortcuts"
              >
                <Pencil className="h-3.5 w-3.5" /> Customize
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={confirmEdit}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow hover:bg-emerald-700"
                  title="Confirm"
                >
                  <Check className="h-3.5 w-3.5" /> Confirm
                </button>
                <button
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-800 shadow hover:bg-white"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-5">
            {list.map(({ icon: Icon, label, isNew }, idx) => (
              <div key={label}>
                <button
                  onClick={() => handleAction(label)}
                  className={classNames(
                    "group relative flex flex-col items-center gap-2 rounded-2xl p-2 transition",
                    editMode
                      ? "cursor-grab bg-amber-300/40 ring-1 ring-white/40"
                      : "hover:bg-amber-300/60"
                  )}
                  draggable={editMode}
                  onDragStart={() => onDragStart(idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  aria-label={label}
                >
                  <div
                    className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow"
                    style={{ borderRadius: `calc(${cardRadius} - 8px)` }}
                  >
                    <Icon className="h-6 w-6 text-slate-700" />
                  </div>
                  {isNew && !editMode && (
                    <span className="absolute -top-1 right-2 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow">
                      NEW
                    </span>
                  )}
                  <div className="relative text-center text-[11px] leading-tight text-slate-800">
                    {label}
                  </div>

                  {editMode && (
                    <div className="absolute -top-1 left-1 text-slate-600">
                      <GripVertical className="h-4 w-4 opacity-80" />
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const isWide = screen === "rewards";

  return (
    <div className="min-h-screen w-full bg-neutral-100 py-8">
      <div
        className={classNames(
          "relative mx-auto max-w-full overflow-hidden border border-black/10 shadow-2xl",
          isWide ? "h-[860px] w-[1200px]" : "h-[830px] w-[420px]"
        )}
        style={{
          borderRadius: "36px",
          backgroundImage: wallpaperBg(theme.wallpaper || "blue", theme.primary),
        }}
      >
        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          lastLogin={lastLogin}
          lastFailure={lastFailure}
        />

        {/* apply CSS vars for children */}
        <div style={frameStyle} className="h-full w-full">
          {Header}
          {screen === "home" && HomeScreen}

          {screen === "foreign" && (
            <div className="relative z-10 mt-2 h-[780px] overflow-y-auto">
              <button
                onClick={() => setScreen("home")}
                className="m-4 text-white/90 underline"
              >
                &lt; Back
              </button>
              <ForeignDashboard nickname={nickname} setNickname={setNickname} />
            </div>
          )}

          {screen === "virtual" && (
            <div className="relative z-10 mt-2 h-[780px] overflow-y-auto">
              <VirtualCardsScreen onBack={() => setScreen("home")} />
            </div>
          )}

          {screen === "insurance" && <InsuranceScreen onBack={() => setScreen("home")} />}
          {screen === "endorsement" && <EndorsementScreen onBack={() => setScreen("home")} />}
          {screen === "eduflex" && <EduflexScreen onBack={() => setScreen("home")} />}

          {screen === "rewards" && (
            <div className="relative z-10 mt-2 h-[800px] overflow-auto px-6 pb-6">
              <button
                onClick={() => setScreen("home")}
                className="mb-2 text-white/90 underline"
              >
                &lt; Back
              </button>
              <div className="mt-2">
                <CashbackRewardsScreen />
              </div>
            </div>
          )}
        </div>

        {/* FAB anchor & conditional mount (Home only) */}
        <div id="fab-anchor" className="absolute inset-0 pointer-events-none" />
        {(() => {
          const h =
            typeof location !== "undefined"
              ? (location.hash || "").toLowerCase()
              : "";
          const anyOverlay = [
            "#chatbot",
            "#qrpay",
            "#streak",
            "#split",
            "#budget",
            "#profileqr",
            "#offers",
            "#calc",   // <-- added
            "#voice",  // <-- added
            "#summary",
          ].includes(h);
          return screen === "home" && !anyOverlay ? <FloatingFabDock /> : null;
        })()}

        {/* THEME OVERLAY — on close, re-read from LS for “Apply” effect */}
        {showTheme && (
          <ThemeOverlay
            onClose={() => {
              setShowTheme(false);
              setTheme(loadTheme());
            }}
          />
        )}
      </div>
    </div>
  );
}
