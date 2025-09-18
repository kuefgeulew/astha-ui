import React, { useEffect, useState } from "react";
import Astha from "./Astha";

import ChatbotOverlay from "./screens/ChatbotOverlay";
import QRPayOverlay from "./screens/qr/QRPayOverlay";
import StreakOverlay from "./screens/streak/StreakOverlay";
import SaltamamiOverlay from "./screens/summary/SaltamamiOverlay";


// Split/Request money
import SplitRequestOverlay from "./screens/split/SplitRequestOverlay";

// Budgets
import BudgetOverlay from "./screens/budget/BudgetOverlay";

// Profile QR & Permanent ID
import ProfileQROverlay from "./screens/profile/ProfileQROverlay";

// Offers (For You + Geo + Filters)
import OffersOverlay from "./screens/offers/OffersOverlay";

// ✅ NEW: Calculator overlay
import FabSavingsCalculatorsOverlay from "./screens/calc/FabSavingsCalculatorsOverlay";

// ✅ NEW (Step 2): Voice Assistant overlay
import VoiceAssistantOverlay from "./screens/voice/VoiceAssistantOverlay";

/**
 * Minimal wrapper that shows:
 * 1) Splash screen
 * 2) Login screen (accepts any non-empty username & password)
 * 3) Astha app + overlays via URL hash
 */

type Stage = "splash" | "login" | "app";

export default function App() {
  // overlay visibility via URL hash
  const [showChat, setShowChat] = React.useState(false);
  const [showQr, setShowQr] = React.useState(false);
  const [showStreak, setShowStreak] = React.useState(false);
  const [showSplit, setShowSplit] = React.useState(false);
  const [showBudget, setShowBudget] = React.useState(false);
  const [showProfileQR, setShowProfileQR] = React.useState(false);
  const [showOffers, setShowOffers] = React.useState(false); // 👈 NEW
  const [showSummary, setShowSummary] = React.useState(false);

  // ✅ NEW:
  const [showCalc, setShowCalc] = React.useState(false);
  // ✅ NEW (Step 2):
  const [showVoice, setShowVoice] = React.useState(false);

  React.useEffect(() => {
    const sync = () => {
      const h = (location.hash || "").toLowerCase();
      setShowChat(h === "#chatbot");
      setShowQr(h === "#qrpay");
      setShowStreak(h === "#streak");
      setShowSplit(h === "#split");
      setShowBudget(h === "#budget");
      setShowProfileQR(h === "#profileqr");
      setShowOffers(h === "#offers"); // 👈 NEW
      // ✅ NEW:
      setShowCalc(h === "#calc");
      setShowSummary(h === "#summary");

      // ✅ NEW (Step 2):
      setShowVoice(h === "#voice");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const [stage, setStage] = useState<Stage>(() =>
    localStorage.getItem("astha_stage") === "app" ? "app" : "splash"
  );

  useEffect(() => {
    if (stage === "splash") {
      const t = setTimeout(() => setStage("login"), 1500);
      return () => clearTimeout(t);
    }
  }, [stage]);

  if (stage === "splash") return <SplashScreen />;

  if (stage === "login")
    return (
      <LoginScreen
        onSuccess={() => {
          localStorage.setItem("astha_authed", "1");
          localStorage.setItem("astha_stage", "app");
          setStage("app");
        }}
      />
    );

  // stage === "app"
  const clearHash = () => history.replaceState(null, "", location.pathname);

  return (
    <>
      <Astha />

      {showChat && (
        <ChatbotOverlay
          onClose={() => {
            clearHash();
            setShowChat(false);
          }}
        />
      )}

      {showQr && (
        <QRPayOverlay
          onClose={() => {
            clearHash();
            setShowQr(false);
          }}
        />
      )}

      {showStreak && (
        <StreakOverlay
          onClose={() => {
            clearHash();
            setShowStreak(false);
          }}
        />
      )}

      {showSplit && (
        <SplitRequestOverlay
          onClose={() => {
            clearHash();
            setShowSplit(false);
          }}
        />
      )}

      {/* Budgets */}
      {showBudget && (
        <BudgetOverlay
          onClose={() => {
            clearHash();
            setShowBudget(false);
          }}
        />
      )}

      {/* Profile QR & Permanent ID */}
      {showProfileQR && (
        <ProfileQROverlay
          onClose={() => {
            clearHash();
            setShowProfileQR(false);
          }}
        />
      )}

      {/* Offers Overlay (For You + Geo + Filters) */}
      {showOffers && (
        <OffersOverlay
          onClose={() => {
            clearHash();
            setShowOffers(false);
          }}
        />
      )}

      {/* ✅ NEW: Calculator Overlay */}
      {showCalc && (
        <FabSavingsCalculatorsOverlay
          onClose={() => {
            clearHash();
            setShowCalc(false);
          }}
        />
      )}

      {showSummary && (
  <SaltamamiOverlay
    onClose={() => {
      clearHash();
      setShowSummary(false);
    }}
  />
)}

      {/* ✅ NEW (Step 2): Voice Assistant Overlay */}
      {showVoice && (
        <VoiceAssistantOverlay
          defaultProvider="retell"
          onClose={() => {
            clearHash();
            setShowVoice(false);
          }}
        />
      )}
    </>
  );
}

/* ---------------------------- Splash Screen ---------------------------- */

function SplashScreen() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-800">
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center overflow-hidden">
        {/* light decorative lines (subtle) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 bottom-10 h-72 w-72 rotate-[-35deg] rounded-3xl border-2 border-red-200/60" />
          <div className="absolute left-10 bottom-24 h-40 w-40 rotate-[15deg] rounded-2xl border-2 border-blue-200/60" />
          <div className="absolute right-8 top-24 h-44 w-44 rotate-[30deg] rounded-2xl border-2 border-green-200/60" />
          <div className="absolute right-[-30px] bottom-6 h-20 w-20 rotate-[35deg] rounded-xl border-2 border-amber-200/60" />
        </div>

        {/* logo mark (clean, offline) */}
        <div className="mb-6 grid h-32 w-32 place-items-center rounded-3xl bg-[#1160AE] shadow-lg">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-yellow-400 to-yellow-500" />
            <div className="absolute left-0 top-0 h-full w-[58%] rounded-sm bg-[#1160AE]" />
            <div className="absolute right-1 top-1 h-6 w-6 rounded-full bg-white/60 blur-[1px]" />
          </div>
        </div>

        <div className="text-2xl font-semibold tracking-wide text-[#1160AE]">
          BRAC BANK PLC
        </div>
        <div className="mt-1 text-sm text-slate-500">Bank Smart</div>
      </div>
    </div>
  );
}

/* ----------------------------- Login Screen ---------------------------- */

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const canLogin = u.trim().length > 0 && p.trim().length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (canLogin) onSuccess();
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="relative mx-auto max-w-lg">
        {/* top logo & language */}
        <div className="flex items-center justify-center pt-10">
          <div className="grid h-24 w-24 place-items-center rounded-3xl bg-[#1160AE] shadow">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-yellow-400 to-yellow-500" />
              <div className="absolute left-0 top-0 h-full w-[58%] rounded-sm bg-[#1160AE]" />
              <div className="absolute right-0 top-0 h-4 w-4 rounded-full bg-white/60 blur-[1px]" />
            </div>
          </div>
        </div>

        <div className="mt-3 text-center text-[#1160AE]">Bank Smart</div>
        <div className="mt-1 text-center text-xs text-slate-400">vP7.7</div>

        <div className="absolute right-4 top-4">
          <button className="rounded-full bg-slate-100 px-4 py-2 text-sm">
            বাংলা
          </button>
        </div>

        {/* Login card */}
        <form
          onSubmit={submit}
          className="mx-4 mt-6 rounded-3xl bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
        >
          <div className="mb-4 text-center">
            <div className="text-sm text-slate-500">Login to</div>
            <div className="text-2xl font-bold text-slate-800">BRAC Bank Astha</div>
          </div>

          <label className="mt-2 block text-sm text-slate-600">Username</label>
          <div className="mt-1 flex items-center justify-between">
            <input
              value={u}
              onChange={(e) => setU(e.target.value)}
              placeholder="Enter Username"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
            />
            <a
              className="ml-3 whitespace-nowrap text-sm text-blue-600"
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              Forgot Username?
            </a>
          </div>

          <label className="mt-4 block text-sm text-slate-600">Password</label>
          <div className="mt-1 flex items-center justify-between">
            <input
              value={p}
              onChange={(e) => setP(e.target.value)}
              placeholder="Enter Password"
              type="password"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
            />
            <a
              className="ml-3 whitespace-nowrap text-sm text-blue-600"
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={!canLogin}
            className={`mt-5 w-full rounded-2xl px-4 py-3 font-medium text-white ${
              canLogin ? "bg-[#0B63B6] hover:bg-[#09579f]" : "cursor-not-allowed bg-slate-300"
            }`}
          >
            LOGIN
          </button>
        </form>

        {/* Bottom quick actions (static visual) */}
        <div className="mx-4 mt-6 grid grid-cols-3 gap-4">
          {[
            { title: "Sign up for Astha" },
            { title: "Open a Bank Account" },
            { title: "Apply for Cards/Loans" },
          ].map((x) => (
            <div
              key={x.title}
              className="grid place-items-center rounded-2xl bg-white p-4 text-center text-sm text-slate-700 shadow"
            >
              {x.title}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-t-[28px] bg-amber-400 p-5 text-center text-slate-900">
          <div className="grid grid-cols-3 gap-3 text-sm font-medium">
            <div>
              <div>ATM/Branch</div>
              <div>Near Me</div>
            </div>
            <div>
              <div>Offers</div>
              <div>Near Me</div>
            </div>
            <div>
              <div>Contact us</div>
            </div>
          </div>
        </div>

        {/* Safe area spacer */}
        <div className="h-6" />
      </div>
    </div>
  );
}
