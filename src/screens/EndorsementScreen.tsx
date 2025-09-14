// src/screens/EndorsementScreen.tsx

import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import {
  Plane,
  ShieldCheck,
  Loader2,
  X,
  CreditCard,
  Copy,
  MapPin,
  ChevronDown,
  DollarSign,
  History as HistoryIcon,
  CheckCircle, 
} from "lucide-react";

/* local helpers */
function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}
const cn = classNames;

/* ------------------- Airport Endorsement (modal pieces) ------------------- */

// tiny hash + fallback QR
function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}
function FallbackBlockCode({ value, size = 128 }: { value: string; size?: number }) {
  const cells = 25;
  const cell = Math.floor(size / cells);
  const pad = Math.floor((size - cell * cells) / 2);
  const bits: boolean[] = [];
  let h = hashStr(String(value ?? ""));
  for (let i = 0; i < cells * cells; i++) {
    h = (h * 1664525 + 1013904223) >>> 0;
    bits.push((h & 1) === 1);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={0} y={0} width={size} height={size} fill="#fff" />
      {bits.map(
        (b, i) =>
          b && (
            <rect
              key={i}
              x={pad + (i % cells) * cell}
              y={pad + Math.floor(i / cells) * cell}
              width={cell}
              height={cell}
              fill="#111827"
            />
          )
      )}
    </svg>
  );
}

// Use react-qr-code if available; otherwise fall back safely (prevents white screen)
function SafeQRCode({ value, size = 128 }: { value: string; size?: number }) {
  const Any: any = QRCode as any;
  const Impl =
    typeof Any === "function"
      ? Any
      : Any?.default && typeof Any.default === "function"
      ? Any.default
      : null;
  if (Impl) return <Impl value={String(value ?? "")} size={size} />;
  return <FallbackBlockCode value={String(value ?? "")} size={size} />;
}

// misc utils
function airportCode(label: string) {
  return (label.split("—")[0] || "").trim().slice(0, 3).toUpperCase();
}
function formatYYMMDD(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}
function randomSuffix() {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
}
function buildToken(airportLabel: string, travelISO: string) {
  const code = airportCode(airportLabel);
  const d = formatYYMMDD(travelISO);
  const rand = randomSuffix();
  return `TOKEN-${code}-${d}-${rand}`;
}
async function safeCopy(text: string) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// mock cards
const mockCards = [
  { id: "c1", holder: "Nazia Haque", product: "Mastercard Millenial", last4: "8349", theme: ["#0a60a8", "#0c2f6a"] as const },
  { id: "c2", holder: "Nazia Haque", product: "Horizon Travel", last4: "5521", theme: ["#0a7aa8", "#093f6a"] as const },
  { id: "c3", holder: "Nazia Haque", product: "Tara Platinum", last4: "9920", theme: ["#0a5ba8", "#082a6a"] as const },
] as const;
type CardId = (typeof mockCards)[number]["id"];

type EndorseState = "idle" | "validating" | "done";
const ENDORSE_LIMIT = 1200; // USD per passport across all cards

// simple localStorage ledger
const LEDGER_KEY = "bbl_endorse_ledger_v1";
type LedgerEntry = {
  passport: string;
  dateISO: string;
  airport: string;
  cardId: CardId;
  amountUSD: number;
  status: "endorsed" | "token";
};
type Ledger = { entries: LedgerEntry[] };
function readLedger(): Ledger {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw) as Ledger;
    return parsed?.entries ? parsed : { entries: [] };
  } catch {
    return { entries: [] };
  }
}
function writeLedger(ledger: Ledger) {
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  } catch {}
}
function upsertEntry(entry: LedgerEntry) {
  const l = readLedger();
  l.entries.push(entry);
  writeLedger(l);
}
function sumEndorsedUSD(passport: string) {
  const p = passport.toUpperCase();
  return readLedger()
    .entries.filter((e) => e.passport === p && e.status === "endorsed")
    .reduce((acc, e) => acc + (e.amountUSD || 0), 0);
}
function lastEntries(passport: string, n = 5) {
  const p = passport.toUpperCase();
  return readLedger().entries.filter((e) => e.passport === p).slice(-n).reverse();
}
function sumByCard(passport: string): Record<CardId, number> {
  const p = passport.toUpperCase();
  const map: Record<CardId, number> = { c1: 0, c2: 0, c3: 0 };
  readLedger().entries.forEach((e) => {
    if (e.passport === p && e.status === "endorsed") {
      map[e.cardId] = (map[e.cardId] || 0) + e.amountUSD;
    }
  });
  return map;
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randPick<T>(arr: readonly T[]) {
  return arr[randInt(0, arr.length - 1)];
}
function seedIfNoHistory(passport: string) {
  const p = passport.toUpperCase();
  if (!p) return;
  const l = readLedger();
  if (l.entries.some((e) => e.passport === p)) return;
  const count = randInt(2, 3);
  const airports: ("DAC" | "CGP" | "SPD")[] = ["DAC", "DAC", "DAC", "CGP", "SPD"];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const monthsAgo = randInt(1, 9);
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    const dateISO = d.toISOString().slice(0, 10);
    const amount = randInt(120, 420);
    if (total + amount > 900) break;
    total += amount;
    l.entries.push({
      passport: p,
      dateISO,
      airport: randPick(airports),
      cardId: randPick(["c1", "c2", "c3"] as const),
      amountUSD: amount,
      status: "endorsed",
    });
  }
  writeLedger(l);
}

// atoms
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/55 backdrop-blur" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          {children}
        </div>
      </div>
    </div>
  );
}
function CardVisual({
  title,
  holder,
  last4,
  active,
  onClick,
  theme,
}: {
  title: string;
  holder: string;
  last4: string;
  active: boolean;
  onClick: () => void;
  theme: readonly [string, string];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full rounded-2xl p-4 text-left shadow-md transition",
        active ? "ring-2 ring-sky-500" : "hover:shadow-lg"
      )}
      style={{ background: `linear-gradient(135deg, ${theme[0]}, ${theme[1]})` }}
    >
      <div className="flex items-center justify-between text-white/90">
        <div className="text-sm font-semibold">BRAC BANK</div>
        <div className="text-xs opacity-90">titanium</div>
      </div>
      <div className="mt-6 text-2xl font-extrabold tracking-widest text-white">
        **** **** **** {last4}
      </div>
      <div className="mt-3 text-white">
        <div className="text-xs opacity-90">Cardholder</div>
        <div className="text-sm font-semibold">{holder}</div>
      </div>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-2 py-1 text-xs text-white">
        <CreditCard className="h-3.5 w-3.5" /> {title}
      </div>
    </button>
  );
}
function BarsPerCard({ passport }: { passport: string }) {
  const totals = sumByCard(passport);
  const endorsed = sumEndorsedUSD(passport);
  const rows = (["c1", "c2", "c3"] as const).map((id) => ({
    id,
    total: totals[id],
    meta: mockCards.find((c) => c.id === id)!,
  }));
  return (
    <div className="mt-3 rounded-xl border bg-white/60 p-3">
      <div className="mb-1 text-xs font-semibold text-slate-600">Per-card contribution</div>
      <div className="space-y-2">
        {rows.map((r) => {
          const pct = endorsed > 0 ? Math.round((r.total / endorsed) * 100) : 0;
          return (
            <div key={r.id} className="text-xs">
              <div className="flex items-center justify-between">
                <span>{r.meta.product}</span>
                <span>${r.total} ({pct}%)</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${r.meta.theme[0]}, ${r.meta.theme[1]})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KioskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, setState] = useState<EndorseState>("idle");
  const [passport, setPassport] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [airport, setAirport] = useState("DAC — Hazrat Shahjalal Intl, Dhaka");
  const [card, setCard] = useState<CardId | "">("");
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [showCards, setShowCards] = useState(false);
  const [amount, setAmount] = useState<string>("0");
  const [amountErr, setAmountErr] = useState<string>("");
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (passport && passport.length >= 3) seedIfNoHistory(passport);
  }, [passport]);

  const endorsedSoFar = sumEndorsedUSD(passport);
  const remaining = Math.max(0, ENDORSE_LIMIT - endorsedSoFar);

  const amountNum = Number(amount || "0");
  const amountValid =
    Number.isFinite(amountNum) && amountNum > 0 && amountNum <= remaining;
  const projectedRemaining = amountValid ? Math.max(0, remaining - amountNum) : remaining;

  const disabled = !(passport && travelDate && card && consent && amountValid);

  function reset() {
    setState("idle");
    setPassport("");
    setTravelDate("");
    setAirport("DAC — Hazrat Shahjalal Intl, Dhaka");
    setCard("");
    setConsent(false);
    setToken("");
    setCopyStatus("idle");
    setShowCards(false);
    setAmount("0");
    setAmountErr("");
    setHistoryOpen(false);
  }
  function close() {
    reset();
    onClose();
  }
  function validateAmount(next: string) {
    setAmount(next);
    const v = Number(next || "0");
    if (!Number.isFinite(v) || v <= 0) {
      setAmountErr("Enter a valid USD amount");
      return;
    }
    if (v > remaining) {
      setAmountErr(`Exceeds remaining limit of $${remaining}`);
      return;
    }
    setAmountErr("");
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setState("validating");
    setTimeout(() => {
      const safeAirport = typeof airport === "string" ? airport : "DAC — Hazrat Shahjalal Intl, Dhaka";
      setToken(buildToken(safeAirport, travelDate || ""));
      setState("done");
    }, 800);
  }
  async function recordEndorsed() {
    if (!passport || !amountValid) return;
    upsertEntry({
      passport: passport.toUpperCase(),
      dateISO: travelDate || new Date().toISOString().slice(0, 10),
      airport: airportCode(airport),
      cardId: card as CardId,
      amountUSD: amountNum,
      status: "endorsed",
    });
    setCopyStatus("idle");
    setAmount("0");
  }

  const recent = passport ? lastEntries(passport, 5) : [];

  return (
    <Modal open={open} onClose={close}>
      <div className="relative p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">
              Instant Endorsement • Passport Token
            </div>
            <div className="text-xs text-slate-500">
              Generate a token for faster processing at the kiosk. Physical seal required.
            </div>
          </div>
          <button
            onClick={close}
            className="ml-auto rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {state === "idle" && (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-500">Passport Number</label>
                <input
                  value={passport}
                  onChange={(e) => setPassport(e.target.value.toUpperCase())}
                  placeholder="E.g., BX0123456"
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500">Travel Date</label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">
                Choose a Credit Card
              </label>
              {!card && !showCards && (
                <button
                  type="button"
                  onClick={() => setShowCards(true)}
                  className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left"
                >
                  <span>Select your card</span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
              )}
              {showCards && (
                <div className="mt-2 grid max-h-64 grid-cols-1 gap-3 overflow-y-auto">
                  {mockCards.map((c) => (
                    <CardVisual
                      key={c.id}
                      title={c.product}
                      holder={c.holder}
                      last4={c.last4}
                      onClick={() => {
                        setCard(c.id);
                        setShowCards(false);
                      }}
                      active={card === c.id}
                      theme={c.theme}
                    />
                  ))}
                </div>
              )}
              {card && !showCards && (
                <div className="mt-2 text-sm text-slate-700">
                  Selected: {mockCards.find((c) => c.id === card)?.product} (****
                  {mockCards.find((c) => c.id === card)?.last4})
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-500">Airport</label>
                <select
                  value={airport}
                  onChange={(e) => setAirport(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2"
                >
                  <option>DAC — Hazrat Shahjalal Intl, Dhaka</option>
                  <option>CGP — Shah Amanat Intl, Chattogram</option>
                  <option>SPD — Saidpur Airport</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500">
                  Amount to endorse (USD)
                </label>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) =>
                    validateAmount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="e.g., 400"
                  className={cn(
                    "mt-1 w-full rounded-xl border px-3 py-2",
                    amountErr ? "border-rose-300" : ""
                  )}
                />
                <div className="mt-1 text-xs text-slate-600">
                  Remaining now: <b>${remaining}</b> • Projected after this:{" "}
                  <b>${projectedRemaining}</b>
                </div>
                {amountErr && (
                  <div className="mt-1 text-xs text-rose-600">{amountErr}</div>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-sky-50 p-3 text-sm text-slate-700">
              <div className="font-semibold">Endorsement Limit</div>
              <div>
                You can endorse up to <b>${ENDORSE_LIMIT}</b> USD per passport.
              </div>
              <div>
                Already endorsed: <b>${endorsedSoFar}</b> USD • Remaining:{" "}
                <b>${remaining}</b> USD
              </div>
              {passport && <BarsPerCard passport={passport} />}
            </div>

            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span>
                I confirm my passport details are correct and authorize BRAC Bank
                to process endorsement at the airport kiosk.
              </span>
            </label>

            <button
              disabled={disabled}
              className={cn(
                "w-full rounded-xl px-4 py-3 font-semibold text-white shadow-sm transition",
                disabled ? "cursor-not-allowed bg-slate-300" : "bg-sky-600 hover:bg-sky-700"
              )}
            >
              Get Token
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4" />
              Bank-grade security • No data stored on device
            </div>

            {passport && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setHistoryOpen((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs text-sky-700 underline"
                >
                  <HistoryIcon className="h-3 w-3" /> View recent simulations
                </button>
                {historyOpen && (
                  <div className="mt-2 rounded-lg border bg-white/60">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-2 py-1 text-left">Date</th>
                          <th className="px-2 py-1 text-left">Airport</th>
                          <th className="px-2 py-1 text-left">Card</th>
                          <th className="px-2 py-1 text-right">Amount</th>
                          <th className="px-2 py-1 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.length === 0 && (
                          <tr>
                            <td className="px-2 py-2 text-slate-500" colSpan={5}>
                              No history yet.
                            </td>
                          </tr>
                        )}
                        {recent.map((r, idx) => (
                          <tr key={idx} className="odd:bg-white even:bg-slate-50">
                            <td className="px-2 py-1">{r.dateISO}</td>
                            <td className="px-2 py-1">{r.airport}</td>
                            <td className="px-2 py-1">
                              {mockCards.find((c) => c.id === r.cardId)?.product || r.cardId}
                            </td>
                            <td className="px-2 py-1 text-right">${r.amountUSD}</td>
                            <td className="px-2 py-1">{r.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </form>
        )}

        {state === "validating" && (
          <div className="flex flex-col items-center gap-3 py-12 text-slate-600">
            <Loader2 className="h-8 w-8 animate-spin" />
            <div className="text-sm">Calculating limit & generating token…</div>
          </div>
        )}

        {state === "done" && (
          <div className="py-2">
            {airport?.startsWith?.("DAC") ? ( // ✅ guard to avoid rare undefined crash
              <>
                <div className="mb-2 flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Token Generated</span>
                </div>
                <div className="rounded-2xl border p-4">
                  <div className="text-sm">Your token</div>
                  <div className="text-xl font-extrabold tracking-wide">{token}</div>
                  <div className="mt-3">
                    <SafeQRCode value={token} size={128} />
                  </div>
                  <div className="mt-3 flex items-start gap-2 text-sm text-slate-700">
                    <MapPin className="mt-0.5 h-4 w-4" />
                    <div>
                      <div className="font-semibold">
                        BRAC Bank Kiosk — Hazrat Shahjalal International Airport (DAC)
                      </div>
                      <div>Departures Area (Terminal side), Dhaka</div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
                    <DollarSign className="h-4 w-4" />
                    {Math.max(0, ENDORSE_LIMIT - sumEndorsedUSD(passport))} USD left to endorse
                  </div>
                  {passport && <BarsPerCard passport={passport} />}
                  <div className="mt-2 text-xs text-slate-500">
                    This token speeds up the kiosk flow. Endorsement is finalized only after the
                    physical seal.
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        const ok = await safeCopy(token);
                        setCopyStatus(ok ? "ok" : "fail");
                      }}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                        copyStatus === "ok"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : copyStatus === "fail"
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : ""
                      )}
                    >
                      <Copy className="h-4 w-4" />
                      {copyStatus === "ok"
                        ? "Copied!"
                        : copyStatus === "fail"
                        ? "Copy failed — select below"
                        : "Copy Token"}
                    </button>
                    {copyStatus === "fail" && (
                      <input
                        readOnly
                        value={token}
                        onFocus={(e) => e.currentTarget.select()}
                        className="w-48 rounded-lg border px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={recordEndorsed}
                      disabled={!amountValid}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-semibold text-white",
                        amountValid ? "bg-emerald-600 hover:bg-emerald-700" : "cursor-not-allowed bg-slate-300"
                      )}
                    >
                      Simulate Endorsed at Kiosk (${amountNum})
                    </button>
                    <button
                      onClick={close}
                      className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border p-4 text-slate-700">
                Endorsement is <b>not available</b> at this airport. Please visit the BRAC Bank kiosk at{" "}
                <b>Hazrat Shahjalal International Airport (DAC)</b> to complete the physical endorsement.
                <div className="mt-3 text-xs text-slate-500">
                  Tip: You can still save your details and pick a card here, then switch to DAC to generate a
                  token.
                </div>
                <div className="mt-4 flex items-center justify-end">
                  <button
                    onClick={close}
                    className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ------------------- Main Endorsement Screen ------------------- */

export default function EndorsementScreen({ onBack }: { onBack?: () => void }) {
  type EndorsePack = { key: "data" | "netflix"; title: string; subtitle?: string };
  const PACKS: EndorsePack[] = [
    { key: "data", title: "2GB / 3 days", subtitle: "Roaming data" },
    { key: "netflix", title: "Netflix voucher", subtitle: "Streaming credit" },
  ];

  // --- NEW: richer branch seeds (addr/hours/type) ---
  const branches = [
    {
      name: "Gulshan Branch",
      addr: "House: 50 (1st Floor), Road-03, Plot-02, Block-SW(H), Gulshan Avenue, Gulshan-1, Dhaka",
      hours: "(Sun – Thu): 10:00 am to 4:00 pm",
      lat: 23.7925, lon: 90.4078, type: "Branch",
    },
    {
      name: "Banani Branch",
      addr: "16, Navana Yusuf Infinity Bhaban (2nd Floor), Bir Uttam A.K. Khandaker Road, Mohakhali, Banani, Dhaka",
      hours: "(Sun – Thu): 10:00 am to 4:00 pm",
      lat: 23.7935, lon: 90.4042, type: "Branch",
    },
    {
      name: "Dhanmondi Branch",
      addr: "Road 11, Dhanmondi, Dhaka",
      hours: "(Sun – Thu): 10:00 am to 4:00 pm",
      lat: 23.747, lon: 90.374, type: "Branch",
    },
  ] as const;

  // --- Locator state & helpers (as previously implemented) ---
  type Mode = "near" | "district";
  const [pack, setPack] = useState<EndorsePack>(PACKS[0]);
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [code, setCode] = useState("");
  const [geoMsg, setGeoMsg] = useState("");
  const [kioskOpen, setKioskOpen] = useState(false);

  const [mode, setMode] = useState<Mode>("near");
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [searchBy, setSearchBy] = useState<
    "All" | "ATM" | "Branch" | "Sub-Branch" | "Agent Banking" | "SME Unit Office"
  >("All");
  const [district, setDistrict] = useState<string>("Dhaka");

  const [nearby, setNearby] = useState<
    { name: string; km: number; lat: number; lon: number; addr: string; hours: string }[]
  >([]);

  const districtCenters: Record<string, { lat: number; lon: number }> = {
    Dhaka: { lat: 23.7806, lon: 90.407 },
    Chittagong: { lat: 22.3569, lon: 91.7832 },
    Sylhet: { lat: 24.8949, lon: 91.8687 },
    Khulna: { lat: 22.8456, lon: 89.5403 },
  };

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function runSearch(origin: { lat: number; lon: number }) {
    const filtered = branches.filter((b) => (searchBy === "All" ? true : b.type === "Branch"));
    const within = filtered
      .map((b) => ({ ...b, km: Number(haversine(origin.lat, origin.lon, b.lat, b.lon).toFixed(2)) }))
      .filter((b) => b.km <= radiusKm + 0.001)
      .sort((a, b) => a.km - b.km);

    const list = within.length
      ? within
      : filtered
          .map((b) => ({ ...b, km: Number(haversine(origin.lat, origin.lon, b.lat, b.lon).toFixed(2)) }))
          .sort((a, b) => a.km - b.km)
          .slice(0, 3);

    setNearby(list);
    setGeoMsg("");
    setStep(4);
  }

  function requestLocation() {
    setGeoMsg("Requesting location…");
    const fallback = { lat: 23.7806, lon: 90.407 };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => runSearch({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => runSearch(fallback),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      runSearch(fallback);
    }
  }

  function handleSearch() {
    if (mode === "near") {
      requestLocation();
    } else {
      const center = districtCenters[district] || districtCenters["Dhaka"];
      setGeoMsg("Searching…");
      runSearch(center);
    }
  }

  return (
    <div className="p-4 pb-28">
      {onBack && (
        <button onClick={onBack} className="mb-3 text-white/90 underline">
          &lt; Back
        </button>
      )}

      {/* Step 0: Pack + Airport Endorsement entry */}
      {step === 0 && (
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="text-lg font-semibold text-slate-800">Endorsement</div>

          {/* Airport Endorsement block */}
          <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-600 text-white">
                  <Plane className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-slate-800">Airport Endorsement</div>
                  <div className="text-xs text-slate-600">Generate a DAC kiosk token and simulate endorsement</div>
                </div>
              </div>
              <button
                className="rounded-full bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                onClick={() => setKioskOpen(true)}
              >
                Get Token
              </button>
            </div>
          </div>

          {/* Mini packs */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PACKS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPack(p)}
                className={classNames(
                  "rounded-2xl border p-4 text-left hover:shadow",
                  pack.key === p.key ? "border-blue-500 ring-1 ring-blue-300" : "border-slate-200"
                )}
              >
                <div className="text-[15px] font-semibold">{p.title}</div>
                <div className="text-xs text-slate-600">{p.subtitle}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-indigo-50 p-4">
            <div className="text-sm text-slate-600">Selected pack</div>
            <div className="mt-1 text-xl font-bold">{pack.title}</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="rounded-xl bg-blue-600 px-4 py-2 text-white" onClick={() => setStep(1)}>
              I have 8-digit code
            </button>
            <button className="rounded-xl bg-slate-100 px-4 py-2" onClick={() => setStep(3)}>
              I don’t have code
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Enter code */}
      {step === 1 && (
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="text-lg font-semibold text-slate-800">Enter 8-digit code</div>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
            className="mt-3 w-full rounded-xl border p-3 text-center tracking-[6px]"
            placeholder="XXXXXXXX"
          />
          <div className="mt-4 flex gap-2">
            <button className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-white" onClick={() => setStep(code.length === 8 ? 2 : 1)}>
              Verify
            </button>
            <button className="flex-1 rounded-xl bg-slate-100 px-4 py-2" onClick={() => setStep(0)}>
              Back
            </button>
          </div>
          {code.length !== 8 && <div className="mt-2 text-center text-xs text-red-600">Please enter 8 digits</div>}
        </div>
      )}

      {/* Step 2: Success */}
      {step === 2 && (
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          {pack.key === "data" ? (
            <div className="mb-2 rounded-xl bg-emerald-50 p-3 text-emerald-700">Roaming data activated</div>
          ) : (
            <div className="mb-2 rounded-xl bg-emerald-50 p-3 text-emerald-700">Netflix voucher activated</div>
          )}
          <div className="rounded-2xl bg-slate-50 p-3 text-sm">
            <div>
              Pack: <span className="font-semibold">{pack.title}</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pack.key === "data" ? (
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-white">Avail roaming data</button>
            ) : (
              <button className="rounded-xl bg-fuchsia-600 px-4 py-2 text-white">Redeem on Netflix</button>
            )}
            <button className="rounded-xl bg-slate-100 px-4 py-2" onClick={onBack}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Locator (tabs + slider + chips) */}
      {step === 3 && (
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="text-lg font-semibold text-slate-800">Locator</div>

          {/* Tabs */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className={classNames("rounded-2xl p-4 text-center", mode === "near" ? "bg-[#0b63b6] text-white" : "bg-slate-100")}
              onClick={() => setMode("near")}
            >
              Near me
            </button>
            <button
              className={classNames("rounded-2xl p-4 text-center", mode === "district" ? "bg-slate-200" : "bg-slate-100")}
              onClick={() => setMode("district")}
            >
              Search By District
            </button>
          </div>

          {/* Radius slider */}
          <div className="mt-4 rounded-2xl bg-white">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-slate-700">Select Radius</div>
              <div className="text-slate-700">{radiusKm} km</div>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
              className="w-full accent-[#0b63b6]"
            />
          </div>

          {/* Search By chips */}
          <div className="mt-5 rounded-2xl bg-white">
            <div className="mb-2 text-slate-700">Search By</div>
            <div className="grid grid-cols-3 gap-2">
              {["All", "ATM", "Branch", "Sub-Branch", "Agent Banking", "SME Unit Office"].map((x) => (
                <button
                  key={x}
                  onClick={() =>
                    setSearchBy(
                      x as "All" | "ATM" | "Branch" | "Sub-Branch" | "Agent Banking" | "SME Unit Office"
                    )
                  }
                  className={classNames(
                    "rounded-xl px-4 py-2 text-sm",
                    searchBy === x ? "bg-[#0b63b6] text-white" : "bg-slate-100"
                  )}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>

          {/* District select */}
          {mode === "district" && (
            <div className="mt-4">
              <label className="mb-1 block text-sm text-slate-600">Select District</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-xl border px-3 py-2"
              >
                {Object.keys(districtCenters).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search + Back */}
          <div className="mt-6 grid grid-cols-1 gap-3">
            <button className="rounded-full bg-[#0b63b6] py-3 text-white" onClick={handleSearch}>
              SEARCH
            </button>
            <button className="rounded-full bg-slate-100 py-3" onClick={() => setStep(0)}>
              Back
            </button>
          </div>

          {!!geoMsg && <div className="mt-2 text-center text-xs text-slate-600">{geoMsg}</div>}
        </div>
      )}

      {/* Step 4: Results (cards like your screenshots) */}
      {step === 4 && (
        <div className="rounded-3xl bg-white p-5 shadow-xl">
          <div className="text-lg font-semibold text-slate-800">List</div>

          <div className="mt-3 space-y-5">
            {nearby.map((b, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="text-lg font-semibold text-slate-800">{b.name}</div>

                <div className="mt-2 text-sm text-slate-700">
                  <div>📍 {b.addr}</div>
                </div>
                <div className="mt-1 text-sm text-slate-700">⏰ {b.hours}</div>

                <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
                  <div>Distance</div>
                  <div className="font-semibold">{b.km} km</div>
                </div>

                <div className="mt-3">
                  <a
                    className="block rounded-full bg-[#0b63b6] py-3 text-center text-sm font-semibold text-white"
                    href={`https://www.google.com/maps/search/?api=1&query=${b.lat},${b.lon}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    VIEW DIRECTION
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <button className="w-full rounded-xl bg-slate-100 px-4 py-2" onClick={onBack}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Airport Endorsement modal */}
      <KioskModal open={kioskOpen} onClose={() => setKioskOpen(false)} />
    </div>
  );
}
