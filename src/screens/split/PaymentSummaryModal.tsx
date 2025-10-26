import React from "react";
import { X, CheckCircle2, Clock3, ArrowDownRight, ArrowUpRight } from "lucide-react";

type Item = {
  id: string;
  name: string;
  avatar?: string;
  mask?: string;
  requested: number;
  received: number;
  when: string; // display string
};

export default function PaymentSummaryModal({
  onClose,
  items,
}: {
  onClose: () => void;
  items: Item[];
}) {
  // totals
  const totalRequested = items.reduce((s, it) => s + it.requested, 0);
  const totalReceived = items.reduce((s, it) => s + Math.min(it.received, it.requested), 0);
  const totalPending = Math.max(0, totalRequested - totalReceived);

  const fmt = (n: number) =>
    `BDT ${n.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center">
      {/* dim background */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* panel */}
      <div className="relative z-[1201] w-[min(960px,96vw)] max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-600 px-4 py-3 text-white">
          <div>
            <div className="text-[15px] font-semibold">Receipt Summary</div>
            <div className="text-xs text-white/90">Who paid how much — and what’s pending</div>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 hover:bg-white/25"
            aria-label="Close summary"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* body */}
        <div className="h-[calc(92vh-56px)] overflow-y-auto p-4">
          {/* Totals */}
          <div className="receipt-totals">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-slate-600">Total Requested</span>
            </div>
            <div className="receipt-money">{fmt(totalRequested)}</div>

            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-slate-600">Total Received</span>
            </div>
            <div className="receipt-money text-blue-700">{fmt(totalReceived)}</div>

            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-slate-600">Pending</span>
            </div>
            <div className="receipt-money text-amber-700">{fmt(totalPending)}</div>
          </div>

          <div className="divider-dashed" />

          {/* Head labels */}
          <div className="receipt-row !bg-transparent hover:!bg-transparent">
            <div className="receipt-head">Person</div>
            <div className="receipt-head text-right">Requested</div>
            <div className="receipt-head text-right">Received</div>
            <div className="receipt-head text-right">Status</div>
          </div>

          {/* Rows */}
          <div className="mt-1 space-y-2">
            {items.map((it) => {
              const isPaid = it.received >= it.requested - 0.001;
              return (
                <div key={it.id} className="receipt-row">
                  <div className="flex items-center gap-3">
                    <div className="receipt-avatar">{it.avatar || "👤"}</div>
                    <div>
                      <div className="text-[15px] font-semibold text-slate-800">
                        {it.name}
                      </div>
                      {it.mask && (
                        <div className="text-xs text-slate-500">{it.mask}</div>
                      )}
                    </div>
                  </div>

                  <div className="receipt-money text-slate-800">{fmt(it.requested)}</div>
                  <div className="receipt-money text-blue-700">{fmt(Math.min(it.received, it.requested))}</div>

                  <div className="text-right">
                    {isPaid ? (
                      <span className="received">
                        <CheckCircle2 className="h-4 w-4" />
                        Received
                      </span>
                    ) : (
                      <span className="pending">
                        <Clock3 className="h-4 w-4" />
                        Pending
                      </span>
                    )}
                    <div className="mt-1 text-[11px] text-slate-500">{it.when}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* footer spacer */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
