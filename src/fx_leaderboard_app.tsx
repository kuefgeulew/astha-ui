// src/fx_leaderboard_app.tsx
// Single-file React canvas: FX Leaderboard demo (Bangladesh-realistic)
// Converted to TSX so it can be imported cleanly from ForeignDashboard.tsx

import React from "react";
import ReactCountryFlag from "react-country-flag";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { Trophy, Globe2, Gauge, Crown, Medal } from "lucide-react";

// ---------------------------------- //
// utils                               //
// ---------------------------------- //
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
function formatUSD(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
function monthKey(dateISO: string) {
  const d = new Date(dateISO);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ---------------------------------- //
// data (Bangladesh-realistic)         //
// ---------------------------------- //
export type Txn = {
  userId: string;
  country: string; // ISO Alpha-2 ('US','SA','GB','IN','SG','TH','MY')
  channel: "POS" | "E-COM";
  amountUSD: number;
  date: string; // ISO
};
export type User = {
  id: string;
  alias: string;
  segment: "Mass" | "Affluent" | "HNI";
};

const users: User[] = [
  { id: "u1", alias: "Shonar Cheel", segment: "Affluent" },
  { id: "u2", alias: "Silver Lynx", segment: "Mass" },
  { id: "u3", alias: "Megh Bagh", segment: "Affluent" },
  { id: "u4", alias: "Crimson Orca", segment: "HNI" },
  { id: "u5", alias: "Padma Shaluk", segment: "Mass" },
  { id: "u6", alias: "Azure Tiger", segment: "Affluent" },
  { id: "u7", alias: "Nilkanto", segment: "Affluent" },
  { id: "u8", alias: "Amber Raven", segment: "Mass" },
  { id: "u9", alias: "Borsha Shalik", segment: "HNI" },
  { id: "u10", alias: "Mahmudul Karim", segment: "Mass" },
];

const COUNTRIES = ["US", "SA", "GB", "IN", "SG", "TH", "MY"] as const;
const CHANNELS = ["POS", "E-COM"] as const;

function getLast12Months(): string[] {
  const now = new Date();
  const arr: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return arr.reverse();
}
const MONTHS = getLast12Months();

// PRNG for deterministic demo
let seed = 20250905;
function rnd() {
  // xorshift-ish
  seed ^= seed << 13;
  seed ^= seed >> 17;
  seed ^= seed << 5;
  return Math.abs(seed) / 2 ** 31;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

// Lowered per-country base to reflect BD cardholder spend (monthly)
const BASE_BIAS: Record<string, number> = {
  SA: 280,
  US: 220,
  GB: 170,
  SG: 150,
  TH: 130,
  MY: 120,
  IN: 80,
};

// Generate dataset per month with realistic magnitudes
const genMonthTxns = (ym: string): Txn[] => {
  const [year, month] = ym.split("-").map(Number);

  // 1) Baseline coverage
  const baseline: Txn[] = [];
  for (const c of COUNTRIES) {
    for (const ch of CHANNELS) {
      const base = BASE_BIAS[c] * (0.15 + rnd() * 0.25);
      baseline.push({
        userId: pick(users).id,
        country: c,
        channel: ch as "POS" | "E-COM",
        amountUSD: Math.round(base),
        date: new Date(year, month - 1, 5 + Math.floor(rnd() * 20)).toISOString(),
      });
    }
  }

  // 2) Organic activity
  const organicCount = 90 + Math.floor(rnd() * 70);
  const organic: Txn[] = Array.from({ length: organicCount }, () => {
    const u = pick(users);
    const c = pick(COUNTRIES);
    const ch = pick(CHANNELS) as "POS" | "E-COM";
    const bias = BASE_BIAS[c];
    const magnitude = bias * (0.35 + rnd() * 0.9);
    const date = new Date(year, month - 1, 1 + Math.floor(rnd() * 28));
    return {
      userId: u.id,
      country: c,
      channel: ch,
      amountUSD: Math.round(magnitude),
      date: date.toISOString(),
    };
  });

  return baseline.concat(organic);
};

const txns: Txn[] = MONTHS.flatMap(genMonthTxns);

// ---------------------------------- //
// UI components                       //
// ---------------------------------- //
function Card({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cn("rounded-2xl border p-5 bg-white", className)}>{children}</div>;
}

function Flag({ code, size = 24 }: { code: string; size?: number }) {
  return (
    <ReactCountryFlag
      svg
      countryCode={code}
      style={{ width: size, height: size }}
    />
  );
}

type FiltersProps = {
  month: string;
  setMonth: (v: string) => void;
  channel: "ALL" | "POS" | "E-COM";
  setChannel: (v: "ALL" | "POS" | "E-COM") => void;
  months: string[];
};
function Filters({
  month,
  setMonth,
  channel,
  setChannel,
  months,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <label className="block text-xs text-slate-500">Month</label>
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-slate-500">Channel</label>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value as any)}
          className="rounded-lg border px-3 py-2"
        >
          <option value="ALL">All</option>
          <option value="POS">POS</option>
          <option value="E-COM">E-COM</option>
        </select>
      </div>
    </div>
  );
}

export type Row = {
  rank: number;
  alias: string;
  total: number;
  topCountry: string;
  posPct: number;
  badges: string[];
  tier: "Explorer" | "Voyager" | "Globetrotter" | "Platinum Traveller";
};
function LeaderboardTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border">
      <table className="w-full border-separate border-spacing-0">
        <thead className="bg-slate-100 text-left text-slate-600">
          <tr>
            <th className="p-3">Rank</th>
            <th className="p-3">User</th>
            <th className="p-3">Total FX</th>
            <th className="p-3">Top Country</th>
            <th className="p-3">% POS</th>
            <th className="p-3">Badges</th>
            <th className="p-3">Tier</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-white even:bg-slate-50">
              <td className="p-3 font-semibold">
                <div className="inline-flex items-center gap-2">
                  {r.rank <= 3 ? (
                    <Medal className="h-4 w-4 text-amber-500" />
                  ) : null}
                  {r.rank}
                </div>
              </td>
              <td className="p-3">{r.alias}</td>
              <td className="p-3">{formatUSD(r.total)}</td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <Flag code={r.topCountry} />
                  {r.topCountry}
                </div>
              </td>
              <td className="p-3">{Math.round(r.posPct * 100)}%</td>
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  {r.badges.map((b, j) => (
                    <span
                      key={j}
                      className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-3">{r.tier}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Reward tiers scaled for BD context (monthly totals in USD)
const TIERS = [
  { name: "Explorer", threshold: 100 },
  { name: "Voyager", threshold: 500 },
  { name: "Globetrotter", threshold: 1200 },
  { name: "Platinum Traveller", threshold: 2000 },
] as const;
function tiersFor(amount: number) {
  let current = TIERS[0].name;
  let next: { name: string; threshold: number } | null = null;
  for (let i = 0; i < TIERS.length; i++) {
    if (amount >= TIERS[i].threshold) current = TIERS[i].name;
    else {
      next = TIERS[i];
      break;
    }
  }
  const remaining = next ? Math.max(0, next.threshold - amount) : 0;
  return { current, next, remaining };
}

function CountryTick({ x, y, payload }: any) {
  const code: string = payload.value;
  return (
    <g transform={`translate(${x},${y})`}>
      <foreignObject x={-14} y={8} width="28" height="28">
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Flag code={code} size={18} />
        </div>
      </foreignObject>
      <text x={0} y={38} textAnchor="middle" fill="#334155" fontSize={12}>
        {code}
      </text>
    </g>
  );
}
function TipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const pos = payload.find((p: any) => p.dataKey === "pos")?.value ?? 0;
  const ecom = payload.find((p: any) => p.dataKey === "ecom")?.value ?? 0;
  const total = pos + ecom;
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        padding: 8,
        borderRadius: 8,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div>POS: ${pos.toLocaleString()}</div>
      <div>E-COM: ${ecom.toLocaleString()}</div>
      <div style={{ marginTop: 4, fontWeight: 600 }}>
        Total: ${total.toLocaleString()}
      </div>
    </div>
  );
}
function BarByCountry({
  data,
}: {
  data: { code: string; ecom: number; pos: number; total: number }[];
}) {
  const sorted = [...data].sort((a, b) => b.total - a.total);
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart
          data={sorted}
          margin={{ left: 4, right: 12, top: 8, bottom: 24 }}
        >
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="code" tickLine={false} axisLine={false} tick={<CountryTick />} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip content={<TipContent />} />
          <Legend />
          <Bar dataKey="pos" stackId="a" fill="#22c55e" name="POS" />
          <Bar dataKey="ecom" stackId="a" fill="#3b82f6" name="E-COM" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------- //
// compute + App                       //
// ---------------------------------- //
type Channel = "ALL" | "POS" | "E-COM";
function compute(month: string, channel: Channel) {
  const monthTxns = txns.filter(
    (t) => monthKey(t.date) === month && (channel === "ALL" || t.channel === channel)
  );

  const byUser: Record<string, { total: number; pos: number; counts: Record<string, number> }> =
    {};
  const byCountry: Record<string, { pos: number; ecom: number; total: number }> =
    {};

  for (const t of monthTxns) {
    byUser[t.userId] ??= { total: 0, pos: 0, counts: {} };
    byUser[t.userId].total += t.amountUSD;
    if (t.channel === "POS") byUser[t.userId].pos += t.amountUSD;
    byUser[t.userId].counts[t.country] = 1 + (byUser[t.userId].counts[t.country] ?? 0);

    byCountry[t.country] ??= { pos: 0, ecom: 0, total: 0 };
    if (t.channel === "POS") byCountry[t.country].pos += t.amountUSD;
    else byCountry[t.country].ecom += t.amountUSD;
    byCountry[t.country].total += t.amountUSD;
  }

  const rows: Row[] = Object.entries(byUser)
    .map(([uid, v]) => {
      const alias = users.find((u) => u.id === uid)?.alias ?? uid;
      const topCountry =
        Object.entries(v.counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "US";
      const posPct = v.total ? v.pos / v.total : 0;
      const tierInfo = tiersFor(v.total);
      const badges = [
        v.total > 1000 ? "High Roller" : "",
        posPct > 0.6 ? "POS Pro" : "",
        topCountry === "SA" ? "KSA Shopper" : "",
      ].filter(Boolean) as string[];
      return {
        rank: 0,
        alias,
        total: v.total,
        topCountry,
        posPct,
        badges,
        tier: tierInfo.current as Row["tier"],
      };
    })
    .sort((a, b) => b.total - a.total)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const countryData = Object.entries(byCountry).map(([code, v]) => ({
    code,
    ...v,
  }));
  const totals = monthTxns.reduce((acc, t) => acc + t.amountUSD, 0);

  return { rows, countryData, totals, userCount: Object.keys(byUser).length };
}

export default function FXLeaderboardApp() {
  const defaultMonth = MONTHS[MONTHS.length - 1];
  const [month, setMonth] = React.useState(defaultMonth);
  const [channel, setChannel] = React.useState<Channel>("ALL");

  const { rows, countryData, totals, userCount } = React.useMemo(
    () => compute(month, channel),
    [month, channel]
  );
  const top3 = rows.slice(0, 3);

  React.useEffect(() => {
    console.assert(MONTHS.length === 12, "Expected 12 months in dataset");
    const presentCountries = new Set(countryData.map((d) => d.code));
    COUNTRIES.forEach((c) =>
      console.assert(presentCountries.has(c), `Country ${c} missing in month ${month}`)
    );
  }, [month, countryData]);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-wider text-slate-600">
              BRAC Bank • Demo
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
              Cross-Border FX Leaderboard
            </h1>
            <p className="text-slate-500">
              Gamified rankings to drive international usage and loyalty.
            </p>
          </div>
          <Filters
            month={month}
            setMonth={setMonth}
            channel={channel}
            setChannel={setChannel}
            months={MONTHS}
          />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-10 md:grid-cols-3">
        <Card className="md:col-span-3">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat
              icon={<Globe2 className="h-5 w-5" />}
              label="FX Volume (USD)"
              value={formatUSD(totals)}
            />
            <Stat
              icon={<Trophy className="h-5 w-5" />}
              label="Active Users"
              value={String(userCount)}
            />
            <Stat
              icon={<Gauge className="h-5 w-5" />}
              label="Avg/User"
              value={formatUSD(userCount ? Math.round(totals / userCount) : 0)}
            />
            <Stat
              icon={<Crown className="h-5 w-5" />}
              label="Top Tier"
              value={rows[0]?.tier ?? "—"}
            />
          </div>
        </Card>

        <Card className="md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Leaderboard</h2>
            <span className="text-xs text-slate-500">
              Month: {month} • Channel: {channel}
            </span>
          </div>
          <LeaderboardTable rows={rows} />
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Country Mix (POS vs E-COM)</h2>
          </div>
          <BarByCountry data={countryData} />
        </Card>

        <Card className="md:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Rewards Tiers</h2>
            <div className="text-xs text-slate-500">
              Explorer • Voyager • Globetrotter • Platinum Traveller
            </div>
          </div>
          <TiersLegend />

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {top3.map((u) => {
              const t = tiersFor(u.total);
              const pct = Math.min(100, (u.total / 2000) * 100); // scaled to Platinum (2k)
              return (
                <div key={u.alias} className="rounded-xl border p-4">
                  <div className="text-sm text-slate-500">{u.alias}</div>
                  <div className="text-xl font-semibold">{u.tier}</div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          "linear-gradient(90deg,#0ea5e9,#22c55e)",
                      }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {Math.round(pct)}% to Platinum
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {t.next ? `${t.next.name} in ${formatUSD(t.remaining)}` : "Top tier reached"}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </main>
    </div>
  );
}

function TiersLegend() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {TIERS.map((t) => (
        <div key={t.name} className="rounded-xl border p-4">
          <div className="text-sm text-slate-500">{t.name}</div>
          <div className="text-xl font-semibold">
            ${t.threshold.toLocaleString()}+
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
