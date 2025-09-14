// src/screens/CashbackRewardsScreen.tsx
import React, { useMemo, useRef, useState } from "react";

/**
 * Rewards & Cashback (Integrated Screen)
 *
 * - Two tabs: Cashback | Reward Points
 * - ONLY light blue highlight for foreign (non-BD) transactions; rest of UI is plain
 * - Big scrolling lists with their own scroll container + "Scroll to bottom"
 * - Report action per row -> complaint modal -> RM contact (Bangladeshi names, plain format)
 * - Copy nudges customers to use card internationally; no internal multipliers/rates shown
 * - Cashback logic (demo):
 *    • International retail @ selected global chains AFTER cumulative USD 500 top-chain retail spend → ~3% (cap BDT 1,000)
 *    • International medical POS → ~2.5% (cap BDT 5,000)
 *    • International travel & subscription → ~2.0%
 *   ~20% of dataset ends up with cashback.
 * - Points logic:
 *    • 1 point per BDT 80 on all transactions
 *    • International transactions earn accelerated total 3× points (not shown to user)
 */

// ---------------------------------------------------------------
// Internal constants (NOT rendered to customers)
// ---------------------------------------------------------------
const USD_TO_BDT = 120;
const THRESH_RETAIL_USD = 500;
const THRESH_RETAIL_BDT = THRESH_RETAIL_USD * USD_TO_BDT;

const CAP_RETAIL_BDT = 1000;
const CAP_MEDICAL_BDT = 5000;

const RATE_RETAIL = 0.03; // ~3%
const RATE_MEDICAL = 0.025; // ~2.5%
const RATE_TRAVEL_SUB = 0.02; // ~2.0%

const ACCEL_MULTIPLIER = 3; // total 3× on international

const fmtBDT = (n: number) =>
  `BDT ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)}`;

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------
type Country = "BD" | "US" | "GB" | "SG" | "AE" | "CA" | "TR";
type Category = "retail" | "medical" | "travel" | "subscription";

export type Txn = {
  id: string;
  dt: string; // ISO
  invoice: string;
  merchant: string;
  merchantCode: string;
  amountBDT: number;
  country: Country;
  category: Category;
};

const BD_MERCHANTS = [
  ["Foodpanda", "BD-FOO"],
  ["Pathao", "BD-PTH"],
  ["Apon Mart", "BD-APO"],
  ["Shwapno", "BD-SHW"],
  ["Arogga", "BD-ARG"],
  ["Agora", "BD-AGR"],
  ["ACI", "BD-ACI"],
  ["Walton", "BD-WAL"],
  ["RFL Best Buy", "BD-RFL"],
] as const;

const INTL_TOP_RETAIL = [
  ["Walmart", "US-WMT"],
  ["Amazon", "US-AMZ"],
  ["IKEA", "SG-IKE"],
  ["Tesco", "GB-TES"],
  ["Carrefour", "AE-CAR"],
  ["Marks & Spencer", "GB-MAR"],
  ["Sephora", "US-SEP"],
] as const;

const INTL_TRAVEL = [
  ["Booking.com", "NL-BKG"],
  ["Airbnb", "US-ABNB"],
  ["Uber International", "US-UBR"],
  ["Qatar Airways", "QA-QTR"],
  ["Emirates", "AE-EMI"],
] as const;

const INTL_SUBS = [
  ["Netflix", "US-NFX"],
  ["Spotify", "US-SPT"],
  ["Apple iCloud", "US-APL"],
  ["YouTube Premium", "US-YTP"],
] as const;

const INTL_MED = [
  ["Mayo Clinic", "US-MED1"],
  ["Cleveland Clinic", "US-MED2"],
  ["Mount Sinai", "US-MED3"],
  ["Gleneagles Hospital", "SG-MED4"],
] as const;

// Deterministic RNG for reproducible demo
function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pick<T>(r: () => number, arr: readonly T[]) {
  return arr[Math.floor(r() * arr.length)];
}

function genTxns(): Txn[] {
  const r = rng(2025);
  const txns: Txn[] = [];
  let id = 1000;

  const start = new Date("2025-01-01T09:00:00");
  const end = new Date();
  const days = Math.ceil((+end - +start) / (1000 * 3600 * 24));

  // avg 1.0–1.2 txns per day across BD & international
  for (let d = 0; d < days; d++) {
    const count = r() < 0.2 ? 0 : r() < 0.75 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const date = new Date(+start + d * 86400000 + Math.floor(r() * 86400000));
      const isIntl = r() < 0.32; // ~32% international
      let merchant: string, code: string, category: Category, country: Country;

      if (!isIntl) {
        [merchant, code] = pick(r, BD_MERCHANTS);
        category = "retail";
        country = "BD";
      } else {
        const roll = r();
        if (roll < 0.38) {
          [merchant, code] = pick(r, INTL_TOP_RETAIL);
          category = "retail";
        } else if (roll < 0.58) {
          [merchant, code] = pick(r, INTL_TRAVEL);
          category = "travel";
        } else if (roll < 0.78) {
          [merchant, code] = pick(r, INTL_SUBS);
          category = "subscription";
        } else {
          [merchant, code] = pick(r, INTL_MED);
          category = "medical";
        }
        country = ["US", "GB", "SG", "AE", "CA", "TR"][Math.floor(r() * 6)] as Country;
      }

      const amount =
        category === "subscription"
          ? 500 + Math.round(r() * 1500)
          : category === "medical"
          ? 20000 + Math.round(r() * 180000)
          : category === "travel"
          ? 3000 + Math.round(r() * 35000)
          : 400 + Math.round(r() * 35000);

      txns.push({
        id: `T${id++}`,
        dt: date.toISOString(),
        invoice: `INV-${id}`,
        merchant,
        merchantCode: code,
        amountBDT: amount,
        country,
        category,
      });
    }
  }

  txns.sort((a, b) => +new Date(b.dt) - +new Date(a.dt));
  return txns;
}

// ---------------------------------------------------------------
// Calculations
// ---------------------------------------------------------------
export type CashbackRow = Txn & {
  cashbackBDT: number;
  reason?: "retail" | "medical" | "travel_sub";
  creditedAt: string;
};

export type PointsRow = Txn & {
  basePoints: number;
  accelPoints: number;
  totalPoints: number;
  willCreditOn: string;
};

function computeCashbackRows(txns: Txn[]): CashbackRow[] {
  let retailEligibleCum = 0;
  let capRetailUsed = 0;
  let capMedicalUsed = 0;

  const rows: CashbackRow[] = [];

  for (const t of txns.slice().reverse()) {
    const isIntl = t.country !== "BD";
    let amount = 0;
    let reason: CashbackRow["reason"] | undefined;

    // International retail @ selected chains after threshold
    if (isIntl && t.category === "retail" && INTL_TOP_RETAIL.some(([m]) => m === t.merchant)) {
      retailEligibleCum += t.amountBDT;
      if (retailEligibleCum >= THRESH_RETAIL_BDT && capRetailUsed < CAP_RETAIL_BDT) {
        const raw = t.amountBDT * RATE_RETAIL;
        const room = CAP_RETAIL_BDT - capRetailUsed;
        amount = Math.min(raw, room);
        if (amount > 0) {
          reason = "retail";
          capRetailUsed += amount;
        }
      }
    }

    // International medical
    if (isIntl && t.category === "medical" && capMedicalUsed < CAP_MEDICAL_BDT) {
      const raw = t.amountBDT * RATE_MEDICAL;
      const room = CAP_MEDICAL_BDT - capMedicalUsed;
      const add = Math.min(raw, room);
      if (add > 0) {
        amount += add;
        reason = "medical";
        capMedicalUsed += add;
      }
    }

    // International travel/subscription (no cap here)
    if (isIntl && (t.category === "travel" || t.category === "subscription")) {
      const add = t.amountBDT * RATE_TRAVEL_SUB;
      if (add > 0) {
        amount += add;
        reason = "travel_sub";
      }
    }

    rows.push({
      ...t,
      cashbackBDT: Math.round(amount * 100) / 100,
      reason,
      creditedAt: new Date(new Date(t.dt).getTime() + 24 * 3600 * 1000).toISOString(),
    });
  }

  rows.reverse();
  return rows;
}

function computePointsRows(txns: Txn[]): PointsRow[] {
  const nextBilling = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(5);
    d.setHours(12, 0, 0, 0);
    return d.toISOString();
  })();

  return txns.map((t) => {
    const base = Math.floor(t.amountBDT / 80);
    const isIntl = t.country !== "BD";
    const accelExtra = isIntl ? base * (ACCEL_MULTIPLIER - 1) : 0;
    const total = base + accelExtra;
    return {
      ...t,
      basePoints: base,
      accelPoints: accelExtra,
      totalPoints: total,
      willCreditOn: nextBilling,
    };
  });
}

// ---------------------------------------------------------------
// RM contacts (plain names)
// ---------------------------------------------------------------
const RMS = [
  ["Farzana Islam", "01711-000106"],
  ["Srabon Das", "01712-334455"],
  ["Rafi Khan", "01713-889900"],
  ["Mehedi Hasan", "01714-221133"],
  ["Moumita Saha", "01715-778899"],
  ["Nafisa Rahman", "01716-667788"],
  ["Tanvir Ahmed", "01717-554433"],
  ["Tahsin Chowdhury", "01718-443322"],
  ["Sadia Kabir", "01719-998877"],
  ["Shafin Alam", "01710-112233"],
  ["Mahfuz Rahman", "01720-123456"],
  ["Afsana Karim", "01721-654321"],
  ["Tawsif Anik", "01722-556677"],
  ["Zara Hossain", "01723-778866"],
  ["Ishrat Jahan", "01724-445566"],
  ["Arifur Rahman", "01725-909090"],
  ["Tanzim Ali", "01726-343434"],
  ["Shamima Akter", "01727-565656"],
  ["Shuvo Roy", "01728-989898"],
  ["Priya Sultana", "01729-232323"],
];

// ---------------------------------------------------------------
// UI pieces
// ---------------------------------------------------------------
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cls(
        "rounded-full px-4 py-2 text-sm",
        active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      )}
    >
      {children}
    </button>
  );
}

function HeaderNote() {
  return (
    <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
      <div className="font-medium">Good to know</div>
      <ul className="list-disc pl-5">
        <li>
          International spends on travel, subscriptions and select global brands can unlock extra value and
          faster points accumulation.
        </li>
        <li>
          Keep exploring abroad — your card is optimized for overseas use, and you’ll see eligible perks
          reflected below.
        </li>
      </ul>
    </div>
  );
}

type ReportState =
  | { open: false }
  | {
      open: true;
      txn: Txn;
      message: string;
      submitted?: { name: string; phone: string };
    };

function ReportModal({
  state,
  onClose,
  onChangeMessage,
  onConfirmSubmit,
}: {
  state: ReportState & { open: true };
  onClose: () => void;
  onChangeMessage: (msg: string) => void;
  onConfirmSubmit: () => void;
}) {
  const { txn, message, submitted } = state;
  const d = new Date(txn.dt);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div
        className="w-full max-w-xl rounded-2xl bg-white p-5"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Report a problem</div>
          <button className="rounded-full bg-slate-100 px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="space-y-1 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <div>
            <span className="text-slate-500">Date:</span> {d.toLocaleDateString()}{" "}
            {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div>
            <span className="text-slate-500">Invoice:</span> {txn.invoice}
          </div>
          <div>
            <span className="text-slate-500">Merchant:</span> {txn.merchant}
          </div>
          <div>
            <span className="text-slate-500">MCC/Code:</span> {txn.merchantCode}
          </div>
          <div>
            <span className="text-slate-500">Amount:</span> {fmtBDT(txn.amountBDT)}
          </div>
          <div>
            <span className="text-slate-500">Country:</span> {txn.country}
          </div>
          <div>
            <span className="text-slate-500">Category:</span> {txn.category}
          </div>
        </div>

        {!submitted ? (
          <>
            <label className="mt-4 block text-sm text-slate-700">Write your complaint</label>
            <textarea
              value={message}
              onChange={(e) => onChangeMessage(e.target.value)}
              className="mt-1 h-28 w-full resize-none rounded-xl border p-3"
              placeholder="Describe what looks wrong about cashback or reward points…"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
            <div className="mt-3 flex justify-end">
              <button
                className="rounded-full bg-blue-600 px-5 py-2 text-white"
                onClick={onConfirmSubmit}
              >
                Submit
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="text-slate-700">
              Thank you for the report — we’re sorry about the inconvenience. We take it seriously and your
              designated Relationship Manager will contact you as soon as possible.
            </div>
            <div className="mt-3 rounded-lg bg-slate-100 p-3 text-slate-800">
              <div>
                <span className="text-slate-500">RM:</span> {submitted.name}
              </div>
              <div>
                <span className="text-slate-500">Contact:</span> {submitted.phone}
              </div>
            </div>
            <div className="mt-3 text-right">
              <button className="rounded-full bg-blue-600 px-5 py-2 text-white" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Tables (PLAIN look; only intl = light blue)
// ---------------------------------------------------------------
// --- Cashback table (locals white, foreign light blue) ---
function CashbackTable({
  rows,
  onReport,
  containerRef,
}: {
  rows: CashbackRow[];
  onReport: (t: Txn) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={containerRef}
      className="max-h-[65vh] overflow-auto rounded-xl border bg-white"
    >
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Invoice</th>
            <th className="px-3 py-2">Merchant</th>
            <th className="px-3 py-2">MCC/Code</th>
            <th className="px-3 py-2">Amount</th>
            <th className="px-3 py-2">Cashback</th>
            <th className="px-3 py-2">Receiving Time</th>
            <th className="px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const d = new Date(r.dt);
            const intl = r.country !== "BD";
            return (
              <tr key={r.id} className={intl ? "bg-blue-50" : "bg-white"}>
                <td className="px-3 py-2">{d.toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-3 py-2">{r.invoice}</td>
                <td className="px-3 py-2">{r.merchant}</td>
                <td className="px-3 py-2">{r.merchantCode}</td>
                <td className="px-3 py-2">{fmtBDT(r.amountBDT)}</td>
                <td className="px-3 py-2">
                  {r.cashbackBDT ? fmtBDT(r.cashbackBDT) : "—"}
                </td>
                <td className="px-3 py-2">{new Date(r.creditedAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <button
                    className="text-blue-600 underline hover:text-blue-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReport(r);
                    }}
                  >
                    Report
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- Points table (locals white, foreign light blue) ---
function PointsTable({
  rows,
  onReport,
  containerRef,
}: {
  rows: PointsRow[];
  onReport: (t: Txn) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={containerRef}
      className="max-h-[65vh] overflow-auto rounded-xl border bg-white"
    >
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Time</th>
            <th className="px-3 py-2">Invoice</th>
            <th className="px-3 py-2">Merchant</th>
            <th className="px-3 py-2">MCC/Code</th>
            <th className="px-3 py-2">Amount</th>
            <th className="px-3 py-2">Base Pts</th>
            <th className="px-3 py-2">Accelerated Pts</th>
            <th className="px-3 py-2">Total Pts</th>
            <th className="px-3 py-2">Will Credit</th>
            <th className="px-3 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const d = new Date(r.dt);
            const intl = r.country !== "BD";
            return (
              <tr key={r.id} className={intl ? "bg-blue-50" : "bg-white"}>
                <td className="px-3 py-2">{d.toLocaleDateString()}</td>
                <td className="px-3 py-2">
                  {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-3 py-2">{r.invoice}</td>
                <td className="px-3 py-2">{r.merchant}</td>
                <td className="px-3 py-2">{r.merchantCode}</td>
                <td className="px-3 py-2">{fmtBDT(r.amountBDT)}</td>
                <td className="px-3 py-2">{r.basePoints}</td>
                <td className="px-3 py-2">{r.accelPoints}</td>
                <td className="px-3 py-2">{r.totalPoints}</td>
                <td className="px-3 py-2">
                  {new Date(r.willCreditOn).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  <button
                    className="text-blue-600 underline hover:text-blue-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReport(r);
                    }}
                  >
                    Report
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------
export default function CashbackRewardsScreen() {
  const [tab, setTab] = useState<"cashback" | "points">("points");
  const txns = useMemo(() => genTxns(), []);
  const cashbackRows = useMemo(() => computeCashbackRows(txns), [txns]);
  const pointsRows = useMemo(() => computePointsRows(txns), [txns]);

  const summary = useMemo(() => {
    const cb = cashbackRows.reduce((s, r) => s + (r.cashbackBDT || 0), 0);
    const base = pointsRows.reduce((s, r) => s + r.basePoints, 0);
    const accel = pointsRows.reduce((s, r) => s + r.accelPoints, 0);
    return { cb: Math.round(cb * 100) / 100, base, accel, count: txns.length };
  }, [cashbackRows, pointsRows, txns.length]);

  const cbRef = useRef<HTMLDivElement>(null);
  const ptRef = useRef<HTMLDivElement>(null);
  const scrollBottom = () => {
    const node = tab === "cashback" ? cbRef.current : ptRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  };

  const [report, setReport] = useState<ReportState>({ open: false });

  const openReport = (t: Txn) =>
    setReport({ open: true, txn: t, message: "" });

  const changeReportMessage = (msg: string) =>
    setReport((prev) => (prev.open ? { ...prev, message: msg } : prev));

  const submitReport = () => {
    setReport((prev) => {
      if (!prev.open) return prev;
      const pick = RMS[Math.floor(Math.random() * RMS.length)];
      return {
        ...prev,
        submitted: { name: pick[0], phone: pick[1] },
      };
    });
  };

  const showingCount = tab === "cashback" ? cashbackRows.length : pointsRows.length;

  return (
    <div className="h-full w-full">
      {/* Header & tabs */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          <TabButton active={tab === "cashback"} onClick={() => setTab("cashback")}>
            Cashback
          </TabButton>
          <TabButton active={tab === "points"} onClick={() => setTab("points")}>
            Reward Points
          </TabButton>
        </div>
        <button
          className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200"
          onClick={scrollBottom}
        >
          Scroll to bottom
        </button>
      </div>

      <HeaderNote />

      {/* Quick summary */}
      <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-slate-500">Cashback (est.)</div>
          <div className="text-lg font-semibold">{fmtBDT(summary.cb)}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-slate-500">Base Points</div>
          <div className="text-lg font-semibold">{summary.base}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-slate-500">Accelerated</div>
          <div className="text-lg font-semibold">{summary.accel}</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-600">
        Showing {showingCount} of {summary.count}
      </div>

      {/* Tables */}
      <div className="mt-3">
        {tab === "cashback" ? (
          <CashbackTable rows={cashbackRows} onReport={openReport} containerRef={cbRef} />
        ) : (
          <PointsTable rows={pointsRows} onReport={openReport} containerRef={ptRef} />
        )}
      </div>

      {/* Report modal */}
      {report.open && (
        <ReportModal
          state={report}
          onClose={() => setReport({ open: false })}
          onChangeMessage={changeReportMessage}
          onConfirmSubmit={submitReport}
        />
      )}
    </div>
  );
}
