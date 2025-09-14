// src/screens/streak/StreakScreen.tsx
import React, { useMemo } from "react";
import { Flame, CalendarDays, ArrowLeft, Gift } from "lucide-react";
import { motion } from "framer-motion";

const BB_YELLOW = "#F6C34C";

/* ================= Utilities (deterministic fake data) ================= */
const seedHash = (s: string) => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const seededBool = (seed: string, threshold = 0.65) =>
  (seedHash(seed) % 1000) / 1000 < threshold;

function bestStreakInMonth(y: number, m: number, cutoff?: number) {
  const days = new Date(y, m + 1, 0).getDate();
  let best = 0, cur = 0;
  for (let d = 1; d <= days; d++) {
    if (cutoff && d > cutoff) break;
    if (seededBool(`${y}-${m + 1}-${d}`)) { cur++; best = Math.max(best, cur); } else { cur = 0; }
  }
  return best;
}

function monthStats(y: number, m: number, cutoff?: number) {
  const days = new Date(y, m + 1, 0).getDate();
  let total = 0;
  for (let d = 1; d <= days; d++) {
    if (cutoff && d > cutoff) break;
    if (seededBool(`${y}-${m + 1}-${d}`)) total++;
  }
  return {
    totalLogins: total,
    considered: cutoff ? Math.min(days, cutoff) : days,
    bestStreak: bestStreakInMonth(y, m, cutoff),
  };
}

/* ================= Action cycle ================= */
const ACTIONS_BD = [
  "QR Payment",
  "FlexiLoad",
  "Electricity Bill",
  "Gas Bill",
  "Water Bill",
  "Internet Bill",
  "Cable/DTH Bill",
  "Education Fees",
  "Card Bill",
  "Loan Installment",
  "Cash-in to bKash",
  "Foreign Txn",
  "Transfer – NPSB",
  "Transfer – BEFTN/RTGS",
  "Open FDR/DPS",
  "Deposit to Savings",
  "Add Beneficiary",
  "Standing Instruction",
  "Rewards Viewed",
  "Chatbot Used",
];

function useActionProgress() {
  return useMemo(() => {
    const seedBase = new Date().getFullYear() + "-overall";
    return ACTIONS_BD.map((label, i) => {
      const t = 0.45 + (i % 7) * 0.035; // varied difficulty
      return { label, done: seededBool(seedBase + label, t) };
    });
  }, []);
}

/* ================= Component ================= */
export default function StreakScreen({ onBack }: { onBack?: () => void }) {
  // Fixed to your spec: treat "today" as 21 Sep 2025
  const year = 2025;
  const nowMonth = 8; // Sep (0-based)
  const actions = useActionProgress();
  const doneCount = actions.filter((a) => a.done).length;
  const pct = Math.round((doneCount / actions.length) * 100);
  const allDone = doneCount === actions.length;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0b63b6] to-[#0a4f90] text-white">
      <div className="mx-auto max-w-5xl px-5 pb-12 pt-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                onClick={onBack}
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="text-lg font-semibold tracking-wide">Astha Streak</div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
            <Flame className="h-4 w-4 text-yellow-300" />
            <span className="text-sm">
              {doneCount}/{ACTIONS_BD.length} features
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Action cycle */}
          <div className="flex flex-col items-center rounded-3xl bg-white/5 p-6 shadow-xl ring-1 ring-white/10">
            <div className="mb-3 text-sm opacity-90">
              Complete all features to unlock 2000 reward points
            </div>
            <div className="relative flex h-[280px] w-[280px] items-center justify-center">
              <svg viewBox="0 0 36 36" className="absolute h-full w-full -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="white"
                  strokeOpacity="0.15"
                  strokeWidth="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke={BB_YELLOW}
                  strokeWidth="4"
                  strokeDasharray={`${pct}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <motion.div
                key={pct}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="text-4xl font-extrabold">{pct}%</div>
                <div className="text-xs opacity-80">Cycle Progress</div>
                {allDone && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-100 ring-1 ring-emerald-300/30">
                    <Gift className="h-4 w-4" /> Reward: 2,000 pts
                  </div>
                )}
              </motion.div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
              {actions.map((a) => (
                <div
                  key={a.label}
                  className={`rounded-lg px-2 py-1 text-center ${
                    a.done ? "bg-yellow-400 text-black" : "bg-white/20"
                  }`}
                >
                  {a.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login streak (last 3 months vertically; Sept stops at day 21) */}
          <div className="rounded-3xl bg-white p-6 text-slate-800 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <div className="text-[15px] font-semibold">Login streak — {year}</div>
              </div>
            </div>

            {[8, 7, 6].map((m) => (
              <MonthRow key={m} year={year} month={m} cutoff={m === nowMonth ? 21 : undefined} />
            ))}

            {/* Past months (Jan–Jun) toggle */}
            <details className="mt-4">
              <summary className="cursor-pointer select-none text-sm text-blue-600">
                Show January – June
              </summary>
              <div className="mt-3 space-y-5">
                {[5, 4, 3, 2, 1, 0].map((m) => (
                  <MonthRow key={m} year={year} month={m} />
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= Month Row (GitHub-style heatmap) ================= */
function MonthRow({
  year,
  month,
  cutoff,
}: {
  year: number;
  month: number;
  cutoff?: number;
}) {
  const monthName = new Date(year, month, 1).toLocaleString("en-US", { month: "long" });
  const days = new Date(year, month + 1, 0).getDate();
  const considered = cutoff ? Math.min(days, cutoff) : days;

  // Build columns (Mon–Sun), padding first week to Monday
  const columns: boolean[][] = [];
  let col: boolean[] = [];
  const dow0 = new Date(year, month, 1).getDay(); // 0=Sun
  const pad = (dow0 + 6) % 7; // shift so Monday=0
  for (let i = 0; i < pad; i++) col.push(false);

  let dayNum = 0;
  for (let d = 1; d <= considered; d++) {
    dayNum = d;
    const active = seededBool(`${year}-${month + 1}-${d}`);
    col.push(active);
    if (col.length === 7) {
      columns.push(col);
      col = [];
    }
  }
  if (col.length) columns.push([...col, ...Array(7 - col.length).fill(false)]);

  const stats = monthStats(year, month, cutoff);

  // Utility to reconstruct real day number for tooltip from column/row index
  const dayNumberAt = (colIdx: number, rowIdx: number) => {
    // total offset days before first real day
    const offset = pad;
    const idx = colIdx * 7 + rowIdx - offset + 1; // 1-based day
    return idx;
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-700">{monthName}</div>
      </div>
      <div className="flex items-start gap-4">
        {/* weekday labels */}
        <div className="mt-[2px] grid w-8 grid-rows-3 gap-6 select-none text-xs text-slate-400">
          <div>Mon</div>
          <div>Wed</div>
          <div>Fri</div>
        </div>

        {/* heatmap - tight tiles */}
        <div className="w-fit rounded-2xl bg-slate-900 p-3 text-white ring-1 ring-slate-800">
          <div className="flex">
            {columns.map((c, i) => (
              <div key={i} className="grid grid-rows-7 gap-0">
                {c.map((v, j) => {
                  const inferredDay = dayNumberAt(i, j);
                  const inRange = inferredDay >= 1 && inferredDay <= considered;
                  return (
                    <div
                      key={j}
                      className={`m-[1px] h-3 w-3 rounded-[3px] ${
                        inRange ? (v ? "bg-blue-600" : "bg-slate-700") : "bg-transparent"
                      }`}
                      title={
                        inRange
                          ? `${monthName} ${inferredDay}, ${year}`
                          : ""
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* summary card */}
        <div className="ml-2 rounded-2xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
          <div className="text-slate-600">This month</div>
          <div className="mt-1 text-slate-900">
            <span className="font-semibold">{stats.totalLogins}</span> / {stats.considered} logins
          </div>
          <div className="mt-1 text-slate-900">
            Best streak: <span className="font-semibold">{stats.bestStreak} days</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span className="inline-block h-3 w-3 rounded-[3px] bg-blue-600 align-middle" /> login&nbsp;
            <span className="inline-block h-3 w-3 rounded-[3px] bg-slate-700 align-middle" /> missed
          </div>
        </div>
      </div>
    </div>
  );
}
