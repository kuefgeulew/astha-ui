import React from "react";
import { QrCode } from "lucide-react";

export default function FloatingQRButton({ hidden = false }: { hidden?: boolean }) {
  if (hidden) return null;

  return (
    <button
      onClick={() => { location.hash = "#qrpay"; }}
      aria-label="Scan & Pay (QR)"
      className="fixed bottom-24 right-5 z-[60] grid h-12 w-12 place-items-center rounded-full bg-white text-slate-800 shadow-xl ring-1 ring-black/10 hover:shadow-2xl active:scale-95 transition"
    >
      <QrCode className="h-6 w-6" />
      <span className="sr-only">Open QR Pay</span>
    </button>
  );
}
