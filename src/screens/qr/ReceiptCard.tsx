// src/screens/qr/ReceiptCard.tsx
import React from "react";
import { CheckCircle2, Download, Share2, RotateCcw, Sparkles } from "lucide-react";

type Props = {
  merchant: { name: string; walletMask?: string };
  fromAccount: string;
  amount: number;           // merchant amount
  miniTopUp?: number;       // optional BDT sent to Mini-Savings
  rewardPoints: number;     // floor(amount/80)
  reference: string;
  date: Date;
  onDownload: () => void;
  onShare: () => void;
  onAnother: () => void;
};

export default function ReceiptCard({
  merchant,
  fromAccount,
  amount,
  miniTopUp = 0,
  rewardPoints,
  reference,
  date,
  onDownload,
  onShare,
  onAnother,
}: Props) {
  const amountFmt = new Intl.NumberFormat("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  const totalDebit = amount + (miniTopUp || 0);
  const totalFmt = new Intl.NumberFormat("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalDebit);

  return (
    <section id="qr-receipt" className="relative select-none">
      <div className="overflow-hidden rounded-[24px] ring-1 ring-black/5 shadow-[0_24px_80px_rgba(9,62,115,0.18)] bg-white">
        {/* HEADER */}
        <div className="relative px-6 pt-6 pb-28 text-white bg-gradient-to-br from-[#0B63B6] via-[#114A92] to-[#093E73]">
          {/* soft glow */}
          <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-6 -right-10 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15 ring-1 ring-white/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            </span>
            <div>
              <div className="text-[13px] text-white/85">Status</div>
              <div className="text-lg font-semibold tracking-wide">Payment successful</div>
              <div className="mt-1 text-[12px] text-white/70">BRAC Bank Astha • QR Payment</div>
            </div>
          </div>

          {/* REWARD POINTS — highlight */}
          <div className="mt-5">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 px-4 py-2 text-slate-900 shadow-[0_12px_28px_rgba(251,191,36,0.35)] ring-1 ring-amber-300">
              <Sparkles className="h-5 w-5" />
              <div className="text-sm font-extrabold tracking-wide">
                You earned <span className="text-slate-900">{rewardPoints}</span> Reward Point{rewardPoints === 1 ? "" : "s"} 🎉
              </div>
            </div>
          </div>

          {/* Chips */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Chip title="Paid to merchant" value={`BDT ${amountFmt}`} />
            <Chip title="Reference" value={reference} />
            <Chip
              title="Date"
              value={new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium" }).format(date)}
            />
          </div>

          {/* CURVED WAVE SEPARATOR */}
          <WaveSeparator />
        </div>

        {/* BODY */}
        <div className="px-4 pb-6 sm:px-6 -mt-10">
          <div className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
            <div className="mb-3 text-[15px] font-semibold text-slate-800">Payment details</div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
              <Row label="Merchant">
                <span className="font-medium text-slate-900">{merchant.name}</span>
                {merchant.walletMask && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{merchant.walletMask}</span>
                )}
              </Row>

              <Row label="From account" className="sm:col-span-2">
                <span className="font-medium text-slate-900">{fromAccount}</span>
              </Row>

              <Row label="Merchant amount">
                <span className="font-semibold text-emerald-600">BDT {amountFmt}</span>
              </Row>

              {miniTopUp > 0 && (
                <Row label="Mini-Savings top-up">
                  <span className="font-semibold text-amber-600">BDT {miniTopUp.toFixed(2)}</span>
                </Row>
              )}

              <Row label="Total debited" className="sm:col-span-2">
                <span className="rounded-md bg-sky-50 px-2 py-0.5 font-semibold text-slate-900 ring-1 ring-sky-200">
                  BDT {totalFmt}
                </span>
              </Row>

              <Row label="Reference" className="sm:col-span-2">
                <span className="font-medium text-slate-900">{reference}</span>
              </Row>
            </dl>

            {/* ACTIONS */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <ActionButton onClick={onDownload} icon={Download}>Download</ActionButton>
                <ActionButton onClick={onShare} icon={Share2}>Share</ActionButton>
              </div>
              <button
                onClick={onAnother}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white shadow-[0_10px_20px_rgba(4,120,87,0.25)] hover:bg-emerald-700"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Make another</span>
              </button>
            </div>

            <p className="mt-4 rounded-xl bg-gradient-to-br from-sky-50 to-amber-50 p-3 text-[12px] leading-relaxed text-slate-600 ring-1 ring-black/5">
              This is a system-generated receipt from BRAC Bank Astha. Keep the reference number for any future query.
            </p>
          </div>
          {/* soft footer fade */}
          <div className="pointer-events-none mx-auto mt-6 h-10 max-w-3xl rounded-b-2xl bg-gradient-to-b from-transparent to-black/[0.03]" />
        </div>
      </div>
    </section>
  );
}

/* --- building blocks --- */
function Chip({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/95 px-4 py-3 text-slate-800 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-white/70">
      <div className="text-[11px] text-slate-500">{title}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Row({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={["flex flex-col gap-1", className || ""].join(" ")}>
      <dt className="text-[12px] text-slate-500">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function ActionButton({
  onClick,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-slate-700 ring-1 ring-black/5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:bg-slate-50"
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{children}</span>
    </button>
  );
}

/* smooth wave between header and body */
function WaveSeparator() {
  return (
    <svg
      className="pointer-events-none absolute bottom-0 left-0 h-12 w-full text-white"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
    >
      {/* subtle shadow under the wave */}
      <defs>
        <filter id="dropshadow" height="130%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="0" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.25" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M0,50 C220,130 460,-10 720,40 C980,90 1220,30 1440,70 L1440,120 L0,120 Z"
        fill="currentColor"
        filter="url(#dropshadow)"
      />
    </svg>
  );
}
