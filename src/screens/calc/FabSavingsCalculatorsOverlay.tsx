// src/screens/calc/FabSavingsCalculatorsOverlay.tsx
import React, { useMemo, useState, useEffect } from "react";

// ------------------------------------------------------------
// BRAC DPS & FD Calculator Overlay (integrated with hash routes)
// ------------------------------------------------------------

// Helpers
const fmt0 = new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 });
const toTaka0 = (x: number) => Math.round(x);
const num = (v: string | number) => (typeof v === "number" ? v : parseFloat((v as string)?.replace(/,/g, "") || "0")) || 0;

// Bangladesh Bank / BRAC buckets (ranges in % p.a.); we cap user rate at the bucket high.
// Buckets: 3–<6m, 6–<12m, 12–<24m, 24–<36m, 36m+
// Ranges:  9.50–10.25, 9.00–10.25, 9.00–10.25, 8.00–10.00, 7.00–10.00
const BRAC_FD_RATE_BUCKETS = [
  { minM: 3,  maxM: 5,  range: [9.5, 10.25] },
  { minM: 6,  maxM: 11, range: [9.0, 10.25] },
  { minM: 12, maxM: 23, range: [9.0, 10.25] },
  { minM: 24, maxM: 35, range: [8.0, 10.0] },
  { minM: 36, maxM: 600, range: [7.0, 10.0] },
];

function pickBracRateDefault(tenureMonths: number) {
  const b = BRAC_FD_RATE_BUCKETS.find(x => tenureMonths >= x.minM && tenureMonths <= x.maxM) || BRAC_FD_RATE_BUCKETS[1];
  const [lo, hi] = b.range;
  const midpoint = (lo + hi) / 2;
  return { lo, hi, midpoint };
}

// Compounding helpers (pure functions) — full precision internal
export function fdMaturity(principal: number, annualRatePct: number, months: number, compPerYear: number) {
  if (principal <= 0 || months <= 0 || compPerYear <= 0) return 0;
  const r = annualRatePct / 100;
  const years = months / 12;
  const i = r / compPerYear;
  return principal * Math.pow(1 + i, compPerYear * years);
}

export function fdBacksolvePrincipal(targetMaturity: number, annualRatePct: number, months: number, compPerYear: number) {
  if (targetMaturity <= 0 || months <= 0 || compPerYear <= 0) return 0;
  const r = annualRatePct / 100;
  const years = months / 12;
  const i = r / compPerYear;
  return targetMaturity / Math.pow(1 + i, compPerYear * years);
}

// DPS as ordinary annuity
export function dpsMaturity(monthlyDeposit: number, annualRatePct: number, months: number, depositAt: "begin" | "end" = "end") {
  if (monthlyDeposit <= 0 || months <= 0) return 0;
  const i = (annualRatePct / 100) / 12;
  if (i === 0) return monthlyDeposit * months;
  const factor = (Math.pow(1 + i, months) - 1) / i;
  const adj = depositAt === "begin" ? (1 + i) : 1;
  return monthlyDeposit * factor * adj;
}

export function dpsBacksolveMonthly(targetMaturity: number, annualRatePct: number, months: number, depositAt: "begin" | "end" = "end") {
  if (targetMaturity <= 0 || months <= 0) return 0;
  const i = (annualRatePct / 100) / 12;
  if (i === 0) return targetMaturity / months;
  const factor = (Math.pow(1 + i, months) - 1) / i;
  const adj = depositAt === "begin" ? (1 + i) : 1;
  return targetMaturity / (factor * adj);
}

function GlassCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="rounded-3xl border border-white/30 bg-white/60 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur-md">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 py-2">
      <div className="col-span-5 text-sm text-gray-600">{label}</div>
      <div className="col-span-7">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/70 p-4 shadow-sm backdrop-blur">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

type Props = { onClose: () => void };

export default function FabSavingsCalculatorsOverlay({ onClose }: Props) {
  const [tab, setTab] = useState<'FD' | 'DPS'>('FD');

  // Shared tenure
  const [months, setMonths] = useState(18);

  // Dynamic rate bucket + cap
  const bucket = useMemo(() => pickBracRateDefault(months), [months]);
  const [rate, setRate] = useState(bucket.midpoint);
  useEffect(() => { setRate(pickBracRateDefault(months).midpoint); }, [months]);

  // FD state (single-screen, dual-bind)
  const [fdCompPerYear, setFdCompPerYear] = useState(4); // Quarterly default
  const [fdPrincipal, setFdPrincipal] = useState(200000);
  const [fdMaturityAmt, setFdMaturityAmt] = useState(() => fdMaturity(200000, bucket.midpoint, 18, 4));
  const [fdEdited, setFdEdited] = useState<'principal' | 'maturity'>('principal');

  // DPS state (single-screen, dual-bind)
  const [dpsDepositAt, setDpsDepositAt] = useState<'begin' | 'end'>('end');
  const [dpsMonthly, setDpsMonthly] = useState(10000);
  const [dpsTarget, setDpsTarget] = useState(() => dpsMaturity(10000, bucket.midpoint, 18, 'end'));
  const [dpsEdited, setDpsEdited] = useState<'monthly' | 'target'>('monthly');

  // Enforce rate cap (user cannot increase beyond cap). Allow lowering.
  useEffect(() => {
    const cap = pickBracRateDefault(months).hi;
    if (rate > cap) setRate(cap);
  }, [months, rate]);

  // Recompute FD
  useEffect(() => {
    const cap = pickBracRateDefault(months).hi;
    const r = Math.min(rate, cap);
    if (fdEdited === 'principal') {
      const m = fdMaturity(fdPrincipal, r, months, fdCompPerYear);
      setFdMaturityAmt(m);
    } else {
      const p = fdBacksolvePrincipal(fdMaturityAmt, r, months, fdCompPerYear);
      setFdPrincipal(p);
    }
  }, [fdPrincipal, fdMaturityAmt, fdCompPerYear, months, rate, fdEdited]);

  // Recompute DPS
  useEffect(() => {
    const cap = pickBracRateDefault(months).hi;
    const r = Math.min(rate, cap);
    if (dpsEdited === 'monthly') {
      const t = dpsMaturity(dpsMonthly, r, months, dpsDepositAt);
      setDpsTarget(t);
    } else {
      const p = dpsBacksolveMonthly(dpsTarget, r, months, dpsDepositAt);
      setDpsMonthly(p);
    }
  }, [dpsMonthly, dpsTarget, dpsDepositAt, months, rate, dpsEdited]);

  // Tax & fees toggles
  const [applyAIT, setApplyAIT] = useState(false);
  const [aitRatePct, setAitRatePct] = useState(10);
  const [applyExcise, setApplyExcise] = useState(false);
  const [exciseFlat, setExciseFlat] = useState(115);
  const [applyPenalty, setApplyPenalty] = useState(false);
  const [penaltyPct, setPenaltyPct] = useState(2);

  function applyDeductions(grossMaturity: number, principalOrTotalDeposit: number, grossInterest: number) {
    let ait = 0, exc = 0, pen = 0;
    if (applyAIT) ait = (aitRatePct / 100) * grossInterest;
    if (applyExcise) exc = exciseFlat;
    if (applyPenalty) pen = (penaltyPct / 100) * grossInterest;
    const totalDed = Math.max(0, ait + exc + pen);
    const netMaturity = Math.max(0, grossMaturity - totalDed);
    const netInterest = Math.max(0, netMaturity - principalOrTotalDeposit);
    return { ait, exc, pen, totalDed, netMaturity, netInterest };
  }

  const capText = `${bucket.lo.toFixed(2)}%–${bucket.hi.toFixed(2)}% cap`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative h-[92vh] w-full max-w-5xl overflow-hidden rounded-t-3xl bg-gradient-to-br from-white to-white/80 shadow-2xl ring-1 ring-black/5 sm:h-[84vh] sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/60 bg-white/60 p-4 backdrop-blur">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">BRAC Savings Calculators</h2>
            <p className="text-xs text-gray-500">Dynamic tenure-based rates (BB/BRAC). Type your goal or amount—other fields auto-calc.</p>
          </div>
          <button className="rounded-full p-2 hover:bg-white/70" onClick={onClose} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M6.225 4.811a1 1 0 0 1 1.414 0L12 9.172l4.361-4.361a1 1 0 0 1 1.415 1.414L13.414 10.586l4.362 4.361a1 1 0 1 1-1.415 1.415L12 12l-4.361 4.362a1 1 0 0 1-1.414-1.415L10.586 10.586 6.225 6.225a1 1 0 0 1 0-1.414Z"/></svg>
          </button>
        </div>

        {/* Tabs + Tenure + Rate */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/60 bg-white/40 p-3 backdrop-blur">
          {(["FD", "DPS"] as const).map(key => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium shadow ${tab===key?"bg-gray-900 text-white":"bg-white/80 text-gray-800 hover:bg-white"}`}
            >{key}</button>
          ))}

          <div className="ml-auto flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 ring-1 ring-black/5">
              <span className="hidden sm:inline text-gray-600">Tenure</span>
              <input type="number" min={1} className="w-20 rounded-md border border-gray-200 px-2 py-1 text-right" value={months} onChange={e=>setMonths(Math.max(1, Math.floor(num(e.target.value))))} />
              <span className="text-gray-500">months</span>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 ring-1 ring-black/5">
              <span className="hidden sm:inline text-gray-600">Rate</span>
              <input
                type="number"
                step={0.01}
                max={bucket.hi}
                className="w-20 rounded-md border border-gray-200 px-2 py-1 text-right"
                value={rate}
                onChange={(e)=>{
                  const v = num(e.target.value);
                  setRate(Math.min(v, pickBracRateDefault(months).hi));
                }}
                title={`Capped by ${capText}`}
              />
              <span className="text-gray-500">% p.a.</span>
            </div>

            <div className="text-[11px] text-gray-500">{capText}</div>
          </div>
        </div>

        {/* Deductions toggles */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/60 bg-white/40 p-3 backdrop-blur text-xs">
          <div className="flex items-center gap-2"><input id="ait" type="checkbox" checked={applyAIT} onChange={e=>setApplyAIT(e.target.checked)} /><label htmlFor="ait" className="text-gray-700">AIT</label>
            {applyAIT && (
              <span className="ml-2 text-gray-600">Rate
                <input type="number" step={0.1} className="ml-2 w-16 rounded-md border border-gray-200 px-2 py-1 text-right" value={aitRatePct} onChange={e=>setAitRatePct(num(e.target.value))} />%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2"><input id="exc" type="checkbox" checked={applyExcise} onChange={e=>setApplyExcise(e.target.checked)} /><label htmlFor="exc" className="text-gray-700">Excise Duty</label>
            {applyExcise && (
              <span className="ml-2 text-gray-600">Flat
                <input type="number" step={1} className="ml-2 w-24 rounded-md border border-gray-200 px-2 py-1 text-right" value={exciseFlat} onChange={e=>setExciseFlat(num(e.target.value))} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2"><input id="pen" type="checkbox" checked={applyPenalty} onChange={e=>setApplyPenalty(e.target.checked)} /><label htmlFor="pen" className="text-gray-700">Premature Penalty</label>
            {applyPenalty && (
              <span className="ml-2 text-gray-600">Rate
                <input type="number" step={0.1} className="ml-2 w-16 rounded-md border border-gray-200 px-2 py-1 text-right" value={penaltyPct} onChange={e=>setPenaltyPct(num(e.target.value))} />%
              </span>
            )}
          </div>
          <div className="ml-auto text-[11px] text-gray-500">Toggle to compare pre-tax vs net outcomes.</div>
        </div>

        {/* Content */}
        <div className="grid h-[calc(100%-154px)] grid-cols-1 gap-5 overflow-y-auto p-5 sm:grid-cols-2">
          {/* Left column: FD or DPS */}
          {tab === 'FD' ? (
            <GlassCard title="Fixed Deposit (FD)" subtitle="Enter either Principal or Maturity; we'll calculate the other.">
              <Row label="Principal (now)">
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-right shadow-inner"
                  value={fdPrincipal}
                  onChange={e=>{ setFdEdited('principal'); setFdPrincipal(num(e.target.value)); }}
                />
              </Row>
              <Row label="Maturity (after tenure)">
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-right shadow-inner"
                  value={fdMaturityAmt}
                  onChange={e=>{ setFdEdited('maturity'); setFdMaturityAmt(num(e.target.value)); }}
                />
              </Row>
              <Row label="Compounding">
                <select className="w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2" value={fdCompPerYear} onChange={e=>setFdCompPerYear(num(e.target.value))}>
                  <option value={1}>Annual</option>
                  <option value={2}>Half-yearly</option>
                  <option value={4}>Quarterly</option>
                  <option value={12}>Monthly</option>
                </select>
              </Row>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {(() => {
                  const grossInt = Math.max(0, fdMaturityAmt - fdPrincipal);
                  const net = applyDeductions(fdMaturityAmt, fdPrincipal, grossInt);
                  return (
                    <>
                      <Stat label="Gross Interest" value={fmt0.format(toTaka0(grossInt))} />
                      <Stat label="Net Maturity" value={fmt0.format(toTaka0(net.netMaturity))} />
                    </>
                  );
                })()}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                {(() => { const grossInt = Math.max(0, fdMaturityAmt - fdPrincipal); const net = applyDeductions(fdMaturityAmt, fdPrincipal, grossInt); return (
                  <>
                    <Stat label="AIT" value={fmt0.format(toTaka0(net.ait))} />
                    <Stat label="Excise" value={fmt0.format(toTaka0(net.exc))} />
                    <Stat label="Penalty" value={fmt0.format(toTaka0(net.pen))} />
                  </>
                ); })()}
              </div>

              <p className="mt-3 text-[11px] text-gray-500">Assumes selected compounding; excludes other bank-specific fees not listed above.</p>
            </GlassCard>
          ) : (
            <GlassCard title="DPS / Recurring Deposit" subtitle="Enter either Monthly Deposit or Target; we'll calculate the other.">
              <Row label="Monthly deposit">
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-right shadow-inner"
                  value={dpsMonthly}
                  onChange={e=>{ setDpsEdited('monthly'); setDpsMonthly(num(e.target.value)); }}
                />
              </Row>
              <Row label="Target maturity">
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2 text-right shadow-inner"
                  value={dpsTarget}
                  onChange={e=>{ setDpsEdited('target'); setDpsTarget(num(e.target.value)); }}
                />
              </Row>
              <Row label="Deposit timing">
                <div className="flex gap-2">
                  <button onClick={()=>setDpsDepositAt('end')} className={`rounded-full px-3 py-2 text-sm ${dpsDepositAt==='end'?"bg-gray-900 text-white":"bg-white border border-gray-200"}`}>End of month</button>
                  <button onClick={()=>setDpsDepositAt('begin')} className={`rounded-full px-3 py-2 text-sm ${dpsDepositAt==='begin'?"bg-gray-900 text-white":"bg-white border border-gray-200"}`}>Beginning of month</button>
                </div>
              </Row>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {(() => {
                  const totalDep = dpsEdited==='monthly' ? dpsMonthly * months : dpsBacksolveMonthly(dpsTarget, Math.min(rate, bucket.hi), months, dpsDepositAt) * months;
                  const grossMat = dpsEdited==='monthly' ? dpsMaturity(dpsMonthly, Math.min(rate, bucket.hi), months, dpsDepositAt) : dpsTarget;
                  const grossInt = Math.max(0, grossMat - totalDep);
                  const net = applyDeductions(grossMat, totalDep, grossInt);
                  return (
                    <>
                      <Stat label="Total Deposits" value={fmt0.format(toTaka0(totalDep))} />
                      <Stat label="Net Maturity" value={fmt0.format(toTaka0(net.netMaturity))} />
                    </>
                  );
                })()}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3">
                {(() => {
                  const totalDep = dpsEdited==='monthly' ? dpsMonthly * months : dpsBacksolveMonthly(dpsTarget, Math.min(rate, bucket.hi), months, dpsDepositAt) * months;
                const grossMat = dpsEdited==='monthly' ? dpsMaturity(dpsMonthly, Math.min(rate, bucket.hi), months, dpsDepositAt) : dpsTarget;
                  const grossInt = Math.max(0, grossMat - totalDep);
                  const net = applyDeductions(grossMat, totalDep, grossInt);
                  return (
                    <>
                      <Stat label="AIT" value={fmt0.format(toTaka0(net.ait))} />
                      <Stat label="Excise" value={fmt0.format(toTaka0(net.exc))} />
                      <Stat label="Penalty" value={fmt0.format(toTaka0(net.pen))} />
                    </>
                  );
                })()}
              </div>

              <p className="mt-3 text-[11px] text-gray-500">Monthly compounding assumption; excludes other bank-specific fees not listed above.</p>
            </GlassCard>
          )}

          {/* Right column: Presets + Breakdown + Rates */}
          <div className="space-y-5">
            <GlassCard title="Quick Presets" subtitle="Tap to set tenure or a common goal.">
              <div className="flex flex-wrap gap-2">
                {[6, 12, 18, 24, 36, 60].map(m => (
                  <button key={m} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm hover:bg-gray-50" onClick={()=>setMonths(m)}>{m} mo</button>
                ))}
                <button className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm hover:bg-gray-50" onClick={()=>{ setTab('DPS'); setMonths(18); setDpsEdited('target'); setDpsTarget(200000); }}>🎯 ৳2,00,000 in 18 mo</button>
              </div>
            </GlassCard>

            <GlassCard title="Breakdown" subtitle="Numbers reflect current inputs & capped rate">
              {tab==='FD' ? (
                <div className="text-sm text-gray-700">
                  {(() => { const grossInt = Math.max(0, fdMaturityAmt - fdPrincipal); const net = applyDeductions(fdMaturityAmt, fdPrincipal, grossInt); return (
                    <>
                      <div className="flex justify-between py-1"><span>Principal</span><span>{fmt0.format(toTaka0(fdPrincipal))}</span></div>
                      <div className="flex justify-between py-1"><span>Gross Interest</span><span>{fmt0.format(toTaka0(grossInt))}</span></div>
                      <div className="flex justify-between py-1"><span>Total Deductions</span><span>{fmt0.format(toTaka0(net.totalDed))}</span></div>
                      <div className="flex justify-between border-t pt-2 font-medium"><span>Net Maturity</span><span>{fmt0.format(toTaka0(net.netMaturity))}</span></div>
                    </>
                  ); })()}
                </div>
              ) : (
                <div className="text-sm text-gray-700">
                  {(() => { const totalDep = dpsMonthly * months; const grossMat = dpsMaturity(dpsMonthly, Math.min(rate, bucket.hi), months, dpsDepositAt); const grossInt = Math.max(0, grossMat - totalDep); const net = applyDeductions(grossMat, totalDep, grossInt); return (
                    <>
                      <div className="flex justify-between py-1"><span>Total Deposits</span><span>{fmt0.format(toTaka0(totalDep))}</span></div>
                      <div className="flex justify-between py-1"><span>Gross Interest</span><span>{fmt0.format(toTaka0(grossInt))}</span></div>
                      <div className="flex justify-between py-1"><span>Total Deductions</span><span>{fmt0.format(toTaka0(net.totalDed))}</span></div>
                      <div className="flex justify-between border-t pt-2 font-medium"><span>Net Maturity</span><span>{fmt0.format(toTaka0(net.netMaturity))}</span></div>
                    </>
                  ); })()}
                </div>
              )}
            </GlassCard>

            <GlassCard title="About rates" subtitle="Auto-capped by tenure">
              <ul className="list-disc pl-5 text-[11px] text-gray-600">
                <li>3–&lt;6 months: 9.50–10.25% p.a.</li>
                <li>6–&lt;12 months: 9.00–10.25% p.a.</li>
                <li>12–&lt;24 months: 9.00–10.25% p.a.</li>
                <li>24–&lt;36 months: 8.00–10.00% p.a.</li>
                <li>36 months and above: 7.00–10.00% p.a.</li>
              </ul>
              <p className="mt-2 text-[11px] text-gray-500">You can lower the rate to reflect specific offers; you cannot exceed the cap.</p>
            </GlassCard>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/60 bg-white/60 p-3 text-[11px] text-gray-500 backdrop-blur">
          <div>Assumptions: DPS monthly compounding; FD compounding as selected. Configure AIT/Excise/Penalty above. Other fees/taxes may apply.</div>
          <a href="https://www.bb.org.bd/en/index.php/financialactivity/interestdeposit" target="_blank" rel="noreferrer" className="rounded-full border border-gray-200 bg-white/80 px-3 py-1 hover:bg-white">Rate Source ↗</a>
        </div>
      </div>
    </div>
  );
}

// ---- quick self-checks (console logs in dev) ----
(function runUnitTests() {
  try {
    const approxEq = (a: number, b: number, eps = 0.5) => Math.abs(a - b) <= eps;
    const fdP = 200000, fdR = 10, fdM = 12, fdC = 4;
    const fdMat = fdMaturity(fdP, fdR, fdM, fdC);
    const fdBackP = fdBacksolvePrincipal(fdMat, fdR, fdM, fdC);
    console.assert(approxEq(fdP, fdBackP, 1), "FD backsolve principal mismatch");

    const dpsDep = 10000, dpsR = 10, dpsMths = 18;
    const dpsMatEnd = dpsMaturity(dpsDep, dpsR, dpsMths, 'end');
    const dpsBackEnd = dpsBacksolveMonthly(dpsMatEnd, dpsR, dpsMths, 'end');
    console.assert(approxEq(dpsDep, dpsBackEnd, 1), "DPS backsolve (end) mismatch");

    const dpsMatBegin = dpsMaturity(dpsDep, dpsR, dpsMths, 'begin');
    const dpsBackBegin = dpsBacksolveMonthly(dpsMatBegin, dpsR, dpsMths, 'begin');
    console.assert(approxEq(dpsDep, dpsBackBegin, 1), "DPS backsolve (begin) mismatch");

    if (typeof window !== 'undefined') console.log("Calculator unit tests passed ✓");
  } catch (e) {
    console.error("Calculator unit tests failed ✗", e);
  }
})();
