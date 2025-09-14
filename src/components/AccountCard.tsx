// src/components/ActionGrid.tsx
import React from "react";
import { ACTIONS } from "../constants";
import type { Screen } from "../types";

/**
 * Glossier Action Grid with BRAC blue × amber theme.
 * - Keeps the exact navigation logic you already had
 * - No center QR pill
 * - Purely visual upgrade: gradient panel + embossed tiles
 */

const labelToScreen: Record<string, Screen> = {
  "Foreign Txn": "foreign",
  "Virtual Cards": "virtual",
  "Travel Insurance": "insurance",
  Endorsement: "endorsement",
  Eduflex: "eduflex",
};

export default function ActionGrid({ setScreen }: { setScreen: (s: Screen) => void }) {
  const onClick = (label: string) => {
    const s = labelToScreen[label];
    if (s) setScreen(s);
  };

  return (
    <div className="mt-8 px-4 pb-6">
      <div
        className={[
          "relative mx-auto rounded-[28px] px-5 pb-6 pt-8",
          "shadow-[0_24px_60px_rgba(11,99,182,0.22)] ring-1 ring-black/5",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(160deg, rgba(11,99,182,0.95) 0%, rgba(11,99,182,0.85) 34%, rgba(247,201,72,0.9) 100%)",
        }}
      >
        {/* Panel header */}
        <div className="mb-4 flex items-center justify-between px-1">
          <div className="text-white/95 text-[15px] font-semibold tracking-wide">
            Quick Actions
          </div>
          <div className="text-[11px] text-white/80">Powered by Astha</div>
        </div>

        {/* Actions grid */}
        <div className="grid grid-cols-4 gap-x-4 gap-y-6">
          {ACTIONS.map(({ icon: Icon, label, new: isNew }) => (
            <button
              key={label}
              onClick={() => onClick(label)}
              className={[
                "group relative flex flex-col items-center gap-2 rounded-2xl p-2 transition",
                "bg-white/92 hover:bg-white text-slate-800",
                "shadow-[0_8px_26px_rgba(0,0,0,0.08)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.12)]",
                "ring-1 ring-white/80",
              ].join(" ")}
              aria-label={label}
            >
              <div
                className={[
                  "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-b from-white to-slate-50",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),_0_8px_18px_rgba(11,99,182,0.08)]",
                ].join(" ")}
              >
                <Icon className="h-6 w-6 text-slate-700 transition-transform group-hover:-translate-y-0.5" />
              </div>
              <div className="text-center text-[11px] leading-tight font-medium">
                {label}
              </div>

              {isNew && (
                <span className="absolute -top-1.5 right-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow">
                  NEW
                </span>
              )}

              {/* subtle glow on hover */}
              <span
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  boxShadow: "0 0 0 2px rgba(11,99,182,0.08), 0 10px 24px rgba(11,99,182,0.14)",
                }}
              />
            </button>
          ))}
        </div>

        {/* Soft bottom caption */}
        <div className="mt-5 text-center text-[11px] text-white/85">
          Explore services—foreign transactions, virtual cards, insurance & more
        </div>

        {/* Decorative corner highlights */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-8 -top-8 h-24 w-24 rotate-12 rounded-2xl border border-white/25" />
          <div className="absolute -right-8 -bottom-8 h-24 w-24 -rotate-12 rounded-2xl border border-white/25" />
        </div>
      </div>
    </div>
  );
}
