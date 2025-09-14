// src/screens/theme/ThemeOverlay.tsx
import React, { useEffect, useMemo, useState } from "react";
import { X, Check, Wand2 } from "lucide-react";

/** Storage contract — keep the same key your app uses */
const THEME_LS_KEY = "astha_theme_v1";

type ThemeLS = {
  /** Primary brand tint used across the chrome */
  primary: string;
  /** solid cards vs glassy cards */
  surface: "solid" | "glass";
  /** density options (Astha currently reads compact/comfortable; spacious falls back to comfortable) */
  density: "compact" | "comfortable" | "spacious";
  /** card radius */
  radius: "md" | "xl" | "2xl";
  /** wallpaper tone */
  wallpaper: "none" | "blue" | "sunset" | "emerald" | "charcoal" | "royal" | "aqua" | "rose" | "slate";
  /** NEW: gradient for the Action panel (Shortcuts card) */
  actionPanel: { from: string; to: string; linkedToPrimary?: boolean };
  /** Optional theme pack (pop culture etc.) */
  pack?: string | null;
};

const DEFAULT: ThemeLS = {
  primary: "#0B63B6",
  surface: "glass",
  density: "comfortable",
  radius: "2xl",
  wallpaper: "blue",
  actionPanel: { from: "#F6C34C", to: "#EA9E0C", linkedToPrimary: false },
  pack: null,
};

function loadTheme(): ThemeLS {
  try {
    const raw = localStorage.getItem(THEME_LS_KEY);
    if (!raw) return DEFAULT;
    const t = JSON.parse(raw);
    // backfill any missing fields for older saves
    return {
      ...DEFAULT,
      ...t,
      actionPanel: { ...DEFAULT.actionPanel, ...(t?.actionPanel ?? {}) },
    };
  } catch {
    return DEFAULT;
  }
}
function saveTheme(t: ThemeLS) {
  localStorage.setItem(THEME_LS_KEY, JSON.stringify(t));
}

/* -------------------------- Presets & Packs -------------------------- */

const COLOR_PRESETS: { label: string; dot: string; primary: string }[] = [
  { label: "BRAC Blue", dot: "#0B63B6", primary: "#0B63B6" },
  { label: "Royal Indigo", dot: "#5B3CC4", primary: "#4C35B3" },
  { label: "Emerald", dot: "#10B981", primary: "#0EA371" },
  { label: "Sunset", dot: "#F59E0B", primary: "#EA8605" },
  { label: "Rose", dot: "#E11D48", primary: "#DC1843" },
  { label: "Slate", dot: "#334155", primary: "#2B3646" },
  { label: "Aqua", dot: "#0EA5E9", primary: "#0A94D0" },
];

const WALLPAPERS: { key: ThemeLS["wallpaper"]; label: string; gradient: string }[] = [
  { key: "blue", label: "Blue", gradient: "linear-gradient(180deg,#0B63B6 0%,#0A4F90 100%)" },
  { key: "sunset", label: "Sunset", gradient: "linear-gradient(180deg,#F59E0B 0%,#EA580C 60%,#7C2D12 100%)" },
  { key: "emerald", label: "Emerald", gradient: "linear-gradient(180deg,#10B981 0%,#059669 60%,#064E3B 100%)" },
  { key: "charcoal", label: "Charcoal", gradient: "linear-gradient(180deg,#1F2937 0%,#111827 100%)" },
  { key: "royal", label: "Royal", gradient: "linear-gradient(180deg,#4C35B3 0%,#2A186F 100%)" },
  { key: "aqua", label: "Aqua", gradient: "linear-gradient(180deg,#0EA5E9 0%,#0369A1 100%)" },
  { key: "rose", label: "Rose", gradient: "linear-gradient(180deg,#E11D48 0%,#9F1239 100%)" },
  { key: "slate", label: "Slate", gradient: "linear-gradient(180deg,#475569 0%,#0F172A 100%)" },
];

const ACTION_GRADIENT_PRESETS: { name: string; from: string; to: string }[] = [
  { name: "Amber", from: "#F6C34C", to: "#E59E0A" },
  { name: "Royal", from: "#2C68D8", to: "#0B63B6" },
  { name: "Emerald", from: "#10B981", to: "#059669" },
  { name: "Rose", from: "#F472B6", to: "#E11D48" },
  { name: "Steel", from: "#7C8AA5", to: "#5B6B84" },
  { name: "Charcoal", from: "#3B3B3B", to: "#222" },
];

/** Fun packs (pop culture). Each pack overrides primary, wallpaper, action gradient. */
const POP_PACKS: {
  id: string;
  label: string;
  badge?: string;
  primary: string;
  wallpaper: ThemeLS["wallpaper"];
  actionPanel: { from: string; to: string };
}[] = [
  { id: "bond", label: "007 – Bond Blue", badge: "NEW", primary: "#003A66", wallpaper: "charcoal", actionPanel: { from: "#D4AF37", to: "#8C7851" } },
  { id: "gotham", label: "Gotham (Batman)", primary: "#111827", wallpaper: "slate", actionPanel: { from: "#F59E0B", to: "#B45309" } },
  { id: "jedi", label: "Jedi (Star Wars)", primary: "#0EA5E9", wallpaper: "aqua", actionPanel: { from: "#FACC15", to: "#F59E0B" } },
  { id: "barbie", label: "Barbie Pink", primary: "#E11D48", wallpaper: "rose", actionPanel: { from: "#FDA4AF", to: "#FB7185" } },
  { id: "wakanda", label: "Wakanda", primary: "#6D28D9", wallpaper: "royal", actionPanel: { from: "#F59E0B", to: "#6D28D9" } },
  { id: "onepiece", label: "One Piece", primary: "#0EA5E9", wallpaper: "aqua", actionPanel: { from: "#FBBF24", to: "#0EA5E9" } },
];

/* ------------------------------ UI helpers ------------------------------ */

function Swatch({
  active,
  onClick,
  children,
  className = "",
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative h-16 w-full rounded-2xl border text-left shadow-sm transition focus:outline-none ${active ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200 hover:border-slate-300"} ${className}`}
    >
      {active && <Check className="absolute right-2 top-2 h-4 w-4 text-blue-600" />}
      {children}
    </button>
  );
}

function CircleDot({ color }: { color: string }) {
  return <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />;
}

/* --------------------------------- Page --------------------------------- */

export default function ThemeOverlay({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState<ThemeLS>(() => loadTheme());

  // link action panel to primary color if requested
  useEffect(() => {
    if (draft.actionPanel.linkedToPrimary) {
      setDraft((d) => ({
        ...d,
        actionPanel: { ...d.actionPanel, from: lighten(d.primary, 0.12), to: d.primary },
      }));
    }
  }, [draft.primary, draft.actionPanel.linkedToPrimary]);

  const previewGradient = useMemo(() => {
    const wp = WALLPAPERS.find((w) => w.key === draft.wallpaper)?.gradient;
    return wp || `linear-gradient(180deg, ${draft.primary} 0%, #0A4F90 100%)`;
  }, [draft]);

  function applyPack(id: string) {
    const p = POP_PACKS.find((x) => x.id === id)!;
    setDraft((d) => ({
      ...d,
      primary: p.primary,
      wallpaper: p.wallpaper,
      actionPanel: { ...d.actionPanel, ...p.actionPanel, linkedToPrimary: false },
      pack: id,
    }));
  }

  function apply() {
    saveTheme(draft);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-[71] mx-auto mt-[3vh] h-[94vh] w-[min(1200px,96vw)] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-600" />
            <div className="text-base font-semibold">Theme Customizer</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              onClick={apply}
            >
              Apply
            </button>
            <button aria-label="Close" className="rounded-full p-2 hover:bg-slate-100" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="grid h-[calc(94vh-52px)] grid-cols-1 gap-0 md:grid-cols-[1.1fr_0.9fr]">
          {/* LEFT: Controls */}
          <div className="overflow-auto px-5 py-5">
            {/* App Color Presets */}
            <section className="mb-6">
              <div className="mb-2 text-[13px] font-semibold text-slate-700">App Color Presets</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {COLOR_PRESETS.map((p) => (
                  <Swatch
                    key={p.label}
                    active={draft.primary.toLowerCase() === p.primary.toLowerCase()}
                    onClick={() => setDraft({ ...draft, primary: p.primary, pack: null })}
                  >
                    <div className="flex h-full items-center gap-2 px-3">
                      <CircleDot color={p.dot} />
                      <div className="text-sm">{p.label}</div>
                    </div>
                  </Swatch>
                ))}
              </div>
            </section>

            {/* Pop Culture Packs */}
            <section className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <div className="text-[13px] font-semibold text-slate-700">Fan Packs</div>
                <span className="rounded-full bg-amber-100 px-2 py-[2px] text-[10px] font-medium text-amber-700">
                  Gen-Z
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {POP_PACKS.map((p) => (
                  <Swatch key={p.id} active={draft.pack === p.id} onClick={() => applyPack(p.id)}>
                    <div
                      className="h-full w-full rounded-2xl"
                      style={{
                        background:
                          p.id === "bond"
                            ? "linear-gradient(135deg,#0f172a 0%,#1f2937 40%,#111827 60%)"
                            : undefined,
                      }}
                    >
                      <div className="p-3 text-sm text-slate-800">
                        <div className="font-medium">{p.label}</div>
                        <div className="mt-2 text-[11px] text-slate-500">Wallpaper: {p.wallpaper}</div>
                      </div>
                    </div>
                  </Swatch>
                ))}
              </div>
            </section>

            {/* Wallpapers */}
            <section className="mb-6">
              <div className="mb-2 text-[13px] font-semibold text-slate-700">Wallpapers</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {WALLPAPERS.map((w) => (
                  <Swatch
                    key={w.key}
                    active={draft.wallpaper === w.key}
                    onClick={() => setDraft({ ...draft, wallpaper: w.key, pack: draft.pack })}
                  >
                    <div className="h-full w-full rounded-2xl" style={{ background: w.gradient }} />
                    <div className="absolute bottom-2 left-2 rounded bg-white/80 px-2 py-[2px] text-[11px] text-slate-700">
                      {w.label}
                    </div>
                  </Swatch>
                ))}
              </div>
            </section>

            {/* Action panel color (Shortcuts card) */}
            <section className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[13px] font-semibold text-slate-700">Action panel color (Shortcuts)</div>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={!!draft.actionPanel.linkedToPrimary}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        actionPanel: { ...draft.actionPanel, linkedToPrimary: e.target.checked },
                      })
                    }
                  />
                  Link to app color
                </label>
              </div>
              <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {ACTION_GRADIENT_PRESETS.map((g) => (
                  <button
                    key={g.name}
                    onClick={() =>
                      setDraft({ ...draft, actionPanel: { from: g.from, to: g.to, linkedToPrimary: false } })
                    }
                    className={`h-12 rounded-xl ring-1 ring-slate-200`}
                    style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                    title={g.name}
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="flex items-center gap-2">
                  <div className="text-xs w-16 text-slate-600">From</div>
                  <input
                    type="color"
                    value={draft.actionPanel.from}
                    onChange={(e) =>
                      setDraft({ ...draft, actionPanel: { ...draft.actionPanel, from: e.target.value, linkedToPrimary: false } })
                    }
                  />
                  <input
                    value={draft.actionPanel.from}
                    onChange={(e) =>
                      setDraft({ ...draft, actionPanel: { ...draft.actionPanel, from: e.target.value, linkedToPrimary: false } })
                    }
                    className="ml-2 w-28 rounded border px-2 py-1 text-xs"
                  />
                </div>
                <div className="hidden text-center text-xs text-slate-500 sm:block">→</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs w-16 text-slate-600">To</div>
                  <input
                    type="color"
                    value={draft.actionPanel.to}
                    onChange={(e) =>
                      setDraft({ ...draft, actionPanel: { ...draft.actionPanel, to: e.target.value, linkedToPrimary: false } })
                    }
                  />
                  <input
                    value={draft.actionPanel.to}
                    onChange={(e) =>
                      setDraft({ ...draft, actionPanel: { ...draft.actionPanel, to: e.target.value, linkedToPrimary: false } })
                    }
                    className="ml-2 w-28 rounded border px-2 py-1 text-xs"
                  />
                </div>
              </div>
            </section>

            {/* Density */}
            <section className="mb-6">
              <div className="mb-2 text-[13px] font-semibold text-slate-700">Density</div>
              <div className="flex gap-2">
                {(["compact", "comfortable", "spacious"] as ThemeLS["density"][]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDraft({ ...draft, density: d })}
                    className={`rounded-full px-3 py-1 text-sm ${
                      draft.density === d ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {capitalize(d)}
                  </button>
                ))}
              </div>
            </section>

            {/* Corner radius slider */}
            <section className="mb-10">
              <div className="mb-2 text-[13px] font-semibold text-slate-700">Corner Radius</div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={12}
                  max={28}
                  value={radiusToPx(draft.radius)}
                  onChange={(e) => setDraft({ ...draft, radius: pxToRadius(parseInt(e.target.value, 10)) })}
                  className="w-full"
                />
                <div className="w-10 text-right text-sm">{radiusToPx(draft.radius)}px</div>
              </div>
            </section>
          </div>

          {/* RIGHT: Live preview */}
          <div className="border-l bg-slate-50 p-5">
            <div className="text-[13px] font-semibold text-slate-700">Live Preview</div>
            <div className="mt-3 rounded-3xl p-5 shadow-inner" style={{ background: previewGradient }}>
              <div className="rounded-2xl border border-white/30 bg-white/30 p-3 text-white backdrop-blur">
                <div className="mb-2 text-sm opacity-90">Primary color</div>
                <div className="h-2.5 w-full rounded-full" style={{ background: draft.primary }} />
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/30 bg-white/35 px-3 py-3 text-[13px] text-white/95"
                      style={{
                        borderRadius:
                          draft.radius === "md" ? 14 : draft.radius === "xl" ? 20 : 28,
                      }}
                    >
                      {i === 3 ? "Shortcuts" : i === 2 ? "Recent activity" : "Account summary"}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="mt-5 rounded-3xl p-4 shadow-2xl ring-1 ring-black/10"
                style={{
                  background: `linear-gradient(135deg, ${draft.actionPanel.from}, ${draft.actionPanel.to})`,
                }}
              >
                <div className="text-sm text-white/90">Action panel (Shortcuts)</div>
                <div className="mt-2 grid grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-white/90 p-3 text-center text-xs text-slate-800">
                      Icon
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-5 rounded-2xl border bg-white p-3 text-xs text-slate-600">
              Left: App chrome based on <b>Primary</b> & Wallpaper • Right: Shortcuts panel uses the
              <b> Action panel</b> gradient. Click <b>Apply</b> to save.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- helpers ------------------------------- */

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function lighten(hex: string, amt = 0.1) {
  // simple lighten; hex -> rgb -> lighten
  const c = hex.replace("#", "");
  const n = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  const r = Math.min(255, ((n >> 16) & 255) + Math.round(255 * amt));
  const g = Math.min(255, ((n >> 8) & 255) + Math.round(255 * amt));
  const b = Math.min(255, (n & 255) + Math.round(255 * amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
function radiusToPx(r: ThemeLS["radius"]) {
  return r === "md" ? 14 : r === "xl" ? 20 : 28;
}
function pxToRadius(px: number): ThemeLS["radius"] {
  if (px <= 16) return "md";
  if (px <= 24) return "xl";
  return "2xl";
}
