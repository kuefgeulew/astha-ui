// src/screens/profile/ProfileQROverlay.tsx
import React, { useEffect, useMemo, useState } from "react";
import { X, BadgeCheck, Clock } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

const USER_ID = "nazia325";
const QR_LIFETIME_MS = 2 * 60 * 1000; // 2 minutes

type Account = { id: string; name: string };

const MOCK_ACCOUNTS: Account[] = [
  { id: "savings_staff", name: "Savings (Staff)" },
  { id: "current_001", name: "Current Account" },
  { id: "dps_2025", name: "DPS Plan 2025" },
];

export default function ProfileQROverlay({ onClose }: { onClose: () => void }) {
  const [linkedAcct, setLinkedAcct] = useState<Account>(MOCK_ACCOUNTS[0]);

  // OTP flow
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [verified, setVerified] = useState(true); // default true for first account

  // QR lifecycle
  const [expiryAt, setExpiryAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [qrNonce, setQrNonce] = useState<string>(() => Math.random().toString(36).slice(2, 10));

  // Kick off a QR window on first mount for the default verified account
  useEffect(() => {
    if (verified && expiryAt == null) {
      setExpiryAt(Date.now() + QR_LIFETIME_MS);
    }
  }, [verified, expiryAt]);

  // Ticker for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Reset verification when account changes; send OTP
  const sendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpCode(code);
    setOtpSent(true);
    setOtpInput("");
    setVerified(false);
    setExpiryAt(null); // stop showing QR until verified
    alert("Mock OTP sent: " + code); // replace with actual SMS/Email in real app
  };

  const onChangeAccount = (id: string) => {
    const acct = MOCK_ACCOUNTS.find((a) => a.id === id)!;
    setLinkedAcct(acct);
    sendOtp(); // require OTP again on account change
  };

  const verifyOtp = () => {
    if (otpInput === otpCode) {
      setVerified(true);
      setOtpSent(false);
      setOtpCode("");
      // Issue a fresh QR window and rotate nonce
      setQrNonce(Math.random().toString(36).slice(2, 10));
      setExpiryAt(Date.now() + QR_LIFETIME_MS);
      alert("OTP Verified! Linked account updated.");
    } else {
      alert("Incorrect OTP, try again.");
    }
  };

  // Countdown derivations
  const msLeft = useMemo(() => {
    if (!expiryAt) return 0;
    return Math.max(0, expiryAt - now);
  }, [expiryAt, now]);

  const expired = verified && expiryAt !== null && msLeft <= 0;

  const mm = String(Math.floor(msLeft / 1000 / 60)).padStart(2, "0");
  const ss = String(Math.floor((msLeft / 1000) % 60)).padStart(2, "0");

  // Regenerate within same account (no OTP) -> new nonce + timer
  const regenerate = () => {
    if (!verified) return;
    setQrNonce(Math.random().toString(36).slice(2, 10));
    setExpiryAt(Date.now() + QR_LIFETIME_MS);
  };

  // Deep link encoded in QR
  const qrValue = `astha://link/${USER_ID}?acct=${linkedAcct.id}&t=${qrNonce}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-[380px] max-w-full rounded-2xl bg-white p-6 shadow-xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <div className="text-lg font-semibold">Profile QR</div>
          <BadgeCheck className="h-5 w-5 text-blue-600" title="Verified user" />
        </div>

        {/* Permanent ID */}
        <div className="mb-2 text-sm text-slate-500">Permanent ID</div>
        <div className="mb-3 font-mono text-lg font-bold">{USER_ID}</div>

        {/* QR block */}
        <div className="mb-3">
          {verified ? (
            <div className="relative mx-auto w-fit rounded-lg border border-slate-200 p-3 shadow">
              {/* QR or expired overlay */}
              <div className={expired ? "blur-[2px] opacity-60" : ""}>
                <QRCodeCanvas value={qrValue} size={188} includeMargin={true} />
              </div>

              {/* Countdown ribbon */}
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-600">
                <Clock className="h-4 w-4" />
                {!expired ? (
                  <span>QR expires in <b>{mm}:{ss}</b></span>
                ) : (
                  <span className="text-rose-600">QR expired</span>
                )}
              </div>

              {/* Expired badge + regenerate button */}
              {expired && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-rose-600 ring-1 ring-rose-300">
                    Expired
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto w-fit rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              Verify OTP to generate QR for the selected account.
            </div>
          )}
        </div>

        {/* Linked Account */}
        <label className="mb-1 block text-sm text-slate-600">Linked Account</label>
        <select
          value={linkedAcct.id}
          onChange={(e) => onChangeAccount(e.target.value)}
          className="mb-3 w-full rounded-lg border px-3 py-2"
        >
          {MOCK_ACCOUNTS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* OTP area */}
        {otpSent && !verified && (
          <div className="mb-3">
            <label className="mb-1 block text-sm text-slate-600">Enter OTP</label>
            <input
              type="text"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              className="mb-2 w-full rounded-lg border px-3 py-2"
              placeholder="6-digit OTP"
            />
            <button
              onClick={verifyOtp}
              className="w-full rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700"
            >
              Verify
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Public link:{" "}
            <span className="font-mono text-blue-600">astha://link/{USER_ID}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                const link = `astha://link/${USER_ID}`;
                navigator.clipboard.writeText(link);
                alert("Copied: " + link);
              }}
              className="rounded-lg border px-3 py-1 text-sm"
            >
              Copy link
            </button>
            <button
              onClick={regenerate}
              disabled={!verified}
              className={`rounded-lg px-3 py-1 text-sm text-white ${
                verified ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-400"
              }`}
              title={verified ? "Generate a fresh QR (2 min)" : "Verify OTP first"}
            >
              Regenerate QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
