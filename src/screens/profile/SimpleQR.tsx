import React from "react";

/**
 * Tiny deterministic "QR-like" block pattern (NOT a real QR spec).
 * Good enough for demo UI. Encodes string -> grid based on a hash.
 */
export default function SimpleQR({ value, size = 240 }: { value: string; size?: number }) {
  const rows = 21;
  const cols = 21;

  // simple string hash
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  const bits: number[] = [];
  for (let i = 0; i < rows * cols; i++) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5; // xorshift-ish
    bits.push((h >>> 0) & 1);
  }

  const cell = size / rows;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg ring-1 ring-black/10 bg-white">
      <rect x={0} y={0} width={size} height={size} fill="white" />
      {bits.map((b, i) => {
        if (!b) return null;
        const r = Math.floor(i / cols);
        const c = i % cols;
        return <rect key={i} x={c * cell} y={r * cell} width={cell} height={cell} fill="#0f172a" />;
      })}
    </svg>
  );
}
