// src/screens/InsuranceScreen.tsx
import React, { useState } from "react";

/* local helper (keeps file self-contained) */
function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

/* ---------- constants & types (from your monolith) ---------- */
const COUNTRIES = [
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
];

type Pack = { key: "gold" | "silver"; label: string; days: number; baseBDT: number };
const PACKS: Pack[] = [
  { key: "silver", label: "Silver", days: 15, baseBDT: 199 },
  { key: "gold", label: "Gold", days: 30, baseBDT: 399 },
];

const BENEFITS_ROWS = [
  { label: "Death Benefit", silver: "USD 5,000", gold: "USD 5,000" },
  { label: "Funeral Benefit", silver: "USD 500", gold: "USD 500" },
  { label: "Personal Accident", silver: "Up to USD 500", gold: "Up to USD 500" },
  { label: "Hospitalization", silver: "Up to USD 500", gold: "Up to USD 500" },
  { label: "Transportation", silver: "Up to USD 150", gold: "Up to USD 150" },
  { label: "Outdoor Treatment", silver: "Up to USD 50", gold: "Up to USD 50" },
];

const ADDONS = [
  { key: "medical", label: "Extra medical top-up", bdt: 200 },
  { key: "lostbag", label: "Lost baggage top-up", bdt: 150 },
  { key: "tripdelay", label: "Trip delay top-up", bdt: 120 },
  { key: "passport", label: "Passport assistance", bdt: 80 },
];

/* ---------- screen ---------- */
export default function InsuranceScreen({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState(0);
  const [pack, setPack] = useState<Pack | null>(null);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [addons, setAddons] = useState<string[]>([]);
  const [mailToast, setMailToast] = useState("");

  const totalBDT =
    (pack?.baseBDT || 0) +
    addons.reduce((s, k) => s + (ADDONS.find((a) => a.key === k)?.bdt || 0), 0);

  const toggleAddon = (k: string) =>
    setAddons((arr) => (arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]));

  return (
    <div className="p-4 pb-28">
      {onBack && (
        <button onClick={onBack} className="mb-3 text-white/90 underline">
          &lt; Back
        </button>
      )}

      {/* Step 0: Plan comparison */}
      {step === 0 && (
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="mb-4 text-center text-lg font-semibold text-slate-800">
            Travel Insurance
          </div>
          <div className="mb-3 text-center text-[13px] text-slate-500">
            Travel freely, stay securely
          </div>

          <div className="mb-3 grid grid-cols-3 items-center gap-2 text-[12px]">
            <div className="text-slate-500" />
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-center font-semibold">
              Silver Plan
            </div>
            <div className="rounded-xl bg-amber-100 px-3 py-2 text-center font-semibold">
              Gold Plan
            </div>

            <div className="text-slate-600">Subscription Fee</div>
            <div className="text-center font-medium">BDT 199</div>
            <div className="text-center font-medium">BDT 399</div>

            <div className="text-slate-600">Coverage Duration</div>
            <div className="text-center">15 days</div>
            <div className="text-center">30 days</div>

            {BENEFITS_ROWS.map((r) => (
              <React.Fragment key={r.label}>
                <div className="text-slate-600">{r.label}</div>
                <div className="text-center">{r.silver}</div>
                <div className="text-center">{r.gold}</div>
              </React.Fragment>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {PACKS.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setPack(p);
                  setStep(1);
                }}
                className={classNames(
                  "rounded-2xl border p-4 text-left hover:shadow",
                  p.key === "gold" ? "border-amber-400" : ""
                )}
              >
                <div className="text-xl font-bold">{p.label}</div>
                <div className="text-sm text-slate-600">Validity: {p.days} days</div>
                <div className="mt-2 text-emerald-600">BDT {p.baseBDT}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Choose country */}
      {step === 1 && pack && (
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="mb-2 text-lg font-semibold text-slate-800">
            Destination country
          </div>
          <select
            value={country.code}
            onChange={(e) =>
              setCountry(COUNTRIES.find((c) => c.code === e.target.value) || COUNTRIES[0])
            }
            className="w-full rounded-xl border p-3"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          <div className="mt-4 flex gap-2">
            <button
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-white"
              onClick={() => setStep(2)}
            >
              Next
            </button>
            <button
              className="flex-1 rounded-xl bg-slate-100 px-4 py-2"
              onClick={() => setStep(0)}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Optional add-ons */}
      {step === 2 && pack && (
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="mb-2 text-lg font-semibold text-slate-800">
            Add optional facilities
          </div>
          <div className="space-y-2">
            {ADDONS.map((a) => (
              <label
                key={a.key}
                className="flex items-center justify-between rounded-2xl border p-3"
              >
                <div className="text-sm">{a.label}</div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-600">+BDT {a.bdt}</div>
                  <input
                    type="checkbox"
                    checked={addons.includes(a.key)}
                    onChange={() => toggleAddon(a.key)}
                    className="h-5 w-5"
                  />
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">Total</div>
            <div className="text-lg font-semibold">BDT {totalBDT}</div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-white"
              onClick={() => setStep(3)}
            >
              Review
            </button>
            <button
              className="flex-1 rounded-xl bg-slate-100 px-4 py-2"
              onClick={() => setStep(1)}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && pack && (
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="mb-2 text-lg font-semibold text-slate-800">
            Confirm purchase
          </div>
          <div className="space-y-1 text-sm text-slate-700">
            <div>
              <span className="text-slate-500">Pack:</span> {pack.label} — {pack.days} days
            </div>
            <div>
              <span className="text-slate-500">Country:</span> {country.flag} {country.name}
            </div>
            <div>
              <span className="text-slate-500">Facilities:</span>{" "}
              {addons.length ? addons.join(", ") : "None"}
            </div>
            <div>
              <span className="text-slate-500">Total:</span> BDT {totalBDT}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2 text-white"
              onClick={() => {
                setStep(4);
                setMailToast("Your bill has been emailed.");
                setTimeout(() => setMailToast(""), 1500);
              }}
            >
              Confirm & Pay
            </button>
            <button
              className="flex-1 rounded-xl bg-slate-100 px-4 py-2"
              onClick={() => setStep(2)}
            >
              Back
            </button>
          </div>
          {!!mailToast && (
            <div className="mt-2 text-center text-xs text-slate-600">{mailToast}</div>
          )}
        </div>
      )}

      {/* Step 4: Active */}
      {step === 4 && pack && (
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="mb-2 text-lg font-semibold text-slate-800">Insurance Active</div>
          <div className="text-sm text-slate-700">
            Your <span className="font-semibold">{pack.label}</span> pack is now active for{" "}
            <span className="font-semibold">{pack.days}</span> days.
          </div>
          <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm">
            <div>
              <span className="text-slate-500">Destination:</span> {country.flag} {country.name}
            </div>
            <div>
              <span className="text-slate-500">Facilities:</span>{" "}
              {addons.length ? addons.join(", ") : "None"}
            </div>
            <div>
              <span className="text-slate-500">Total paid:</span> BDT {totalBDT}
            </div>
          </div>
          <div className="mt-4">
            <button
              className="w-full rounded-xl bg-blue-600 px-4 py-2 text-white"
              onClick={onBack}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
