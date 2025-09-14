// src/components/ActionGrid.tsx
import React from "react";
import { ACTIONS } from "../constants";
import type { Screen } from "../types";

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
    <div className="mt-12 px-4 pb-6">
      <div className="relative mx-auto rounded-[28px] bg-amber-400/95 px-5 pb-8 pt-8 shadow-2xl ring-1 ring-black/5">
        {/* grid */}
        <div className="grid grid-cols-4 gap-x-5 gap-y-6 sm:grid-cols-4">
          {ACTIONS.map(({ icon: Icon, label, new: isNew }) => (
            <div key={label} className="relative">
              <button
                onClick={() => onClick(label)}
                className="group flex w-full flex-col items-center gap-2 rounded-2xl p-2 transition-colors hover:bg-amber-300/60 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label={label}
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow">
                  <Icon className="h-6 w-6 text-slate-700" />
                </div>
                <div className="text-center text-[11px] leading-tight text-slate-800">
                  {label}
                </div>
              </button>

              {isNew && (
                <span className="absolute -top-2 right-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow">
                  NEW
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
