// src/screens/split/AnimatedReceipt.tsx
import React from "react";

export default function AnimatedReceipt({
  title,
  subtitle,
  lines,
  totalLabel = "Total",
  total,
}: {
  title: string;
  subtitle?: string;
  lines: { left: string; right: string }[];
  totalLabel?: string;
  total: string;
}) {
  return (
    <div className="relative mx-auto w-full max-w-md rounded-2xl bg-white p-4 text-slate-800 shadow-2xl ring-1 ring-black/5">
      {/* perforation */}
      <div className="pointer-events-none absolute -left-4 top-14 h-8 w-8 rounded-full bg-neutral-100" />
      <div className="pointer-events-none absolute -right-4 top-14 h-8 w-8 rounded-full bg-neutral-100" />
      <div className="mb-2 text-center">
        <div className="text-lg font-bold">{title}</div>
        {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      </div>
      <div className="my-2 border-t border-dashed border-slate-300" />
      <div className="space-y-2 text-sm">
        {lines.map((l, i) => (
          <div key={i} className="flex items-center justify-between">
            <div>{l.left}</div>
            <div className="font-semibold">{l.right}</div>
          </div>
        ))}
      </div>
      <div className="my-2 border-t border-dashed border-slate-300" />
      <div className="flex items-center justify-between text-base">
        <div className="font-medium">{totalLabel}</div>
        <div className="font-extrabold">{total}</div>
      </div>

      {/* confetti-ish sprinkles (CSS only) */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 animate-[pop_800ms_ease-out_infinite] rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              background:
                i % 3 === 0 ? "#22c55e" : i % 3 === 1 ? "#f59e0b" : "#3b82f6",
              animationDelay: `${(i % 8) * 120}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
