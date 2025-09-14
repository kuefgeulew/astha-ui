import React, { useMemo, useState } from "react";
import { DISPLAY_NAME } from "../constants";

// --- helpers ----------------------------------------------------

const PHYSICAL_PAN_LAST4 = "1934";
const PHYSICAL_MASKED = `4248 7080 **** ${PHYSICAL_PAN_LAST4}` as const;

type Mode = "permanent" | "onetime" | null;

type CardData = {
  panMasked: string;
  panFull: string;
  expiry: string;
  cvv: string;
  tokenLast4?: string;
};

const PERMANENT_CARD: CardData = {
  // HARD-CODED – do not change
  panFull: "9877 8833 5522 7814",
  panMasked: "9877 8833 **** ****",
  expiry: "03/29",
  cvv: "771",
  tokenLast4: "7814",
};

function genOneTimeCard(): CardData {
  const seed = Date.now() % 100000;
  const rnd = (n: number) => {
    const x = Math.sin(n + seed) * 10000;
    return Math.floor((x - Math.floor(x)) * 10);
  };
  const digits = Array.from({ length: 16 }, (_, i) => rnd(i)).join("");
  const groups = digits.match(/.{1,4}/g) || [];
  const panFull = groups.join(" ");
  const panMasked = groups.map((g, i) => (i < 2 ? g : "****")).join(" ");
  const mm = ((rnd(99) % 12) + 1).toString().padStart(2, "0");
  const yy = ((rnd(77) % 5) + 26).toString().padStart(2, "0");
  const cvv = `${rnd(1)}${rnd(2)}${rnd(3)}`;
  const tokenLast4 = groups[3] || "0000";
  return { panMasked, panFull, expiry: `${mm}/${yy}`, cvv, tokenLast4 };
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
}

// --- UI ---------------------------------------------------------

export default function VirtualCardsScreen({ onBack }: { onBack: () => void }) {
  const [enabled, setEnabled] = useState(true);
  const [physicalBlocked, setPhysicalBlocked] = useState(false);
  const [askBlock, setAskBlock] = useState(false);

  const [mode, setMode] = useState<Mode>(null); // choose permanent / one-time
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");

  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  const [isPermanent, setIsPermanent] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 1600);
  };

  // OTP → issue card
  const verifyAndIssue = () => {
    if (otp.replace(/\D/g, "").length !== 6) return;
    if (mode === "permanent") {
      setIsPermanent(true);
      setActiveCard(PERMANENT_CARD);
    } else if (mode === "onetime") {
      setIsPermanent(false);
      setActiveCard(genOneTimeCard());
    }
    setOtpOpen(false);
    setOtp("");
    setReveal(false);
    notify("Virtual card activated.");
  };

  const makeTxn = () => {
    if (!activeCard) return;
    setBusy(true);
    notify("Processing transaction…");
    setTimeout(() => {
      setBusy(false);
      notify("Transaction approved.");
      // auto-rotate for one-time
      if (!isPermanent) {
        const next = genOneTimeCard();
        setActiveCard(next);
        setReveal(false);
        notify("Your PAN rotated automatically.");
      }
    }, 900);
  };

  const rotate = () => {
    if (!activeCard || isPermanent) return;
    const next = genOneTimeCard();
    setActiveCard(next);
    setReveal(false);
    notify("PAN rotated.");
  };

  const copy = (which: "masked" | "full") => {
    if (!activeCard) return;
    const text = which === "full" ? activeCard.panFull : activeCard.panMasked;
    navigator.clipboard?.writeText(text).then(() => notify(which === "full" ? "Full PAN copied." : "Masked PAN copied."));
  };

  const walletButtons = useMemo(
    () =>
      isPermanent && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => notify("Added to Google Pay.")}>
            Add to Google Pay
          </button>
          <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => notify("Added to Apple Wallet.")}>
            Add to Apple Wallet
          </button>
        </div>
      ),
    [isPermanent]
  );

  return (
    <div className="p-4 pb-28">
      {/* Back to Home */}
      <button onClick={onBack} className="mb-3 text-white/90 underline">&lt; Back</button>

      {/* Toggle row */}
      <div className="rounded-2xl bg-white/10 p-4 text-white shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold">Virtual Card</div>
            <div className="text-sm opacity-90">Turn on to shop securely online</div>
          </div>
          <button
            className={`h-7 w-12 rounded-full p-0.5 transition ${enabled ? "bg-emerald-400" : "bg-slate-400"}`}
            onClick={() => setEnabled((e) => !e)}
            aria-label="Toggle Virtual Card"
          >
            <div className={`h-6 w-6 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      {/* Physical card block — shown always, right after toggle */}
      <div className="mt-4 rounded-3xl bg-white p-5 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-lg font-semibold text-slate-800">Physical Card</div>
          <Pill tone={physicalBlocked ? "red" : "green"}>{physicalBlocked ? "Blocked" : "Active"}</Pill>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 text-white">
          <div className="text-xs opacity-80">HORIZON • TRAVEL</div>
          <div className="mt-3 font-mono text-xl tracking-widest">{PHYSICAL_MASKED}</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] opacity-70">Cardholder</div>
              <div className="text-[12px] font-semibold">{DISPLAY_NAME}</div>
            </div>
            <div>
              <div className="text-[11px] opacity-70">Last 4</div>
              <div className="text-[12px] font-semibold">{PHYSICAL_PAN_LAST4}</div>
            </div>
          </div>

          <div className="mt-4">
            <button
              className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm"
              onClick={() => setAskBlock(true)}
            >
              {physicalBlocked ? "Unblock physical" : "Block physical (optional)"}
            </button>
          </div>
        </div>
      </div>

      {/* Choose mode (Permanent / One-time) */}
      {enabled && (
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-xl">
          <div className="mb-2 flex items-center gap-2">
            <div className="text-lg font-semibold text-slate-800">Virtual Card</div>
            {activeCard ? <Pill tone="green">Active</Pill> : <Pill tone="blue">Setup</Pill>}
            {mode === "permanent" && <Pill tone="amber">Permanent</Pill>}
            {mode === "onetime" && <Pill tone="slate">One-time</Pill>}
            <Pill tone={physicalBlocked ? "red" : "slate"}>Physical: {physicalBlocked ? "Blocked" : "Active"}</Pill>
          </div>

          {!activeCard && (
            <>
              <div className="flex gap-2">
                <button
                  className={`rounded-full px-3 py-1 text-sm ${mode === "permanent" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}
                  onClick={() => setMode("permanent")}
                >
                  Permanent
                </button>
                <button
                  className={`rounded-full px-3 py-1 text-sm ${mode === "onetime" ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-700"}`}
                  onClick={() => setMode("onetime")}
                >
                  One-time
                </button>
              </div>

              <div className="mt-3">
                <button
                  disabled={!mode}
                  onClick={() => setOtpOpen(true)}
                  className={`w-full rounded-xl px-4 py-2 text-white ${mode ? "bg-blue-600" : "bg-slate-300"} `}
                >
                  {mode ? "Verify & Activate (OTP)" : "Select a type to continue"}
                </button>
              </div>
            </>
          )}

          {/* Active card panel with its own scroll area */}
          {activeCard && (
            <div className="mt-4 max-h-[520px] overflow-y-auto rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-4 text-white">
              <div className="mb-2 flex items-center gap-2">
                <Pill tone={frozen ? "slate" : "green"}>{frozen ? "Frozen" : "Active"}</Pill>
                <Pill tone={isPermanent ? "amber" : "slate"}>{isPermanent ? "Permanent" : "One-time"}</Pill>
                <Pill tone={physicalBlocked ? "red" : "slate"}>Physical: {physicalBlocked ? "Blocked" : "Active"}</Pill>
              </div>

              <div className="text-xs opacity-80">HORIZON • TRAVEL</div>
              <div className="mt-3 font-mono text-xl tracking-widest">
                {reveal ? activeCard.panFull : activeCard.panMasked}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-[11px] opacity-70">Cardholder</div>
                  <div className="text-[12px] font-semibold">{DISPLAY_NAME}</div>
                </div>
                <div>
                  <div className="text-[11px] opacity-70">Expiry</div>
                  <div className="text-[12px] font-semibold">{activeCard.expiry}</div>
                </div>
                <div>
                  <div className="text-[11px] opacity-70">CVV</div>
                  <div className="text-[12px] font-semibold">{reveal ? activeCard.cvv : "***"}</div>
                </div>
              </div>
              {activeCard.tokenLast4 && <div className="mt-2 text-[10px] opacity-80">Token last4: {activeCard.tokenLast4}</div>}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => setReveal((r) => !r)}>
                  {reveal ? "Hide PAN" : "Reveal PAN"}
                </button>
                <button
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm"
                  onClick={makeTxn}
                  disabled={busy || frozen}
                >
                  {busy ? "Processing…" : "Make a transaction"}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => copy("masked")}>
                  Copy masked
                </button>
                <button
                  className="rounded-lg bg-white/10 px-3 py-2 text-sm"
                  onClick={() => copy("full")}
                  disabled={!reveal}
                  title={!reveal ? "Reveal first" : ""}
                >
                  Copy full PAN
                </button>
              </div>

              {/* Rotate visible ONLY for one-time */}
              {!isPermanent && (
                <div className="mt-4">
                  <button className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={rotate} disabled={frozen}>
                    Rotate PAN
                  </button>
                </div>
              )}

              <div className="mt-4">
                {frozen ? (
                  <button className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => { setFrozen(false); notify("Card unfrozen."); }}>
                    Unfreeze
                  </button>
                ) : (
                  <button className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm" onClick={() => { setFrozen(true); notify("Card frozen."); }}>
                    Freeze
                  </button>
                )}
              </div>

              {walletButtons}
            </div>
          )}
        </div>
      )}

      {/* Block physical modal */}
      {askBlock && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40">
          <div className="w-[92%] max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="text-lg font-semibold text-slate-800">{physicalBlocked ? "Unblock physical card?" : "Block physical card?"}</div>
            <p className="mt-1 text-sm text-slate-600">
              This is optional. You can keep your plastic active while using a virtual card.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className={`rounded-xl px-4 py-2 text-white ${physicalBlocked ? "bg-emerald-600" : "bg-red-600"}`}
                onClick={() => {
                  setPhysicalBlocked((x) => !x);
                  setAskBlock(false);
                }}
              >
                {physicalBlocked ? "Unblock" : "Block"}
              </button>
              <button className="rounded-xl bg-slate-100 px-4 py-2" onClick={() => setAskBlock(false)}>
                Keep as is
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP modal */}
      {otpOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/40">
          <div className="w-[92%] max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="text-lg font-semibold text-slate-800">Enter OTP</div>
            <p className="mt-1 text-sm text-slate-600">We’ve sent a 6-digit code to your SMS and email.</p>
            <input
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              className="mt-3 w-full rounded-xl border p-3 text-center tracking-[6px]"
              placeholder="______"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-slate-100 px-4 py-2" onClick={() => setOtpOpen(false)}>
                Cancel
              </button>
              <button
                className={`rounded-xl px-4 py-2 text-white ${otp.length === 6 ? "bg-blue-600" : "bg-slate-300"}`}
                onClick={verifyAndIssue}
                disabled={otp.length !== 6}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {!!toast && (
        <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-[92%] max-w-sm rounded-xl bg-slate-900 px-3 py-2 text-center text-[12px] text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
