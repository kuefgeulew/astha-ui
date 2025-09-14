// ---------- Foreign Txn Dashboard ----------
import React, { useMemo, useState, Suspense } from "react";

const DISPLAY_NAME = "Nazia Haque";

/**
 * Lazy-load the leaderboard app you provided.
 * File location: src/fx_leaderboard_app.tsx (or .jsx)
 */
// @ts-ignore – allow importing a single-file app
const FXLeaderboard = React.lazy(() => import("../fx_leaderboard_app"));

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

/* ---------- Mini charts ---------- */
function Sparkline({
  values,
  height = 60,
  width = 340,
}: {
  values: number[];
  height?: number;
  width?: number;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const h = height;
  const w = width;
  const step = w / (values.length - 1);
  const norm = (v: number) =>
    max === min ? h / 2 : h - ((v - min) / (max - min)) * h;
  const points = values
    .map((v, i) => `${i * step},${norm(v).toFixed(2)}`)
    .join(" ");
  const last = values[values.length - 1];
  const prev = values[values.length - 2] ?? last;
  const up = last >= prev;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" height={h}>
      <polyline
        fill="none"
        stroke={up ? "#10b981" : "#ef4444"}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

function BarChartXY({
  values,
  labels,
  height = 160,
  width = 340,
  color = "#2563eb",
  yTicks = 5,
  unit = "$",
}: {
  values: number[];
  labels: string[];
  height?: number;
  width?: number;
  color?: string;
  yTicks?: number;
  unit?: string;
}) {
  const maxVal = Math.max(...values, 1);
  const padding = { top: 10, right: 8, bottom: 26, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barW = innerW / values.length - 8;
  const x = (i: number) => padding.left + i * (barW + 8);
  const y = (v: number) => padding.top + innerH - (v / maxVal) * innerH;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxVal / yTicks) * i)
  );
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" height={height}>
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={padding.left}
          x2={width - padding.right}
          y1={y(t)}
          y2={y(t)}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}
      <line
        x1={padding.left}
        x2={padding.left}
        y1={padding.top}
        y2={height - padding.bottom}
        stroke="#94a3b8"
      />
      <line
        x1={padding.left}
        x2={width - padding.right}
        y1={height - padding.bottom}
        y2={height - padding.bottom}
        stroke="#94a3b8"
      />
      {ticks.map((t, i) => (
        <text
          key={i}
          x={padding.left - 6}
          y={y(t)}
          textAnchor="end"
          alignmentBaseline="middle"
          fontSize="10"
          fill="#475569"
        >
          {unit}
          {t}
        </text>
      ))}
      {values.map((v, i) => (
        <g key={i}>
          <rect
            x={x(i)}
            y={y(v)}
            width={barW}
            height={Math.max(2, height - padding.bottom - y(v))}
            rx={4}
            fill={color}
          />
          <text
            x={x(i) + barW / 2}
            y={height - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
          >
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ---------- Main screen ---------- */
export default function ForeignDashboard({
  nickname,
  setNickname,
}: {
  nickname: string;
  setNickname: (s: string) => void;
}) {
  const [editNick, setEditNick] = useState(false);
  const [nickInput, setNickInput] = useState(nickname);
  const [showRanks, setShowRanks] = useState(false);
  const [showFX, setShowFX] = useState(false); // overlay for FX leaderboard

  const data = {
    yearlySpendUSD: 980,
    highestCountry: "UAE",
    cashbackBDT: 1150,
    rewardPts: 3890,
    rankInTier: 18,
    totalInTier: 240,
    // ⬇️ use the FX app’s tier names
    tierList: [
      "Explorer",
      "Voyager",
      "Globetrotter",
      "Platinum Traveller",
    ] as const,
    tierIndex: 0, // Explorer
    qSpend: [220, 260, 310, 190],
    qLabels: ["Q1", "Q2", "Q3", "Q4"],
    monthlyTrend: [60, 70, 75, 85, 100, 92, 105, 110, 120, 80, 45, 38],
    yearlyHistory: [
      { year: 2023, usd: 640 },
      { year: 2024, usd: 820 },
      { year: 2025, usd: 980 },
    ],
    perCountry: [
      { country: "UAE", amt: 350 },
      { country: "Singapore", amt: 180 },
      { country: "Thailand", amt: 140 },
      { country: "Malaysia", amt: 120 },
      { country: "UK", amt: 110 },
      { country: "Turkey", amt: 80 },
    ],
    fxRate: 109.5,
    fxChange: 0.6,
    fxSpikes: [
      { date: "2025-08-30", pair: "USD/BDT", change: 1.2, note: "USD strength" },
      { date: "2025-08-26", pair: "EUR/BDT", change: -0.8, note: "Euro soft" },
      { date: "2025-08-18", pair: "GBP/BDT", change: 0.9, note: "BoE tone" },
    ],
    nextTierSpendLeft: 650,
    offers: [
      { title: "NovoAir", text: "10% off base fare", tag: "FLIGHT" },
      { title: "AirAstra", text: "10% off intl routes", tag: "FLIGHT" },
      { title: "Go Zayaan", text: ">15% hotel deals", tag: "TRAVEL" },
      { title: "Marriott", text: "12% off rooms", tag: "HOTEL" },
      { title: "Starbucks", text: "5% cashback", tag: "DINING" },
    ],
    subs: [
      { name: "Netflix", usd: 9.99, cycle: "Monthly", next: "2025-10-12" },
      { name: "Spotify", usd: 3.99, cycle: "Monthly", next: "2025-10-06" },
      { name: "iCloud", usd: 0.99, cycle: "Monthly", next: "2025-09-28" },
    ],
    suggestions: [
      "Switch Spotify to annual and save ~10%",
      "Use Horizon virtual card for online subs for added security",
      "Set a budget alert for UAE spends over $200 in a week",
    ],
  } as const;

  const rankPct = Math.max(
    0,
    Math.min(100, (1 - (data.rankInTier - 1) / data.totalInTier) * 100)
  );

  // deterministic leaderboard for the modal (unchanged)
  const leaderboard = useMemo(() => {
    const list: { name: string; amount: number }[] = [];
    const seed = 1234;
    const rand = (n: number) => {
      const x = Math.sin(n + seed) * 10000;
      return x - Math.floor(x);
    };
    for (let i = 1; i <= data.totalInTier; i++) {
      if (i === 18) {
        list.push({ name: DISPLAY_NAME, amount: data.yearlySpendUSD });
      } else {
        const r = rand(i);
        const amount = Math.round(150 + r * 1250);
        list.push({ name: `User-${i.toString().padStart(3, "0")}`, amount });
      }
    }
    list.sort((a, b) => b.amount - a.amount);
    const ranked = list.map((p, idx) => ({ ...p, rank: idx + 1 }));
    const naziaIndex = ranked.findIndex((p) => p.name === DISPLAY_NAME);
    if (naziaIndex !== 17) {
      const target = ranked.splice(naziaIndex, 1)[0];
      ranked.splice(17, 0, target);
      ranked.forEach((p, i) => ((p as any).rank = i + 1));
    }
    return ranked;
  }, []);

  return (
    <div className="space-y-5 p-4 pb-40">
      {/* Header + nickname + NEW top-right Leaderboard button */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-5 text-white shadow-xl">
        <button
          onClick={() => setShowFX(true)}
          className="absolute right-3 top-3 rounded-full bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25"
          title="Open FX Leaderboard"
        >
          Leaderboard
        </button>

        <div className="text-sm opacity-90">Foreign Transactions</div>
        <div className="mt-1 text-2xl font-semibold">
          ${data.yearlySpendUSD.toLocaleString()} yearly spend
        </div>
        <div className="mt-1 text-xs">
          Highest in <span className="font-semibold">{data.highestCountry}</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="opacity-90">Nickname:</span>
          {!editNick ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5">
              <span className="font-semibold">{nickname}</span>
              <button
                className="rounded p-0.5 hover:bg-white/10"
                onClick={() => {
                  setNickInput(nickname);
                  setEditNick(true);
                }}
              >
                ✎
              </button>
            </span>
          ) : (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                const v = nickInput.trim();
                if (v) {
                  setNickname(v);
                  localStorage.setItem("astha_nickname", v);
                }
                setEditNick(false);
              }}
            >
              <input
                value={nickInput}
                onChange={(e) => setNickInput(e.target.value)}
                maxLength={20}
                className="h-6 rounded bg-white/10 px-2 text-white placeholder-white/70 outline-none"
                placeholder="new nickname"
              />
              <button className="rounded bg-white/20 px-2 py-0.5 text-[11px]">
                Save
              </button>
              <button
                type="button"
                className="rounded bg-white/10 px-2 py-0.5 text-[11px]"
                onClick={() => setEditNick(false)}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* KPI widgets */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="text-xs text-slate-500">BDT→USD FX rate</div>
          <div className="mt-1 text-xl font-semibold">109.50</div>
          <div className="text-xs text-emerald-600">▲0.6%</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="text-xs text-slate-500">Next Tier</div>
          <div className="mt-2 text-sm">
            Spend <span className="font-medium">${data.nextTierSpendLeft}</span>{" "}
            more to reach Platinum
          </div>
        </div>
      </div>

      {/* Tier + rank */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Tier</div>

            {/* Clicking “Explorer” opens the FX Leaderboard overlay.
                Use the small "(view ranks)" link to open the ranking table modal. */}
            <button
              className="mt-1 font-semibold text-blue-700 underline underline-offset-4"
              onClick={() => setShowFX(true)}
              title="Open FX Leaderboard"
            >
              Explorer
            </button>
          </div>
          <div className="flex gap-1">
            {data.tierList.map((_, i) => (
              <div
                key={i}
                className={classNames(
                  "h-2 w-8 rounded-full",
                  i <= data.tierIndex ? "bg-indigo-600" : "bg-slate-200"
                )}
              />
            ))}
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>
              Rank in tier{" "}
              <button
                className="ml-2 rounded px-1 text-[11px] underline underline-offset-2"
                onClick={() => setShowRanks(true)}
                title="View ranking table"
              >
                (view ranks)
              </button>
            </span>
            <span>
              #{data.rankInTier} of {data.totalInTier}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-indigo-600"
              style={{ width: `${rankPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quarterly graph */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="mb-2 text-sm font-semibold">Quarterly spend</div>
        <BarChartXY
          values={data.qSpend}
          labels={data.qLabels}
          color="#1d4ed8"
          unit="$"
        />
      </div>

      {/* Monthly sparkline */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-semibold">Monthly trend</div>
          <div className="text-xs text-slate-500">Jan–Dec</div>
        </div>
        <Sparkline values={data.monthlyTrend} height={60} />
      </div>

      {/* Year-wise spend */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="mb-2 text-sm font-semibold">Year-wise spend (USD)</div>
        <BarChartXY
          values={data.yearlyHistory.map((y) => y.usd)}
          labels={data.yearlyHistory.map((y) => String(y.year))}
          color="#4f46e5"
          unit="$"
        />
      </div>

      {/* Spend by country */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="mb-2 text-sm font-semibold">Spend by country</div>
        <div className="space-y-2 text-sm">
          {data.perCountry.map((c, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{i + 1}.</span>
                <span>{c.country}</span>
              </div>
              <div className="font-medium">${c.amt}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active subscriptions */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="mb-2 text-sm font-semibold">
          Active foreign subscriptions
        </div>
        <div className="space-y-2">
          {data.subs.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border p-3 text-sm"
            >
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-slate-600">
                  {s.cycle} • Next: {s.next}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-medium">${s.usd.toFixed(2)}</div>
                <button className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs text-white">
                  Pay with Horizon
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="mb-2 text-sm font-semibold">Suggestions</div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {data.suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      {/* FX spikes */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="mb-2 text-sm font-semibold">FX Spike Alerts</div>
        <div className="space-y-2">
          {data.fxSpikes.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border p-2 text-sm"
            >
              <div>
                <div className="font-medium">{s.pair}</div>
                <div className="text-xs text-slate-600">
                  {s.date} — {s.note}
                </div>
              </div>
              <div
                className={classNames(
                  "rounded-full px-2 py-0.5 text-xs",
                  s.change >= 0
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                )}
              >
                {s.change >= 0 ? `+${s.change}%` : `${s.change}%`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offers carousel */}
      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="mb-2 text-sm font-semibold">International offers</div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {data.offers.map((o, i) => (
            <div
              key={i}
              className="min-w-[180px] rounded-2xl border bg-gradient-to-b from-white to-slate-50 p-3 shadow"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{o.tag}</span>
                <span className="text-indigo-600">★</span>
              </div>
              <div className="mt-1 text-sm font-semibold">{o.title}</div>
              <div className="text-xs text-slate-600">{o.text}</div>
              <button className="mt-2 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] text-white">
                Apply offer
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking modal (title updated to Explorer) */}
      {showRanks && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="text-lg font-semibold">Explorer Tier Ranking</div>
              <button
                className="rounded px-2 py-1 text-sm hover:bg-slate-100"
                onClick={() => setShowRanks(false)}
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-2">
              {leaderboard.map((p, i) => (
                <div
                  key={i}
                  className={classNames(
                    "flex items-center justify-between rounded-lg p-2 text-sm",
                    p.name === DISPLAY_NAME
                      ? "bg-indigo-50"
                      : i % 2
                      ? "bg-white"
                      : "bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-right font-medium">
                      {(p as any).rank}
                    </div>
                    <div>{p.name}</div>
                  </div>
                  <div className="font-medium">${p.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FX Leaderboard overlay (lazy-loaded) */}
      {showFX && (
        <div className="fixed inset-0 z-[70] bg-black/60 p-3">
          <div className="relative mx-auto h-[95vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
              <a
                href="/fx-leaderboard"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white"
                title="Open full page"
              >
                Open full page
              </a>
              <button
                onClick={() => setShowFX(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs"
                title="Close"
              >
                Close
              </button>
            </div>

            <div className="h-full overflow-y-auto">
              <Suspense
                fallback={
                  <div className="grid h-full place-items-center text-slate-600">
                    Loading FX Leaderboard…
                  </div>
                }
              >
                <FXLeaderboard />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
