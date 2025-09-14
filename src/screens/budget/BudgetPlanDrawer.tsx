// src/screens/budget/BudgetPlanDrawer.tsx
import React from "react";
import { X, Save, Plus, Trash2, AlertTriangle } from "lucide-react";

// Runtime imports
import {
  loadPlan,
  loadBudgets,
  saveBudgets,
  loadPrefs,
  savePrefs,
  loadCategoryAlerts,
  saveCategoryAlerts,
  loadMerchantCaps,
  saveMerchantCaps,
  loadSeasonBoosts,
  saveSeasonBoosts,
  upsertAlert,
  setBudgetCap,
  calcCashFlowGuardrail,
  getAISuggestions,
  getMerchantCapStatus,
} from "./budgetStore";

// Type-only imports (fixes the “does not provide an export” error)
import type {
  BudgetCategory,
  CategoryAlert,
  MerchantCap,
  SeasonBoost,
  BudgetPrefs,
} from "./budgetStore";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

const section = "rounded-2xl bg-white p-4 shadow ring-1 ring-black/5";

export default function BudgetPlanDrawer({ open, onClose, onSaved }: Props) {
  const mounted = React.useRef(false);

  // local editable copies
  const [budgets, setBudgets] = React.useState<BudgetCategory[]>([]);
  const [alerts, setAlerts] = React.useState<CategoryAlert[]>([]);
  const [caps, setCaps] = React.useState<MerchantCap[]>([]);
  const [seasons, setSeasons] = React.useState<SeasonBoost[]>([]);
  const [prefs, setPrefs] = React.useState<BudgetPrefs | null>(null);

  React.useEffect(() => {
    if (!open) return;
    // load everything fresh
    const p = loadPlan();
    setBudgets(p.budgets);
    setAlerts(p.alerts);
    setCaps(p.merchantCaps);
    setSeasons(p.seasons);
    setPrefs(p.prefs);
    mounted.current = true;
  }, [open]);

  if (!open || !prefs) return null;

  const guard = calcCashFlowGuardrail(prefs.monthlyIncomeBDT, budgets, seasons);
  const suggestions = getAISuggestions(budgets);
  const mStatus = getMerchantCapStatus("weekly");

  function saveAll() {
    saveBudgets(budgets);
    savePrefs(prefs);
    saveCategoryAlerts(alerts);
    saveMerchantCaps(caps);
    saveSeasonBoosts(seasons);
    onSaved?.();
    onClose();
  }

  function updateAlert(categoryId: string, threshold: number) {
    const next = upsertAlert([...alerts], categoryId, Math.max(0, Math.round(threshold)));
    setAlerts(next);
  }

  function updateCap(id: string, scope: "weekly" | "monthly", value: number) {
    const next = caps.map((c) =>
      c.id === id ? { ...c, [scope === "weekly" ? "weeklyCap" : "monthlyCap"]: Math.max(0, Math.round(value)) } : c
    );
    setCaps(next);
  }

  function updateBudgetCap(id: string, cap: number) {
    const next = setBudgetCap(budgets, id, Math.max(0, Math.round(cap)));
    setBudgets(next);
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[min(720px,96vw)] overflow-y-auto bg-gradient-to-b from-slate-50 to-white shadow-2xl ring-1 ring-black/10">
        {/* header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-blue-700 px-4 py-3 text-white">
          <div className="text-lg font-semibold">Customize Budget Plan</div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveAll}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-blue-700"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {/* Guardrail */}
          <div className={`${section} ${guard.warn ? "ring-red-200 bg-red-50" : ""}`}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[15px] font-semibold text-slate-800">Cash Flow Guardrail</div>
              {guard.warn && <AlertTriangle className="h-4 w-4 text-red-600" />}
            </div>
            <div className={`text-sm ${guard.warn ? "text-red-800" : "text-slate-700"}`}>{guard.msg}</div>
          </div>

          {/* Income & prefs */}
          <div className={section}>
            <div className="text-[15px] font-semibold text-slate-800">Plan Settings</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <div className="text-slate-600">Monthly income (BDT)</div>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  inputMode="numeric"
                  value={prefs.monthlyIncomeBDT || 0}
                  onChange={(e) => setPrefs({ ...prefs, monthlyIncomeBDT: Number(e.target.value) || 0 })}
                />
              </label>

              <label className="text-sm">
                <div className="text-slate-600">Rollover rule</div>
                <select
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  value={prefs.rolloverRule}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      rolloverRule: e.target.value as BudgetPrefs["rolloverRule"],
                    })
                  }
                >
                  <option value="none">No rollover</option>
                  <option value="daily_to_weekly">Daily → Weekly</option>
                  <option value="weekly_to_monthly">Weekly → Monthly</option>
                  <option value="full_chain">Daily → Weekly → Monthly</option>
                </select>
              </label>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.autoSavingsEnabled}
                  onChange={(e) => setPrefs({ ...prefs, autoSavingsEnabled: e.target.checked })}
                />
                Auto-savings redirect
              </label>
              <label className="text-sm">
                <div className="text-slate-600">Auto-savings %</div>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                  inputMode="numeric"
                  value={prefs.autoSavingsPercent}
                  onChange={(e) =>
                    setPrefs({ ...prefs, autoSavingsPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                  }
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.lockNonEssential}
                  onChange={(e) => setPrefs({ ...prefs, lockNonEssential: e.target.checked })}
                />
                Lock non-essential over 100%
              </label>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.familySharedEnabled}
                  onChange={(e) => setPrefs({ ...prefs, familySharedEnabled: e.target.checked })}
                />
                Family / shared budget
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.rewardBoostersEnabled}
                  onChange={(e) => setPrefs({ ...prefs, rewardBoostersEnabled: e.target.checked })}
                />
                Reward boosters
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.pushDeepLinksEnabled}
                  onChange={(e) => setPrefs({ ...prefs, pushDeepLinksEnabled: e.target.checked })}
                />
                Deep-link notifications
              </label>
            </div>
          </div>

          {/* Budgets & category alerts */}
          <div className={section}>
            <div className="mb-2 text-[15px] font-semibold text-slate-800">Category Caps & Alerts</div>
            <div className="space-y-2">
              {budgets.map((b) => {
                const a = alerts.find((x) => x.categoryId === b.id);
                return (
                  <div key={b.id} className="grid gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 md:grid-cols-3">
                    <div>
                      <div className="font-semibold text-slate-800">{b.name}</div>
                      <div className="text-[11px] text-slate-500">{b.period.toUpperCase()}</div>
                    </div>
                    <label className="text-sm">
                      <div className="text-slate-600">Cap (BDT)</div>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        inputMode="numeric"
                        value={b.cap}
                        onChange={(e) => updateBudgetCap(b.id, Number(e.target.value) || 0)}
                      />
                    </label>
                    <label className="text-sm">
                      <div className="text-slate-600">Alert threshold (BDT)</div>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        inputMode="numeric"
                        value={a?.threshold ?? ""}
                        placeholder="None"
                        onChange={(e) => updateAlert(b.id, Number(e.target.value) || 0)}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Merchant caps (editable) */}
          <div className={section}>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[15px] font-semibold text-slate-800">Merchant caps</div>
            </div>

            <div className="space-y-2">
              {caps.map((c) => {
                const status = mStatus.find((s) => s.id === c.id);
                const color =
                  status?.status === "breached"
                    ? "bg-red-50 ring-red-200"
                    : status?.status === "near"
                    ? "bg-amber-50 ring-amber-200"
                    : "bg-slate-50 ring-slate-200";
                return (
                  <div key={c.id} className={`grid gap-2 rounded-xl p-3 ring-1 md:grid-cols-3 ${color}`}>
                    <div className="font-semibold text-slate-800">{c.label}</div>
                    <label className="text-sm">
                      <div className="text-slate-600">Weekly cap (BDT)</div>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        inputMode="numeric"
                        value={c.weeklyCap}
                        onChange={(e) => updateCap(c.id, "weekly", Number(e.target.value) || 0)}
                      />
                    </label>
                    <label className="text-sm">
                      <div className="text-slate-600">Monthly cap (BDT)</div>
                      <input
                        className="mt-1 w-full rounded-xl border px-3 py-2"
                        inputMode="numeric"
                        value={c.monthlyCap}
                        onChange={(e) => updateCap(c.id, "monthly", Number(e.target.value) || 0)}
                      />
                    </label>
                    {status && (
                      <div className="md:col-span-3">
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/60">
                          <div
                            className={`h-full rounded-full ${
                              status.status === "breached"
                                ? "bg-red-500"
                                : status.status === "near"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                            }`}
                            style={{ width: `${Math.min(100, Math.round(status.usage * 100))}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-slate-600">
                          Spend: BDT {status.spend.toLocaleString("en-BD")} / Cap: BDT{" "}
                          {status.cap.toLocaleString("en-BD")}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Events / Seasons */}
          <div className={section}>
            <div className="mb-2 text-[15px] font-semibold text-slate-800">Events / Seasonal boosts</div>
            <div className="space-y-2">
              {seasons.map((s, i) => (
                <div key={s.id} className="grid gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 md:grid-cols-4">
                  <input
                    className="rounded-xl border px-3 py-2 text-sm"
                    value={s.label}
                    onChange={(e) => {
                      const next = [...seasons];
                      next[i] = { ...s, label: e.target.value };
                      setSeasons(next);
                    }}
                  />
                  <input
                    className="rounded-xl border px-3 py-2 text-sm"
                    type="date"
                    value={s.start.slice(0, 10)}
                    onChange={(e) => {
                      const next = [...seasons];
                      next[i] = { ...s, start: new Date(e.target.value).toISOString() };
                      setSeasons(next);
                    }}
                  />
                  <input
                    className="rounded-xl border px-3 py-2 text-sm"
                    type="date"
                    value={s.end.slice(0, 10)}
                    onChange={(e) => {
                      const next = [...seasons];
                      next[i] = { ...s, end: new Date(e.target.value).toISOString() };
                      setSeasons(next);
                    }}
                  />
                  <input
                    className="rounded-xl border px-3 py-2 text-sm"
                    inputMode="numeric"
                    value={s.boostPercent}
                    onChange={(e) => {
                      const next = [...seasons];
                      next[i] = { ...s, boostPercent: Math.max(0, Number(e.target.value) || 0) };
                      setSeasons(next);
                    }}
                  />
                </div>
              ))}
              <button
                onClick={() =>
                  setSeasons([
                    ...seasons,
                    {
                      id: "season_" + Date.now(),
                      label: "New Event",
                      start: new Date().toISOString(),
                      end: new Date(Date.now() + 7 * 86400000).toISOString(),
                      boostPercent: 10,
                      categoryIds: ["shopping"],
                    },
                  ])
                }
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-sm text-white"
              >
                <Plus className="h-4 w-4" />
                Add event
              </button>
            </div>
          </div>

          {/* AI tips */}
          <div className={section}>
            <div className="text-[15px] font-semibold text-slate-800">AI Suggestions</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="text-[15px] font-semibold text-red-900">Danger zone</div>
            <div className="mt-2 text-sm text-red-800">
              Remove a category, alert, or season if you no longer need it.
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {/* remove last budget (demo) */}
              <button
                onClick={() => setBudgets((b) => b.slice(0, Math.max(0, b.length - 1)))}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-red-700 ring-1 ring-red-200"
              >
                <Trash2 className="h-4 w-4" />
                Remove last category
              </button>

              {/* remove last alert */}
              <button
                onClick={() => setAlerts((a) => a.slice(0, Math.max(0, a.length - 1)))}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-red-700 ring-1 ring-red-200"
              >
                <Trash2 className="h-4 w-4" />
                Remove last alert
              </button>
            </div>
          </div>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
