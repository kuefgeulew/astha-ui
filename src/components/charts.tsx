// src/components/charts.tsx
import React from "react";

/** Tiny line chart without axes. Auto-colors up/down based on last vs previous. */
export function Sparkline({
  values,
  height = 60,
  width = 340,
  strokeUp = "#10b981",   // emerald-500
  strokeDown = "#ef4444", // red-500
  strokeWidth = 2,
}: {
  values: number[];
  height?: number;
  width?: number;
  strokeUp?: string;
  strokeDown?: string;
  strokeWidth?: number;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const h = height;
  const w = width;
  const step = w / Math.max(1, values.length - 1);
  const norm = (v: number) => (max === min ? h / 2 : h - ((v - min) / (max - min)) * h);
  const points = values.map((v, i) => `${i * step},${norm(v).toFixed(2)}`).join(" ");
  const last = values[values.length - 1];
  const prev = values[values.length - 2] ?? last;
  const up = last >= prev;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" height={h} aria-label="sparkline">
      <polyline
        fill="none"
        stroke={up ? strokeUp : strokeDown}
        strokeWidth={strokeWidth}
        points={points}
      />
    </svg>
  );
}

/** Simple column chart without axes (just bars + x labels). */
export function BarChart({
  values,
  labels,
  height = 120,
  color = "#2563eb", // blue-600
}: {
  values: number[];
  labels: string[];
  height?: number;
  color?: string;
}) {
  const max = Math.max(...values) || 1;
  return (
    <div className="grid h-[120px] grid-cols-12 items-end gap-2" aria-label="bar-chart">
      {values.map((v, i) => (
        <div key={i} className="col-span-3 flex flex-col items-center">
          <div className="w-10 rounded-t-md" style={{ height: `${(v / max) * 100}%`, background: color }} />
          <div className="mt-1 text-xs text-slate-500">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

/** Column chart with X/Y axes, grid lines, and currency/unit labels. */
export function BarChartXY({
  values,
  labels,
  height = 160,
  width = 340,
  color = "#2563eb", // blue-600
  yTicks = 5,
  unit = "$",
}: {
  values: number[];
  labels: string[];
  height?: number;
  width?: number;
  color?: string;
  yTicks?: number;
  unit?: string;
}) {
  const maxVal = Math.max(...values, 1);
  const padding = { top: 10, right: 8, bottom: 26, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const barW = innerW / values.length - 8;
  const x = (i: number) => padding.left + i * (barW + 8);
  const y = (v: number) => padding.top + innerH - (v / maxVal) * innerH;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal / yTicks) * i));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" height={height} aria-label="bar-chart-xy">
      {/* grid lines */}
      {ticks.map((t, i) => (
        <line key={i} x1={padding.left} x2={width - padding.right} y1={y(t)} y2={y(t)} stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {/* axes */}
      <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} stroke="#94a3b8" />
      <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} stroke="#94a3b8" />
      {/* y labels */}
      {ticks.map((t, i) => (
        <text
          key={i}
          x={padding.left - 6}
          y={y(t)}
          textAnchor="end"
          alignmentBaseline="middle"
          fontSize="10"
          fill="#475569"
        >
          {unit}{t}
        </text>
      ))}
      {/* bars + x labels */}
      {values.map((v, i) => (
        <g key={i}>
          <rect x={x(i)} y={y(v)} width={barW} height={Math.max(2, height - padding.bottom - y(v))} rx={4} fill={color} />
          <text x={x(i) + barW / 2} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Default export (so you can also do: import Charts from "../components/charts") */
export default {
  Sparkline,
  BarChart,
  BarChartXY,
};
