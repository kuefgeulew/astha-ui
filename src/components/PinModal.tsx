import React from "react";

export default function PinModal({
  open, onClose, onVerify
}: { open: boolean; onClose: () => void; onVerify: (pin: string) => void }) {
  const [pin, setPin] = React.useState("");

  React.useEffect(() => { if (!open) setPin(""); }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-[min(420px,95vw)] rounded-2xl bg-white dark:bg-neutral-900 p-5 shadow-xl border border-neutral-200 dark:border-neutral-800">
        <h3 className="text-lg font-semibold mb-4">Verification</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">Enter Card PIN</p>
        <div className="flex gap-2 mb-4">
          <input
            inputMode="numeric" maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-3 tracking-[0.5em] text-center text-lg"
            placeholder="••••"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-4 py-2 border border-neutral-300 dark:border-neutral-700">Cancel</button>
          <button
            onClick={() => onVerify(pin)}
            className="rounded-lg px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
            disabled={pin.length !== 4}
          >
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
