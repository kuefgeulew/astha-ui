// src/screens/budget/BudgetOverlay.tsx
import React, { useMemo, useState } from "react";
import { ArrowLeft, Check, AlertTriangle, Sliders } from "lucide-react";
import usePredictiveAlerts from "./usePredictiveAlerts";
import {
  getBudgetsByPeriod,
  allocateWeeklyRoundupsSplit,
} from "./budgetStore";
import {
  StreakCard,
  JarCard,
  PointsBadgesCard,
  TopCategoriesCard,
  WeeklyDigestCard,
} from "./BudgetWidgets";
import BudgetPlanDrawer from "./BudgetPlanDrawer";

export default function BudgetOverlay({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"setup" | "tracker" | "insights">("tracker");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const alerts = usePredictiveAlerts(30000);

  const daily = useMemo(() => getBudgetsByPeriod("daily"), [version]);
  const weekly = useMemo(() => getBudgetsByPeriod("weekly"), [version]);
  const monthly = useMemo(() => getBudgetsByPeriod("monthly"), [version]);

  const [allocState, setAllocState] = useState<{ done: boolean; added?: { jarAdd: number; potAdd: number; total: number } }>({ done: false });

  function runAllocate() {
    const res = allocateWeeklyRoundupsSplit();
    setAllocState({ done: true, added: res });
    setTimeout(() => setAllocState({ done: false }), 2500);
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 h-[92vh] w-[min(1100px,96vw)] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
          <button className="rounded-full p-2 hover:bg-white/10" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-lg font-semibold">Budgets</div>
          <div />
        </div>

        {/* tabs */}
        <div className="flex items-center gap-2 bg-blue-700 px-4 pb-3">
          {(["setup", "tracker", "insights"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-sm ${
                tab === t ? "bg-white text-blue-700" : "text-white/90 hover:bg-white/10"
              }`}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ALERTS */}
        {alerts.length > 0 && (
          <div className="mx-4 mt-3 space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ring-1 ${
                  a.level === "critical"
                    ? "bg-red-50 text-red-900 ring-red-200"
                    : "bg-amber-50 text-amber-900 ring-amber-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    <b>{a.merchant}</b> is at{" "}
                    <b>{Math.round(a.usage * 100)}%</b> of weekly cap (BDT {a.cap.toLocaleString("en-BD")}).
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="rounded-full bg-white/80 px-2 py-0.5 text-xs ring-1 ring-black/10"
                >
                  Adjust cap
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="h-[calc(92vh-142px)] overflow-y-auto px-5 pb-8 pt-4">
          {tab === "setup" && (
            <div className="mx-auto max-w-4xl space-y-5">
              {/* Top action */}
              <div className="flex justify-end">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
                >
                  <Sliders className="h-4 w-4" />
                  Customize plan
                </button>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
                <div className="text-slate-800">
                  <div className="text-[15px] font-semibold">Daily budget</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Choose your daily cap and categories to enforce.
                  </div>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {daily.map((b) => (
                    <div key={b.id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                      <div className="font-semibold text-slate-800">{b.name}</div>
                      <div className="mt-1 text-xs text-slate-500">Cap: BDT {b.cap.toLocaleString("en-BD")}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
                <div className="text-[15px] font-semibold text-slate-800">Weekly budgets</div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {weekly.map((b) => (
                    <div key={b.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                      <div className="font-semibold text-slate-800">{b.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Spend: BDT {b.spend.toLocaleString("en-BD")} / Cap: BDT {b.cap.toLocaleString("en-BD")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "tracker" && (
            <div className="mx-auto max-w-5xl space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <StreakCard />
                <JarCard />
              </div>

              <WeeklyDigestCard />

              <div className="grid gap-4 md:grid-cols-2">
                <TopCategoriesCard />
                <PointsBadgesCard />
              </div>

              <div className="mt-2 flex items-center justify-end">
                <button
                  onClick={runAllocate}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
                >
                  <Check className="h-4 w-4" />
                  Apply weekly round-ups split (70/30)
                </button>
              </div>

              {allocState.done && allocState.added && (
                <div className="mt-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
                  Round-ups allocated — Jar +BDT {allocState.added.jarAdd}, Shared Pot +BDT {allocState.added.potAdd} (Total {allocState.added.total})
                </div>
              )}
            </div>
          )}

          {tab === "insights" && (
            <div className="mx-auto max-w-4xl">
              <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
                <div className="text-[15px] font-semibold text-slate-800">Monthly budgets</div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {monthly.map((b) => (
                    <div key={b.id} className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                      <div className="font-semibold text-slate-800">{b.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Spend: BDT {b.spend.toLocaleString("en-BD")} / Cap: BDT {b.cap.toLocaleString("en-BD")}
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${Math.min(100, (b.spend / b.cap) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Tip: set merchant caps for impulse control; we’ll warn before you breach.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer mount */}
      <BudgetPlanDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={() => {
          setVersion((v) => v + 1); // refresh cards after saving
        }}
      />
    </div>
  );
}
