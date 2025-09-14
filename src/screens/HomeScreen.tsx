// src/screens/HomeScreen.tsx
import React from "react";
import { TABS, PROFILE_URL, DISPLAY_NAME } from "../constants";
import AccountCard from "../components/AccountCard";
import ActionGrid from "../components/ActionGrid";
import type { Screen } from "../types";

export default function HomeScreen({
  tab,
  setTab,
  setScreen,
}: {
  tab: (typeof TABS)[number];
  setTab: (t: (typeof TABS)[number]) => void;
  setScreen: (s: Screen) => void;
}) {
  // Build an SVG "initials" avatar as a fallback in case Drive blocks or fails
  const initials = DISPLAY_NAME.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
  const FALLBACK =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
         <rect width='100%' height='100%' rx='12' fill='#e5e7eb'/>
         <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle'
               font-family='sans-serif' font-size='28' fill='#475569'>${initials}</text>
       </svg>`
    );

  return (
    <>
      {/* Welcome block */}
      <div className="relative z-10 mt-4 flex items-center gap-3 px-6 text-white">
        <img
          src={PROFILE_URL}
          alt="Profile"
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white/70"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK;
          }}
        />
        <div>
          <div className="text-sm text-white/90">Welcome</div>
          <div className="text-xl font-semibold">{DISPLAY_NAME}</div>
          <button className="text-sm text-blue-100 underline">View Profile</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 mt-3 flex gap-2 px-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "rounded-full px-4 py-2 text-sm font-medium transition " +
              (tab === t
                ? "bg-white text-blue-700 shadow"
                : "bg-white/10 text-white hover:bg-white/20")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* Account card */}
      <main className="relative z-10 mt-2 px-6">
        <AccountCard />
      </main>

      {/* Action grid (yellow panel) */}
      <ActionGrid setScreen={setScreen} />
    </>
  );
}
