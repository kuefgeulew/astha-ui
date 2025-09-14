// src/screens/budget/Sparkline.tsx
import React from "react";
export default function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-0.5 h-10">
      {values.map((v, i) => (
        <div key={i} className="w-1 rounded bg-blue-500/80" style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  );
}
