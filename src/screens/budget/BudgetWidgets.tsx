import React from "react";
import {
  getJar,
  getSharedPot,
  getPoints,
  getBadges,
  getTopCategories,
  getWeeklyDigest,
  touchStreakToday,
  getStreak,
} from "./budgetStore";

/* ===================== StreakCard ===================== */
export function StreakCard() {
  // Ping streak on mount to keep it lively
  React.useEffect(() => {
    touchStreakToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [streak, setStreak] = React.useState(getStreak());
  React.useEffect(() => {
    const t = setInterval(() => setStreak(getStreak()), 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
      <div className="text-[15px] font-semibold text-slate-800">Daily Streak</div>
      <div className="mt-2 flex items-end gap-6">
        <div>
          <div className="text-3xl font-extrabold text-blue-700">{streak.current}🔥</div>
          <div className="text-xs text-slate-500">Current</div>
        </div>
        <div>
          <div className="text-xl font-bold text-slate-800">{streak.best}</div>
          <div className="text-xs text-slate-500">Best</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Come back daily to grow your streak and unlock badges.
      </div>
    </div>
  );
}

/* ===================== JarCard ===================== */
export function JarCard() {
  const [jar, setJar] = React.useState(getJar());
  const [pot, setPot] = React.useState(getSharedPot());

  // poll lightly to reflect updates from actions
  React.useEffect(() => {
    const t = setInterval(() => {
      setJar(getJar());
      setPot(getSharedPot());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-white p-4 shadow ring-1 ring-amber-200/60">
      <div className="text-[15px] font-semibold text-amber-900">Savings Jar & Shared Pot</div>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-amber-800/80">Jar</div>
          <div className="text-2xl font-extrabold text-amber-900">BDT {jar.toLocaleString("en-BD")}</div>
        </div>
        <div>
          <div className="text-xs text-slate-600">Shared Pot</div>
          <div className="text-2xl font-extrabold text-slate-800">BDT {pot.toLocaleString("en-BD")}</div>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-amber-900/80">
        Weekly round-ups are auto-split 70/30 into these balances.
      </div>
    </div>
  );
}

/* ===================== PointsBadgesCard ===================== */
export function PointsBadgesCard() {
  const [points, setPoints] = React.useState(getPoints());
  const [badges, setBadges] = React.useState(getBadges());

  React.useEffect(() => {
    const t = setInterval(() => {
      setPoints(getPoints());
      setBadges(getBadges());
    }, 1200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
      <div className="text-[15px] font-semibold text-slate-800">Points & Badges</div>
      <div className="mt-2 text-2xl font-extrabold text-blue-700">{points}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {badges.length === 0 ? (
          <div className="text-xs text-slate-500">No badges yet — keep going!</div>
        ) : (
          badges.map((b) => (
            <span key={b} className="rounded-xl bg-blue-50 px-3 py-1 text-xs text-blue-900 ring-1 ring-blue-200">
              {b}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ===================== TopCategoriesCard ===================== */
export function TopCategoriesCard() {
  const top = getTopCategories(5);
  return (
    <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
      <div className="text-[15px] font-semibold text-slate-800">Top Categories (by spend)</div>
      <div className="mt-3 space-y-3">
        {top.map((c) => (
          <div key={c.id}>
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium text-slate-800">{c.name}</div>
              <div className="text-xs text-slate-500">
                BDT {c.spend.toLocaleString("en-BD")} / {c.cap.toLocaleString("en-BD")}
              </div>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${c.pct >= 90 ? "bg-red-500" : c.pct >= 75 ? "bg-amber-500" : "bg-blue-500"}`}
                style={{ width: `${c.pct}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-slate-500">{c.period.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== WeeklyDigestCard ===================== */
export function WeeklyDigestCard() {
  const d = getWeeklyDigest();
  return (
    <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
      <div className="text-[15px] font-semibold text-slate-800">Weekly Digest</div>
      <div className="mt-1 text-xs text-slate-500">{d.week}</div>
      <div className="mt-2 text-2xl font-extrabold text-slate-800">
        Total spend: BDT {d.totalSpend.toLocaleString("en-BD")}
      </div>

      <div className="mt-3">
        <div className="text-xs font-semibold text-slate-700">Top merchants</div>
        <div className="mt-1 flex flex-wrap gap-2">
          {d.topMerchants.map((m) => (
            <span key={m.name} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {m.name}: BDT {m.amount.toLocaleString("en-BD")}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-xs font-semibold text-slate-700">Recent transactions</div>
        <div className="mt-1 space-y-1 text-xs text-slate-600">
          {d.tx.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1">
              <div>{t.merchant} — {t.category}</div>
              <div className="font-medium">BDT {t.amount.toLocaleString("en-BD")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
