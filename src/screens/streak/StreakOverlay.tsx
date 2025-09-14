// src/screens/streak/StreakOverlay.tsx
import React from "react";
import StreakScreen from "./StreakScreen";

type Props = { onClose: () => void };

export default function StreakOverlay({ onClose }: Props) {
  // Close on ESC
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Astha Streak"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative z-10 mx-auto mt-[4vh] h-[92vh] w-[min(1100px,96vw)] overflow-auto rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Let the inner screen handle its own header & background */}
        <StreakScreen onBack={onClose} />
      </div>
    </div>
  );
}
