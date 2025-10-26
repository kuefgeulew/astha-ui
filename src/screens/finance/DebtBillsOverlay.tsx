// src/screens/finance/DebtBillsOverlay.tsx
import React from "react";
import {
  X,
  Plus,
  CalendarDays,
  Bell,
  Download,
  CheckCircle2,
  Clock,
  Wallet,
  CreditCard as CreditCardIcon,
  Landmark,
  Building2,
  Smartphone,
  Wifi,
  Flame,
  Droplets,
  Plug,
  Film,
  ArrowUpDown,
  Filter,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

/** -----------------------------------------------------------
 *  Debt Manager + Bill Reminder + E-Mandate Center (mocked)
 *  Tabs:
 *   - Overview (KPIs + donut breakdown + upcoming)
 *   - Debts (sortable list, payoff projection)  ← mandate toggle per debt
 *   - Bills (recurring bills + reminders)       ← mandate toggle per bill
 *   - Calendar (upcoming due dates)
 *   - Insights (monthly spend vs. debt payments)
 *   - E-Mandates (manage all mandates in one place)
 *
 *  All labels are English. No backend required.
 *  ----------------------------------------------------------- */

type Props = { onClose: () => void };

type MandateStatus = "active" | "paused" | "revoked";
type Mandate = {
  enabled: boolean;
  mandateId: string;
  provider: "NPSB" | "BKash" | "Nagad" | "Rocket" | "Visa" | "Mastercard" | "AMEX";
  monthlyLimit: number; // BDT
  status: MandateStatus;
  lastUsed?: string; // ISO date
};

type Debt = {
  id: string;
  kind: "Credit Card" | "Personal Loan" | "BNPL" | "Microloan" | "EMI";
  lender: string;
  icon: "card" | "bank" | "wallet";
  apr: number; // annual %
  principal: number; // outstanding
  minPayment: number; // monthly minimum
  dueDay: number; // day of month
  status: "current" | "overdue" | "paid";
  createdAt: string;
  mandate?: Mandate;
};

type Bill = {
  id: string;
  name: string;
  icon:
    | "rent"
    | "electricity"
    | "gas"
    | "water"
    | "mobile"
    | "internet"
    | "entertainment";
  amount: number;
  dueDay: number;
  cycle: "Monthly" | "Quarterly" | "Yearly";
  autopay: boolean;
  remindDaysBefore: number; // reminder offset
  lastPaid?: string;
  status: "scheduled" | "overdue" | "paid";
  mandate?: Mandate;
};

type Tab = "overview" | "debts" | "bills" | "calendar" | "insights" | "emandates";

/* --------------------------- Mock Data --------------------------- */
// Debts
const MOCK_DEBTS: Debt[] = [
  {
    id: "d01",
    kind: "Credit Card",
    lender: "BRAC Bank Tara Platinum",
    icon: "card",
    apr: 29.0,
    principal: 68500,
    minPayment: 4000,
    dueDay: 7,
    status: "current",
    createdAt: "2024-11-02",
    mandate: {
      enabled: true,
      mandateId: "EM-CC-99811",
      provider: "Visa",
      monthlyLimit: 10000,
      status: "active",
      lastUsed: "2025-08-07",
    },
  },
  {
    id: "d02",
    kind: "Personal Loan",
    lender: "BRAC Bank PL",
    icon: "bank",
    apr: 15.5,
    principal: 210000,
    minPayment: 8900,
    dueDay: 12,
    status: "current",
    createdAt: "2023-06-10",
  },
  {
    id: "d03",
    kind: "BNPL",
    lender: "Daraz BNPL",
    icon: "wallet",
    apr: 0,
    principal: 12500,
    minPayment: 2500,
    dueDay: 18,
    status: "current",
    createdAt: "2025-01-03",
  },
  {
    id: "d04",
    kind: "Microloan",
    lender: "BKash Microloan",
    icon: "wallet",
    apr: 22.0,
    principal: 32000,
    minPayment: 3000,
    dueDay: 23,
    status: "current",
    createdAt: "2024-07-20",
  },
  {
    id: "d05",
    kind: "EMI",
    lender: "City AMEX",
    icon: "card",
    apr: 27.0,
    principal: 41200,
    minPayment: 2800,
    dueDay: 3,
    status: "current",
    createdAt: "2024-05-22",
  },
];

// Bills (recurring)
const MOCK_BILLS: Bill[] = [
  {
    id: "b01",
    name: "House Rent",
    icon: "rent",
    amount: 35000,
    dueDay: 1,
    cycle: "Monthly",
    autopay: false,
    remindDaysBefore: 3,
    lastPaid: "2025-08-01",
    status: "scheduled",
    mandate: {
      enabled: true,
      mandateId: "EM-Rent-11001",
      provider: "NPSB",
      monthlyLimit: 35000,
      status: "active",
      lastUsed: "2025-08-01",
    },
  },
  {
    id: "b02",
    name: "Electricity",
    icon: "electricity",
    amount: 2800,
    dueDay: 6,
    cycle: "Monthly",
    autopay: false,
    remindDaysBefore: 4,
    lastPaid: "2025-08-06",
    status: "scheduled",
  },
  {
    id: "b03",
    name: "Gas",
    icon: "gas",
    amount: 1200,
    dueDay: 10,
    cycle: "Monthly",
    autopay: true,
    remindDaysBefore: 2,
    lastPaid: "2025-08-10",
    status: "scheduled",
  },
  {
    id: "b04",
    name: "Water",
    icon: "water",
    amount: 600,
    dueDay: 11,
    cycle: "Monthly",
    autopay: true,
    remindDaysBefore: 2,
    lastPaid: "2025-08-11",
    status: "scheduled",
  },
  {
    id: "b05",
    name: "Mobile (Grameenphone)",
    icon: "mobile",
    amount: 1499,
    dueDay: 14,
    cycle: "Monthly",
    autopay: true,
    remindDaysBefore: 1,
    lastPaid: "2025-08-14",
    status: "scheduled",
  },
  {
    id: "b06",
    name: "Internet (Link3)",
    icon: "internet",
    amount: 1800,
    dueDay: 15,
    cycle: "Monthly",
    autopay: true,
    remindDaysBefore: 1,
    lastPaid: "2025-08-15",
    status: "scheduled",
  },
  {
    id: "b07",
    name: "Netflix",
    icon: "entertainment",
    amount: 1099,
    dueDay: 20,
    cycle: "Monthly",
    autopay: true,
    remindDaysBefore: 1,
    lastPaid: "2025-08-20",
    status: "scheduled",
  },
];

/* --------------------------- Utilities --------------------------- */

const BDT = (n: number) => `৳${n.toLocaleString("en-US")}`;

const iconForDebt = (i: Debt["icon"]) =>
  i === "card" ? (
    <CreditCardIcon className="h-4 w-4" />
  ) : i === "bank" ? (
    <Landmark className="h-4 w-4" />
  ) : (
    <Wallet className="h-4 w-4" />
  );

const iconForBill = (i: Bill["icon"]) => {
  switch (i) {
    case "rent":
      return <Building2 className="h-4 w-4" />;
    case "electricity":
      return <Plug className="h-4 w-4" />;
    case "gas":
      return <Flame className="h-4 w-4" />;
    case "water":
      return <Droplets className="h-4 w-4" />;
    case "mobile":
      return <Smartphone className="h-4 w-4" />;
    case "internet":
      return <Wifi className="h-4 w-4" />;
    case "entertainment":
      return <Film className="h-4 w-4" />;
  }
};

function daysUntil(dueDay: number, now = new Date()) {
  const target = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (target < now) target.setMonth(target.getMonth() + 1);
  return Math.ceil((+target - +now) / (1000 * 60 * 60 * 24));
}

function exportCSV(filename: string, rows: (string | number | boolean)[][], header: string[]) {
  const csv =
    header.join(",") +
    "\n" +
    rows
      .map((r) =>
        r
          .map((c) => {
            const s = String(c ?? "");
            return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(",")
      )
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function randId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7)}${Math.floor(Math.random() * 90 + 10)}`;
}

/* --------------------------- Component --------------------------- */

export default function DebtBillsOverlay({ onClose }: Props) {
  const [tab, setTab] = React.useState<Tab>("overview");

  const [debts, setDebts] = React.useState<Debt[]>(() => MOCK_DEBTS);
  const [bills, setBills] = React.useState<Bill[]>(() => MOCK_BILLS);

  // E-mandate lightweight editor state (inline)
  const [editingMandate, setEditingMandate] = React.useState<
    | { type: "debt"; id: string; mandate: Mandate }
    | { type: "bill"; id: string; mandate: Mandate }
    | null
  >(null);

  const totalDebt = debts.reduce((s, d) => s + d.principal, 0);
  const totalMin = debts.reduce((s, d) => s + d.minPayment, 0);
  const totalBills = bills.reduce((s, b) => s + b.amount, 0);

  const upcoming = React.useMemo(() => {
    const debtDue = debts
      .map((d) => ({ type: "debt" as const, label: `${d.lender} (${d.kind})`, day: d.dueDay, amount: d.minPayment }))
      .sort((a, b) => a.day - b.day);
    const billDue = bills
      .map((b) => ({ type: "bill" as const, label: b.name, day: b.dueDay, amount: b.amount }))
      .sort((a, b) => a.day - b.day);
    return [...debtDue, ...billDue].slice(0, 6);
  }, [debts, bills]);

  const donutData = debts.map((d) => ({ name: d.lender, value: d.principal, kind: d.kind }));
  const donutColors = ["#1D4ED8", "#06B6D4", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#10B981"];

    // Simple payoff projection line (snowball by min + 5k extra)
  const projection = React.useMemo(() => {
    const monthlyExtra = 5000;
    // Clone and sort smallest first (snowball)
    const queue = [...debts].sort((a, b) => a.principal - b.principal).map((d) => ({ ...d, bal: d.principal }));
    const points: { month: string; balance: number }[] = [];
    let monthIdx = 0;
    const maxMonths = 36;
    const now = new Date();
    while (monthIdx < maxMonths) {
      const label = new Date(now.getFullYear(), now.getMonth() + monthIdx, 1).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
      // minimum total + extra goes to first non-zero balance
      let payBudget = queue.reduce((s, d) => s + d.minPayment, 0) + monthlyExtra;
      for (const d of queue) {
        if (d.bal <= 0) continue;
        // interest monthly approx
        const monthlyRate = d.apr / 12 / 100;
        d.bal = Math.max(0, Math.round(d.bal * (1 + monthlyRate)));
        const pay = Math.min(d.bal, Math.max(d.minPayment, payBudget > 0 ? Math.min(payBudget, d.bal) : d.minPayment));
        d.bal -= pay;
        payBudget -= pay;
      }
      const total = queue.reduce((s, d) => s + d.bal, 0);
      points.push({ month: label, balance: total });
      if (total <= 0) break;
      monthIdx++;
    }
    return points;
  }, [debts]);

  // Bills bar — sum by category per month amount (snapshot)
  const billsBars = [
    { name: "Rent", value: bills.find((b) => b.icon === "rent")?.amount ?? 0 },
    { name: "Utilities", value: sumBills(bills, ["electricity", "gas", "water"]) },
    { name: "Connectivity", value: sumBills(bills, ["mobile", "internet"]) },
    { name: "Entertainment", value: sumBills(bills, ["entertainment"]) },
  ];

  function sumBills(all: Bill[], keys: Bill["icon"][]) {
    return all.filter((b) => keys.includes(b.icon)).reduce((s, b) => s + b.amount, 0);
  }

  // Actions
  function markBillPaid(id: string) {
    setBills((arr) =>
      arr.map((b) => (b.id === id ? { ...b, status: "paid", lastPaid: new Date().toISOString().slice(0, 10) } : b))
    );
  }

  function exportDebtsCSV() {
    exportCSV(
      "debts.csv",
      debts.map((d) => [
        d.id,
        d.kind,
        d.lender,
        d.apr,
        d.principal,
        d.minPayment,
        d.dueDay,
        d.status,
        d.mandate?.enabled ?? false,
        d.mandate?.mandateId ?? "",
        d.mandate?.provider ?? "",
        d.mandate?.monthlyLimit ?? "",
        d.mandate?.status ?? "",
      ]),
      [
        "id",
        "kind",
        "lender",
        "apr(%)",
        "principal(bdt)",
        "minPayment(bdt)",
        "dueDay",
        "status",
        "mandateEnabled",
        "mandateId",
        "provider",
        "monthlyLimit",
        "mandateStatus",
      ]
    );
  }

  function exportBillsCSV() {
    exportCSV(
      "bills.csv",
      bills.map((b) => [
        b.id,
        b.name,
        b.cycle,
        b.amount,
        b.dueDay,
        b.autopay,
        b.remindDaysBefore,
        b.status,
        b.mandate?.enabled ?? false,
        b.mandate?.mandateId ?? "",
        b.mandate?.provider ?? "",
        b.mandate?.monthlyLimit ?? "",
        b.mandate?.status ?? "",
      ]),
      [
        "id",
        "name",
        "cycle",
        "amount(bdt)",
        "dueDay",
        "autopay",
        "remindDaysBefore",
        "status",
        "mandateEnabled",
        "mandateId",
        "provider",
        "monthlyLimit",
        "mandateStatus",
      ]
    );
  }

  function exportMandatesCSV() {
    const mDebts = debts
      .filter((d) => d.mandate?.enabled)
      .map((d) => ({
        type: "debt",
        name: `${d.lender} (${d.kind})`,
        ...d.mandate!,
      }));
    const mBills = bills
      .filter((b) => b.mandate?.enabled)
      .map((b) => ({
        type: "bill",
        name: b.name,
        ...b.mandate!,
      }));
    const all = [...mDebts, ...mBills];
    exportCSV(
      "emandates.csv",
      all.map((m) => [m.type, m.name, m.mandateId, m.provider, m.monthlyLimit, m.status, m.lastUsed ?? ""]),
      ["type", "name", "mandateId", "provider", "monthlyLimit", "status", "lastUsed"]
    );
  }

  // Sorting (client only)
  const [debtSort, setDebtSort] = React.useState<"amount" | "apr" | "due">("amount");
  const sortedDebts = [...debts].sort((a, b) => {
    if (debtSort === "amount") return b.principal - a.principal;
    if (debtSort === "apr") return b.apr - a.apr;
    return a.dueDay - b.dueDay;
  });

  // Mandate helpers
  function toggleDebtMandate(id: string) {
    setDebts((arr) =>
      arr.map((d) => {
        if (d.id !== id) return d;
        const exists = d.mandate;
        if (exists?.enabled) {
          return { ...d, mandate: { ...exists, enabled: false, status: "paused" } };
        }
        const next: Mandate = exists
          ? { ...exists, enabled: true, status: "active" }
          : {
              enabled: true,
              mandateId: randId("EM-D"),
              provider: "NPSB",
              monthlyLimit: Math.max(d.minPayment * 2, 10000),
              status: "active",
              lastUsed: undefined,
            };
        return { ...d, mandate: next };
      })
    );
  }

  function toggleBillMandate(id: string) {
    setBills((arr) =>
      arr.map((b) => {
        if (b.id !== id) return b;
        const exists = b.mandate;
        if (exists?.enabled) {
          return { ...b, mandate: { ...exists, enabled: false, status: "paused" } };
        }
        const next: Mandate = exists
          ? { ...exists, enabled: true, status: "active" }
          : {
              enabled: true,
              mandateId: randId("EM-B"),
              provider: "NPSB",
              monthlyLimit: Math.max(b.amount * 1.25, 5000),
              status: "active",
              lastUsed: undefined,
            };
        return { ...b, mandate: next };
      })
    );
  }

  function openMandateEditorForDebt(id: string) {
    const d = debts.find((x) => x.id === id);
    if (!d) return;
    const m =
      d.mandate ??
      ({
        enabled: false,
        mandateId: randId("EM-D"),
        provider: "NPSB",
        monthlyLimit: Math.max(d.minPayment * 2, 10000),
        status: "paused",
      } as Mandate);
    setEditingMandate({ type: "debt", id, mandate: { ...m } });
  }

  function openMandateEditorForBill(id: string) {
    const b = bills.find((x) => x.id === id);
    if (!b) return;
    const m =
      b.mandate ??
      ({
        enabled: false,
        mandateId: randId("EM-B"),
        provider: "NPSB",
        monthlyLimit: Math.max(b.amount * 1.25, 5000),
        status: "paused",
      } as Mandate);
    setEditingMandate({ type: "bill", id, mandate: { ...m } });
  }

  function saveMandateEdit() {
    if (!editingMandate) return;
    const { type, id, mandate } = editingMandate;
    if (type === "debt") {
      setDebts((arr) => arr.map((d) => (d.id === id ? { ...d, mandate: { ...mandate } } : d)));
    } else {
      setBills((arr) => arr.map((b) => (b.id === id ? { ...b, mandate: { ...mandate } } : b)));
    }
    setEditingMandate(null);
  }

  function revokeMandate(type: "debt" | "bill", id: string) {
    if (type === "debt") {
      setDebts((arr) =>
        arr.map((d) => (d.id === id && d.mandate ? { ...d, mandate: { ...d.mandate, status: "revoked", enabled: false } } : d))
      );
    } else {
      setBills((arr) =>
        arr.map((b) => (b.id === id && b.mandate ? { ...b, mandate: { ...b.mandate, status: "revoked", enabled: false } } : b))
      );
    }
  }

  /* ------------------------------ UI ------------------------------ */

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-[1201] w-[min(1200px,96vw)] h-[min(90vh,860px)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-600 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/15 px-3 py-1 text-[15px] font-semibold">
              Debt Manager & Bill Reminder
            </div>
            <div className="hidden md:block text-white/90 text-sm">
              Track debts, schedule bills, export data, view projections, and manage e-mandates
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportDebtsCSV}
              className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-blue-700 shadow hover:bg-white"
              title="Export debts CSV"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Debts CSV</span>
            </button>
            <button
              onClick={exportBillsCSV}
              className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-blue-700 shadow hover:bg-white"
              title="Export bills CSV"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Bills CSV</span>
            </button>
            <button
              onClick={exportMandatesCSV}
              className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-blue-700 shadow hover:bg-white"
              title="Export e-mandates CSV"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">E-Mandates CSV</span>
            </button>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 hover:bg-white/25"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="rounded-xl bg-slate-100 p-1">
            <TabBtn current={tab} id="overview" setTab={setTab} label="Overview" />
            <TabBtn current={tab} id="debts" setTab={setTab} label="Debts" />
            <TabBtn current={tab} id="bills" setTab={setTab} label="Bills" />
            <TabBtn current={tab} id="calendar" setTab={setTab} label="Calendar" />
            <TabBtn current={tab} id="insights" setTab={setTab} label="Insights" />
            <TabBtn current={tab} id="emandates" setTab={setTab} label="E-Mandate Center" />
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-500">
            <Filter className="h-4 w-4" />
            <ArrowUpDown className="h-4 w-4" />
          </div>
        </div>

        {/* Body */}
        <div className="h-[calc(100%-108px)] overflow-auto p-4">
          {tab === "overview" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* KPIs */}
              <KpiCard title="Total Debt" value={BDT(totalDebt)} sub={`${sortedDebts.length} active accounts`} />
              <KpiCard title="Monthly Minimum (Debts)" value={BDT(totalMin)} sub="Required this month" />
              <KpiCard title="Monthly Bills" value={BDT(totalBills)} sub="Recurring charges" />

              {/* Donut */}
              <div className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Debt Breakdown</h3>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                  <div className="lg:col-span-3 min-h-[320px]">
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={80}
                          outerRadius={120}
                          stroke="#fff"
                          strokeWidth={2}
                          paddingAngle={2}
                        >
                          {donutData.map((_, i) => (
                            <Cell key={i} fill={donutColors[i % donutColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any, _n, p: any) => [BDT(Number(v)), p?.payload?.name || ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="h-2" />
                  </div>
                  <div className="lg:col-span-2">
                    <ul className="space-y-2">
                      {donutData
                        .slice()
                        .sort((a, b) => b.value - a.value)
                        .map((row, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-3 w-3 rounded-sm"
                                style={{ background: donutColors[i % donutColors.length] }}
                              />
                              <span className="text-[13px] text-slate-700">
                                {row.name} <span className="text-slate-400">({row.kind})</span>
                              </span>
                            </div>
                            <div className="text-[13px] font-medium text-slate-800">{BDT(row.value)}</div>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Upcoming */}
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Upcoming This Cycle</h3>
                <ul className="space-y-2">
                  {upcoming.map((u, i) => (
                    <li key={i} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        {u.type === "debt" ? (
                          <CreditCardIcon className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <CalendarDays className="h-4 w-4 text-emerald-600" />
                        )}
                        <div className="text-sm">
                          <div className="text-slate-800">{u.label}</div>
                          <div className="text-[12px] text-slate-500">Due day: {u.day}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold">{BDT(u.amount)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}


          {tab === "debts" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              {/* List */}
              <div className="lg:col-span-3 rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-slate-800">Debt Accounts</h3>
                  <div className="flex items-center gap-2">
                    <select
                      className="rounded-md border px-2 py-1 text-sm"
                      value={debtSort}
                      onChange={(e) => setDebtSort(e.target.value as any)}
                    >
                      <option value="amount">Sort: Amount</option>
                      <option value="apr">Sort: APR</option>
                      <option value="due">Sort: Due Day</option>
                    </select>
                    <button className="inline-flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm">
                      <Plus className="h-4 w-4" /> Add (mock)
                    </button>
                  </div>
                </div>

                <div className="divide-y">
                  {sortedDebts.map((d) => {
                    const m = d.mandate;
                    const enabled = !!m?.enabled;
                    return (
                      <div key={d.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                            {iconForDebt(d.icon)}
                          </div>
                          <div>
                            <div className="text-[15px] font-semibold text-slate-800">
                              {d.lender} <span className="text-slate-400">({d.kind})</span>
                            </div>
                            <div className="text-[12px] text-slate-500">
                              APR {d.apr}% • Due day {d.dueDay} • Min {BDT(d.minPayment)}
                            </div>

                            {/* Mandate inline info */}
                            <div className="mt-1 text-[12px]">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ring-1 ${
                                  enabled
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                    : "bg-slate-50 text-slate-600 ring-slate-200"
                                }`}
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {enabled
                                  ? `E-Mandate • ${m?.provider} • Limit ${BDT(m?.monthlyLimit ?? 0)} • ${m?.status}`
                                  : "E-Mandate OFF"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[13px] text-slate-500">Outstanding</div>
                          <div className="text-sm font-semibold">{BDT(d.principal)}</div>

                          {/* Mandate controls */}
                          <div className="mt-2 flex items-center justify-end gap-1">
                            <button
                              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]"
                              onClick={() => toggleDebtMandate(d.id)}
                              title={enabled ? "Disable e-mandate" : "Enable e-mandate"}
                            >
                              {enabled ? (
                                <>
                                  <ToggleRight className="h-3.5 w-3.5 text-emerald-600" /> On
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-3.5 w-3.5 text-slate-500" /> Off
                                </>
                              )}
                            </button>
                            <button
                              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]"
                              onClick={() => openMandateEditorForDebt(d.id)}
                              title="Edit e-mandate"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            {enabled && (
                              <button
                                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] text-rose-600"
                                onClick={() => revokeMandate("debt", d.id)}
                                title="Revoke mandate"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Projection */}
              <div className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Payoff Projection (Snowball)</h3>
                <div className="min-h-[280px]">
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={projection} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                      <Tooltip formatter={(v: any) => [BDT(Number(v)), "Total Balance"]} />
                      <Line type="monotone" dataKey="balance" stroke="#1D4ED8" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-[12px] text-slate-500">
                  Assumes monthly minimums plus an extra ৳5,000 directed to the smallest balance first.
                </p>
              </div>
            </div>
          )}

          {tab === "bills" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              {/* Recurring Bills */}
              <div className="lg:col-span-3 rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-slate-800">Recurring Bills</h3>
                  <button className="inline-flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm">
                    <Plus className="h-4 w-4" /> Add (mock)
                  </button>
                </div>

                <div className="divide-y">
                  {bills.map((b) => {
                    const dleft = daysUntil(b.dueDay);
                    const tone =
                      b.status === "overdue"
                        ? "text-rose-600"
                        : dleft <= b.remindDaysBefore
                        ? "text-amber-600"
                        : "text-slate-500";
                    const m = b.mandate;
                    const enabled = !!m?.enabled;
                    return (
                      <div key={b.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                            {iconForBill(b.icon)}
                          </div>
                          <div>
                            <div className="text-[15px] font-semibold text-slate-800">{b.name}</div>
                            <div className="text-[12px] text-slate-500">
                              {b.cycle} • Due day {b.dueDay} • Reminder {b.remindDaysBefore}d before •{" "}
                              {b.autopay ? "Autopay ON" : "Autopay OFF"}
                            </div>
                            {/* Mandate inline info */}
                            <div className="mt-1 text-[12px]">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ring-1 ${
                                  enabled
                                    ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                    : "bg-slate-50 text-slate-600 ring-slate-200"
                                }`}
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {enabled
                                  ? `E-Mandate • ${m?.provider} • Limit ${BDT(m?.monthlyLimit ?? 0)} • ${m?.status}`
                                  : "E-Mandate OFF"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[12px] text-slate-500">Amount</div>
                          <div className="text-sm font-semibold">{BDT(b.amount)}</div>
                          <div className={`mt-0.5 flex items-center justify-end gap-1 text-[12px] ${tone}`}>
                            {b.status === "paid" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                            <span>
                              {b.status === "paid"
                                ? "Paid"
                                : b.status === "overdue"
                                ? "Overdue"
                                : dleft <= b.remindDaysBefore
                                ? `Due soon (${dleft}d)`
                                : `In ${dleft}d`}
                            </span>
                          </div>

                          {/* Actions */}
                          {b.status !== "paid" && (
                            <button
                              className="mt-2 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
                              onClick={() => markBillPaid(b.id)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Mark Paid
                            </button>
                          )}

                          {/* Mandate controls */}
                          <div className="mt-2 flex items-center justify-end gap-1">
                            <button
                              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]"
                              onClick={() => toggleBillMandate(b.id)}
                              title={enabled ? "Disable e-mandate" : "Enable e-mandate"}
                            >
                              {enabled ? (
                                <>
                                  <ToggleRight className="h-3.5 w-3.5 text-emerald-600" /> On
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-3.5 w-3.5 text-slate-500" /> Off
                                </>
                              )}
                            </button>
                            <button
                              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]"
                              onClick={() => openMandateEditorForBill(b.id)}
                              title="Edit e-mandate"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            {enabled && (
                              <button
                                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] text-rose-600"
                                onClick={() => revokeMandate("bill", b.id)}
                                title="Revoke mandate"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category bars */}
              <div className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Bills by Category (Monthly)</h3>
                <div className="min-h-[280px]">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={billsBars} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(v: any) => [BDT(Number(v)), "Amount"]} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-[12px] text-slate-500">
                  Snapshot of recurring monthly obligations grouped by category.
                </p>
              </div>
            </div>
          )}

          {tab === "calendar" && (
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="px-1 pb-3 text-[15px] font-semibold text-slate-800">This Month’s Schedule</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 30 }).map((_, i) => {
                  const day = i + 1;
                  const dueDebts = debts.filter((d) => d.dueDay === day);
                  const dueBills = bills.filter((b) => b.dueDay === day);
                  const hasDue = dueDebts.length + dueBills.length > 0;
                  return (
                    <div
                      key={day}
                      className={`rounded-xl border p-3 text-sm ${
                        hasDue ? "bg-amber-50 border-amber-200" : "bg-white"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Day {day}</span>
                        {hasDue ? <CalendarDays className="h-4 w-4 text-amber-600" /> : <Clock className="h-4 w-4 text-slate-300" />}
                      </div>
                      {dueDebts.map((d) => (
                        <div key={d.id} className="mt-1 flex items-center justify-between">
                          <span className="text-slate-700">{d.lender}</span>
                          <span className="text-slate-900">{BDT(d.minPayment)}</span>
                        </div>
                      ))}
                      {dueBills.map((b) => (
                        <div key={b.id} className="mt-1 flex items-center justify-between">
                          <span className="text-slate-700">{b.name}</span>
                          <span className="text-slate-900">{BDT(b.amount)}</span>
                        </div>
                      ))}
                      {!hasDue && <div className="text-slate-400">—</div>}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                <AlertCircle className="h-4 w-4" />
                Reminders trigger when an item is within its reminder window.
              </div>
            </div>
          )}

          {tab === "insights" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Debt vs. Bills (Monthly)</h3>
                <div className="min-h-[300px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        { name: "Minimum Debt", value: totalMin },
                        { name: "Recurring Bills", value: totalBills },
                      ]}
                      margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(v: any) => [BDT(Number(v)), "Amount"]} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">Action Suggestions</h3>
                <ul className="space-y-2 text-sm">
                  <li className="rounded-lg bg-emerald-50 p-3 text-emerald-800 ring-1 ring-emerald-100">
                    • Consider paying off the <b>Daraz BNPL</b> first due to zero APR and small balance (quick win).
                  </li>
                  <li className="rounded-lg bg-blue-50 p-3 text-blue-800 ring-1 ring-blue-100">
                    • Increase extra payment by ৳2,000 to accelerate payoff by ~1–2 months.
                  </li>
                  <li className="rounded-lg bg-amber-50 p-3 text-amber-800 ring-1 ring-amber-100">
                    • Turn on Autopay for Electricity to avoid late fees.
                  </li>
                </ul>
              </div>
            </div>
          )}


          {tab === "emandates" && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              {/* Center list */}
              <div className="lg:col-span-3 rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-slate-800">E-Mandate Center</h3>
                  <div className="text-[12px] text-slate-500">Manage mandates linked to your debts and bills.</div>
                </div>

                <div className="mb-2 text-[13px] font-semibold text-slate-700">Debts</div>
                <div className="divide-y">
                  {debts.map((d) => {
                    const m = d.mandate;
                    return (
                      <div key={d.id} className="flex items-center justify-between py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                            {iconForDebt(d.icon)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[15px] font-semibold text-slate-800">
                              {d.lender} <span className="text-slate-400">({d.kind})</span>
                            </div>
                            <div className="text-[12px] text-slate-500">
                              {m?.enabled
                                ? `ID ${m.mandateId} • ${m.provider} • Limit ${BDT(m.monthlyLimit)} • ${m.status}`
                                : "No mandate"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]"
                            onClick={() => toggleDebtMandate(d.id)}
                          >
                            {m?.enabled ? (
                              <>
                                <ToggleRight className="h-3.5 w-3.5 text-emerald-600" /> On
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-3.5 w-3.5 text-slate-500" /> Off
                              </>
                            )}
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]"
                            onClick={() => openMandateEditorForDebt(d.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          {m?.enabled && (
                            <button
                              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] text-rose-600"
                              onClick={() => revokeMandate("debt", d.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 mb-2 text-[13px] font-semibold text-slate-700">Bills</div>
                <div className="divide-y">
                  {bills.map((b) => {
                    const m = b.mandate;
                    return (
                      <div key={b.id} className="flex items-center justify-between py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                            {iconForBill(b.icon)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[15px] font-semibold text-slate-800">{b.name}</div>
                            <div className="text-[12px] text-slate-500">
                              {m?.enabled
                                ? `ID ${m.mandateId} • ${m.provider} • Limit ${BDT(m.monthlyLimit)} • ${m.status}`
                                : "No mandate"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]"
                            onClick={() => toggleBillMandate(b.id)}
                          >
                            {m?.enabled ? (
                              <>
                                <ToggleRight className="h-3.5 w-3.5 text-emerald-600" /> On
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-3.5 w-3.5 text-slate-500" /> Off
                              </>
                            )}
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]"
                            onClick={() => openMandateEditorForBill(b.id)}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          {m?.enabled && (
                            <button
                              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px] text-rose-600"
                              onClick={() => revokeMandate("bill", b.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side help & export */}
              <div className="lg:col-span-2 rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">About E-Mandates</h3>
                <ul className="space-y-2 text-sm">
                  <li className="rounded-lg bg-blue-50 p-3 text-blue-800 ring-1 ring-blue-100">
                    • A mandate allows trusted merchants/lenders to debit up to a set monthly limit.
                  </li>
                  <li className="rounded-lg bg-emerald-50 p-3 text-emerald-800 ring-1 ring-emerald-100">
                    • You control provider, limit, and status (active/paused/revoked) any time.
                  </li>
                  <li className="rounded-lg bg-amber-50 p-3 text-amber-800 ring-1 ring-amber-100">
                    • Turning mandate Off pauses automatic debits but does not cancel the service.
                  </li>
                </ul>

                <div className="mt-4">
                  <button
                    onClick={exportMandatesCSV}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-white shadow hover:bg-blue-700"
                    title="Export e-mandates CSV"
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-sm">Export E-Mandates CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lightweight Mandate Editor (inline sheet) */}
        {editingMandate && (
          <div className="absolute inset-0 z-[1300] grid place-items-center bg-black/40">
            <div className="w-[min(520px,92vw)] rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10">
              <div className="flex items-center justify-between">
                <div className="text-[15px] font-semibold text-slate-800">Edit E-Mandate</div>
                <button className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100" onClick={() => setEditingMandate(null)}>
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[12px] text-slate-600">Mandate ID</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={editingMandate.mandate.mandateId}
                    onChange={(e) =>
                      setEditingMandate({ ...editingMandate, mandate: { ...editingMandate.mandate, mandateId: e.target.value } })
                    }
                  />
                </div>
                <div>
                  <label className="text-[12px] text-slate-600">Provider</label>
                  <select
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={editingMandate.mandate.provider}
                    onChange={(e) =>
                      setEditingMandate({
                        ...editingMandate,
                        mandate: { ...editingMandate.mandate, provider: e.target.value as Mandate["provider"] },
                      })
                    }
                  >
                    <option value="NPSB">NPSB</option>
                    <option value="BKash">BKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="AMEX">AMEX</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-slate-600">Monthly Limit (BDT)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={editingMandate.mandate.monthlyLimit}
                    onChange={(e) =>
                      setEditingMandate({
                        ...editingMandate,
                        mandate: { ...editingMandate.mandate, monthlyLimit: Math.max(0, Number(e.target.value || 0)) },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-[12px] text-slate-600">Status</label>
                  <select
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={editingMandate.mandate.status}
                    onChange={(e) =>
                      setEditingMandate({
                        ...editingMandate,
                        mandate: {
                          ...editingMandate.mandate,
                          status: e.target.value as MandateStatus,
                          enabled: e.target.value === "active" ? true : false,
                        },
                      })
                    }
                  >
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="revoked">revoked</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-slate-600">Enabled</label>
                  <div className="mt-1">
                    <button
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]"
                      onClick={() =>
                        setEditingMandate({
                          ...editingMandate,
                          mandate: {
                            ...editingMandate.mandate,
                            enabled: !editingMandate.mandate.enabled,
                            status: !editingMandate.mandate.enabled ? "active" : "paused",
                          },
                        })
                      }
                    >
                      {editingMandate.mandate.enabled ? (
                        <>
                          <ToggleRight className="h-3.5 w-3.5 text-emerald-600" /> On
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3.5 w-3.5 text-slate-500" /> Off
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setEditingMandate(null)}>
                  Cancel
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  onClick={saveMandateEdit}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Save Mandate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Bits ------------------------------ */

function TabBtn({
  current,
  id,
  setTab,
  label,
}: {
  current: Tab;
  id: Tab;
  setTab: (t: Tab) => void;
  label: string;
}) {
  const active = current === id;
  return (
    <button
      onClick={() => setTab(id)}
      className={`mx-0.5 rounded-lg px-3 py-1 text-sm ${
        active ? "bg-white text-blue-700 shadow" : "text-slate-600 hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}

function KpiCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-[12px] uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
      {!!sub && <div className="text-[12px] text-slate-500">{sub}</div>}
    </div>
  );
}
