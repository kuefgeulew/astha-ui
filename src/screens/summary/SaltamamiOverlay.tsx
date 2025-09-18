// src/screens/saltamami/SaltamamiOverlay.tsx
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { X, Download, CalendarDays } from "lucide-react";

/* -------------------- Config / Constraints -------------------- */
// Monthly may not go beyond Aug 2025
const MONTH_MAX = new Date(2025, 7, 1); // 2025-08-01
// Monthly earliest we’ll let users go back
const MONTH_MIN = new Date(2023, 0, 1); // 2023-01-01

// Yearly allowed range (closed)
const YEAR_MIN = 2018;
const YEAR_MAX = 2024;

// Sectors + colors
const SECTORS = [
  { key: "Dining", color: "#F05252" },
  { key: "Education", color: "#22C55E" },
  { key: "Entertainment", color: "#6366F1" },
  { key: "Groceries", color: "#06B6D4" },
  { key: "Healthcare", color: "#6B7280" },
  { key: "Others", color: "#64748B" },
  { key: "Shopping", color: "#10B981" },
  { key: "Transport", color: "#8B5CF6" },
  { key: "Travel", color: "#F59E0B" },
  { key: "Utilities", color: "#FB923C" },
] as const;

type View = "monthly" | "yearly";

type Props = {
  onClose: () => void;
};

/* -------------------- Helpers -------------------- */

// clamp a date to min/max by month
function clampMonth(d: Date) {
  if (d < MONTH_MIN) return new Date(MONTH_MIN);
  if (d > MONTH_MAX) return new Date(MONTH_MAX);
  return d;
}

function canGoNextMonth(d: Date) {
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return next <= MONTH_MAX;
}
function canGoPrevMonth(d: Date) {
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  return prev >= MONTH_MIN;
}

function formatBDT(n: number) {
  return n.toLocaleString("bn-BD", { maximumFractionDigits: 0 });
}
function formatBDTEn(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function monthLabel(d: Date) {
  return (
    d.toLocaleString("bn-BD", { year: "numeric", month: "long" }) +
    " / " +
    d.toLocaleString("en-US", { year: "numeric", month: "long" })
  );
}

/* ---------- Synthetic data that matches your constraints ---------- */
type DayPoint = { day: number; incoming: number; outgoing: number; net: number };

type MonthlyData = {
  points: DayPoint[];
  totals: { incoming: number; outgoing: number };
  sectorRows: { key: string; color: string; value: number }[];
};

function generateMonthly(d: Date): MonthlyData {
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

  // Incoming: 80k on day 5 + 2-4 random (5–10k) elsewhere, total ≤ 120k
  let points: DayPoint[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    incoming: 0,
    outgoing: 0,
    net: 0,
  }));

  const SALARY_DAY = 5;
  points[SALARY_DAY - 1].incoming = 80000;

  const extraCredits = Math.floor(Math.random() * 3) + 2; // 2–4 extras
  let totalIncoming = 80000;

  for (let i = 0; i < extraCredits; i++) {
    let day = Math.floor(Math.random() * daysInMonth) + 1;
    if (day === SALARY_DAY) day = (day % daysInMonth) + 1;
    const val = 5000 + Math.floor(Math.random() * 5001); // 5k–10k
    if (totalIncoming + val > 120000) continue; // keep under limit
    points[day - 1].incoming += val;
    totalIncoming += val;
  }

  // Outgoing: include fixed House Rent = 35k on day 1, and keep total ≤ 80k
  const HOUSE_RENT_DAY = 1;
  const HOUSE_RENT_AMOUNT = 35000;

  points[HOUSE_RENT_DAY - 1].outgoing += HOUSE_RENT_AMOUNT;

  let remainingOutgoing = Math.max(0, 80000 - HOUSE_RENT_AMOUNT);
  const spendDays = Math.floor(daysInMonth * 0.6); // ~60% of days have spend
  const spendSet = new Set<number>();
  while (spendSet.size < spendDays) {
    const idx = Math.floor(Math.random() * daysInMonth);
    if (idx !== HOUSE_RENT_DAY - 1) spendSet.add(idx); // avoid stacking on rent day
  }
  for (const idx of spendSet) {
    const left = remainingOutgoing;
    if (left <= 0) break;
    // smaller random spends; taper so we don’t overshoot:
    const slice = Math.min(left, 1000 + Math.floor(Math.random() * 3500)); // ≈ 1k–4.5k
    points[idx].outgoing += slice;
    remainingOutgoing -= slice;
  }

  // Net
  for (const p of points) p.net = p.incoming - p.outgoing;

  const totals = {
    incoming: points.reduce((s, p) => s + p.incoming, 0),
    outgoing: points.reduce((s, p) => s + p.outgoing, 0),
  };

  // Sector split:
  // - Start with fixed House Rent = 35k
  // - Split the remaining outgoing across sectors by weights
  const rng = mulberry32(d.getFullYear() * 100 + d.getMonth());
  const remainingForSectors = Math.max(0, totals.outgoing - HOUSE_RENT_AMOUNT);

  const weights = SECTORS.map(() => 0.5 + rng()); // 0.5–1.5
  const sumW = weights.reduce((s, w) => s + w, 0);

  const sectorRows: { key: string; color: string; value: number }[] = [
    { key: "House Rent", color: "#334155", value: HOUSE_RENT_AMOUNT },
    ...SECTORS.map((s, i) => ({
      key: s.key,
      color: s.color,
      value: Math.round((remainingForSectors * weights[i]) / sumW),
    })),
  ];

  // Rounding fix to match totals.expenditure exactly
  const diff = totals.outgoing - sectorRows.reduce((s, r) => s + r.value, 0);
  if (diff !== 0 && sectorRows.length) sectorRows[1].value += diff; // adjust a non-rent sector

  return { points, totals, sectorRows };
}

/* PRNG for reproducibility-ish */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------- Yearly aggregation (new) -------- */
type YearlySeriesPoint = { month: string; incoming: number; outgoing: number; net: number };

function aggregateYear(year: number) {
  // Build 12 months using the same monthly generator
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const perMonth = Array.from({ length: 12 }, (_, m) => {
    const md = generateMonthly(new Date(year, m, 1));
    return {
      month: monthNames[m],
      incoming: md.totals.incoming,
      outgoing: md.totals.outgoing,
      net: md.totals.incoming - md.totals.outgoing,
      sectors: md.sectorRows,
    };
  });

  // Totals
  const incomingTotal = perMonth.reduce((s, r) => s + r.incoming, 0);
  const outgoingTotal = perMonth.reduce((s, r) => s + r.outgoing, 0);

  // Yearly sector donut = sum of sector values across the year
  const sectorMap = new Map<string, { key: string; color: string; value: number }>();
  for (const m of perMonth) {
    for (const s of m.sectors) {
      const prev = sectorMap.get(s.key);
      if (prev) prev.value += s.value;
      else sectorMap.set(s.key, { ...s });
    }
  }
  const sectorRows = Array.from(sectorMap.values()).sort((a, b) => b.value - a.value);

  const series: YearlySeriesPoint[] = perMonth.map((r) => ({
    month: r.month,
    incoming: r.incoming,
    outgoing: r.outgoing,
    net: r.net,
  }));

  return { incomingTotal, outgoingTotal, sectorRows, series };
}

/* -------------------- Component -------------------- */
export default function SaltamamiOverlay({ onClose }: Props) {
  const [view, setView] = React.useState<View>("monthly");

  // Month state clamped to constraints
  const [month, setMonth] = React.useState<Date>(() =>
    clampMonth(new Date(2025, 7, 1)) // start at Aug 2025
  );
  // Year state clamped to 2018–2024
  const [year, setYear] = React.useState<number>(2024);

  const data = React.useMemo(() => generateMonthly(month), [month]);
  const yearly = React.useMemo(() => aggregateYear(year), [year]);

  /* -------------------- CSV Export (monthly) -------------------- */
  function exportCSV() {
    const header = ["Day", "Incoming (BDT)", "Expense (BDT)", "Net (BDT)"].join(",");
    const rows = data.points
      .map((p) => [p.day, p.incoming, p.outgoing, p.net].join(","))
      .join("\n");

    const blob = new Blob([header + "\n" + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileLabel = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
    a.download = `saltamami-${fileLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* -------------------- UI -------------------- */
  const totalsIncoming = view === "monthly" ? data.totals.incoming : yearly.incomingTotal;
  const totalsOutgoing = view === "monthly" ? data.totals.outgoing : yearly.outgoingTotal;
  const totalsNet = totalsIncoming - totalsOutgoing;

  const pieRows = view === "monthly" ? data.sectorRows : yearly.sectorRows;

  return (
    <div className="fixed inset-0 z-[1100] grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-[1101] w-[min(1150px,95vw)] h-[min(88vh,820px)] rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/15 px-3 py-1 font-semibold">
              Saltamami
            </div>
            <div className="hidden md:block text-white/90">
              Comprehensive sector view (Monthly & Yearly)
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View switch */}
            <div className="rounded-xl bg-white/15 p-1">
              <button
                className={`px-3 py-1 rounded-lg text-sm ${
                  view === "monthly" ? "bg-white text-blue-700 shadow" : "text-white/90"
                }`}
                onClick={() => setView("monthly")}
              >
                Monthly
              </button>
              <button
                className={`ml-1 px-3 py-1 rounded-lg text-sm ${
                  view === "yearly" ? "bg-white text-blue-700 shadow" : "text-white/90"
                }`}
                onClick={() => setView("yearly")}
              >
                Yearly
              </button>
            </div>

            {/* CSV (monthly) */}
            <button
              onClick={exportCSV}
              className="ml-2 inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-blue-700 shadow hover:bg-white"
              title="Export CSV"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm">Export CSV</span>
            </button>

            <button
              onClick={onClose}
              className="ml-2 grid h-9 w-9 place-items-center rounded-lg bg-white/15 text-white hover:bg-white/20"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: month/year and totals */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          {/* Date control */}
          <div className="flex items-center gap-2">
            <div className="rounded-lg border px-3 py-2 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-600" />
              {view === "monthly" ? (
                <>
                  <button
                    className="px-2 py-1 rounded-md bg-slate-100 disabled:opacity-50"
                    onClick={() =>
                      setMonth((m) =>
                        canGoPrevMonth(m)
                          ? new Date(m.getFullYear(), m.getMonth() - 1, 1)
                          : m
                      )
                    }
                    disabled={!canGoPrevMonth(month)}
                  >
                    ‹
                  </button>
                  <div className="mx-1 min-w-[210px] text-sm">
                    {monthLabel(month)}
                  </div>
                  <button
                    className="px-2 py-1 rounded-md bg-slate-100 disabled:opacity-50"
                    onClick={() =>
                      setMonth((m) =>
                        canGoNextMonth(m)
                          ? new Date(m.getFullYear(), m.getMonth() + 1, 1)
                          : m
                      )
                    }
                    disabled={!canGoNextMonth(month)}
                  >
                    ›
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="px-2 py-1 rounded-md bg-slate-100 disabled:opacity-50"
                    onClick={() => setYear((y) => Math.max(YEAR_MIN, y - 1))}
                    disabled={year <= YEAR_MIN}
                  >
                    ‹
                  </button>
                  <div className="mx-2 min-w-[160px] text-sm">{`Year ${year}`}</div>
                  <button
                    className="px-2 py-1 rounded-md bg-slate-100 disabled:opacity-50"
                    onClick={() => setYear((y) => Math.min(YEAR_MAX, y + 1))}
                    disabled={year >= YEAR_MAX}
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Totals */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="emerald" label={`Incoming`} value={`৳${formatBDT(totalsIncoming)}`} />
              <Badge tone="rose" label={`Expense`} value={`৳${formatBDT(totalsOutgoing)}`} />
              <Badge tone="slate" label={`Net`} value={`৳${formatBDT(totalsNet)}`} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-136px)] overflow-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Donut + legend */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">
                Sector-wise Expense
              </h3>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                {/* Chart kept roomy */}
                <div className="lg:col-span-3 min-h-[320px]">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie
                        data={pieRows}
                        dataKey="value"
                        nameKey="key"
                        innerRadius={80}
                        outerRadius={120}
                        stroke="#fff"
                        strokeWidth={2}
                        paddingAngle={2}
                        isAnimationActive
                      >
                        {pieRows.map((s, i) => (
                          <Cell key={i} fill={s.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any, _n, p: any) => [
                          `৳${formatBDTEn(Number(v))}`,
                          p?.payload?.key || "",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* extra breathing room below donut */}
                  <div className="h-4" />
                </div>

                {/* Custom legend list with plenty of spacing */}
                <div className="lg:col-span-2">
                  <ul className="space-y-2">
                    {pieRows
                      .slice()
                      .sort((a, b) => b.value - a.value)
                      .map((s, i) => (
                        <li
                          key={`${s.key}-${i}`}
                          className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-sm"
                              style={{ background: s.color }}
                            />
                            <span className="text-[13px] text-slate-700">
                              {s.key}
                            </span>
                          </div>
                          <div className="text-[13px] font-medium text-slate-800">
                            ৳{formatBDTEn(s.value)}
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Cashflow chart */}
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="px-1 pb-2 text-[15px] font-semibold text-slate-800">
                {view === "monthly" ? "Daily Cashflow" : "Monthly Cashflow"}
              </h3>

              <div className="min-h-[360px]">
                <ResponsiveContainer width="100%" height={360}>
                  {view === "monthly" ? (
                    <ComposedChart
                      data={data.points}
                      margin={{ top: 10, right: 20, bottom: 50, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tickMargin={10}
                        label={{ value: "Day", position: "insideBottom", offset: -30 }}
                      />
                      <YAxis tickFormatter={(v) => (v >= 0 ? v : `-${Math.abs(v)}`)} />
                      <Tooltip
                        formatter={(v: any, n: string) => [
                          `৳${formatBDTEn(Number(v))}`,
                          n === "incoming" ? "Incoming" : n === "outgoing" ? "Expense" : "Net",
                        ]}
                        labelFormatter={(l) => `Day ${l}`}
                      />
                      <Bar dataKey="incoming" name="Incoming" barSize={10} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="outgoing" name="Expense" barSize={10} radius={[3, 3, 0, 0]} fill="#EF4444" />
                      <Line type="monotone" dataKey="net" name="Net" strokeWidth={3} dot={false} />
                    </ComposedChart>
                  ) : (
                    <ComposedChart
                      data={yearly.series}
                      margin={{ top: 10, right: 20, bottom: 50, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickMargin={10}
                        label={{ value: "Month", position: "insideBottom", offset: -30 }}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(v: any, n: string) => [
                          `৳${formatBDTEn(Number(v))}`,
                          n === "incoming" ? "Incoming" : n === "outgoing" ? "Expense" : "Net",
                        ]}
                      />
                      <Bar dataKey="incoming" name="Incoming" barSize={12} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="outgoing" name="Expense" barSize={12} fill="#EF4444" radius={[3, 3, 0, 0]} />
                      <Line type="monotone" dataKey="net" name="Net" strokeWidth={3} dot={false} />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>

                {/* Spacious legend below the chart (custom, non-overlapping) */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
                  <LegendDot color="#22C55E" label="Incoming" />
                  <LegendDot color="#EF4444" label="Expense" />
                  <LegendDot color="#3B82F6" label="Net" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- tiny UI helpers -------------------- */

function Badge({
  tone,
  label,
  value,
}: {
  tone: "emerald" | "rose" | "slate";
  label: string;
  value: string;
}) {
  const map = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-slate-50 text-slate-700 ring-slate-100",
  } as const;
  return (
    <div
      className={`ml-2 inline-flex items-center gap-2 rounded-xl px-3 py-1 text-sm ring-1 ${map[tone]}`}
    >
      <span className="opacity-90">{label}</span>
      <strong className="font-semibold">{value}</strong>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-block h-3.5 w-3.5 rounded-sm" style={{ background: color }} />
      <span className="text-slate-700">{label}</span>
    </div>
  );
}
