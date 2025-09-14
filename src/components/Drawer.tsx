// src/components/Drawer.tsx
import React, { useEffect, useRef } from "react";
import {
  Users,
  ListChecks,
  CreditCard as CreditCardIcon,
  FileText,
  Settings,
} from "lucide-react";
import { PROFILE_URL, DISPLAY_NAME } from "../constants";

export default function Drawer({
  open,
  onClose,
  lastLogin,
  lastFailure,
}: {
  open: boolean;
  onClose: () => void;
  lastLogin: string;
  lastFailure?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Accessibility + UX: focus entry, ESC to close, lock body scroll
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  // SVG initials fallback if the Drive image fails
  const initials = DISPLAY_NAME.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
  const FALLBACK =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>
         <rect width='100%' height='100%' rx='16' fill='#e5e7eb'/>
         <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle'
               font-family='sans-serif' font-size='34' fill='#475569'>${initials}</text>
       </svg>`
    );

  return (
    <div
      className={open ? "fixed inset-0 z-20" : "fixed inset-0 z-20 pointer-events-none"}
      aria-hidden={!open}
    >
      {/* Scrim */}
      <div
        className={
          "absolute inset-0 bg-black/30 transition-opacity " +
          (open ? "opacity-100" : "opacity-0")
        }
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        className={
          "absolute left-0 top-0 h-full w-72 transform bg-white p-4 shadow-2xl transition-transform dark:bg-slate-900 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center gap-3">
          <img
            src={PROFILE_URL}
            alt="Profile"
            className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500/30"
            referrerPolicy="no-referrer"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK;
            }}
          />
          <div>
            <div className="text-sm text-slate-500">Logged in as</div>
            <div className="text-base font-semibold">{DISPLAY_NAME}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-800 dark:text-slate-200">
          <div>
            <span className="text-slate-500">Last login: </span>
            <span className="font-medium">{lastLogin}</span>
          </div>
          {lastFailure && (
            <div className="mt-1">
              <span className="text-slate-500">Last failure: </span>
              <span className="font-medium">{lastFailure}</span>
            </div>
          )}
        </div>

        <nav className="mt-3 space-y-1 text-sm">
          <button className="flex w-full items-center gap-2 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Users className="h-4 w-4" /> Profile & Preferences
          </button>
          <button className="flex w-full items-center gap-2 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <ListChecks className="h-4 w-4" /> Security Checklist
          </button>
          <button className="flex w-full items-center gap-2 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <CreditCardIcon className="h-4 w-4" /> Cards
          </button>
          <button className="flex w-full items-center gap-2 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <FileText className="h-4 w-4" /> Statements
          </button>
          <button className="flex w-full items-center gap-2 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Settings className="h-4 w-4" /> Settings
          </button>
        </nav>
      </aside>
    </div>
  );
}
