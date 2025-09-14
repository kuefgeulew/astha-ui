// src/components/FloatingSplitButton.tsx
import React from "react";
import { SplitSquareVertical } from "lucide-react";

export default function FloatingSplitButton({ hidden = false }: { hidden?: boolean }) {
  if (hidden) return null;
  return (
    <button
      onClick={() => (location.hash = "#split")}
      className="fixed bottom-28 right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-blue-600 text-white shadow-xl hover:bg-blue-700"
      aria-label="Split / Request money"
      title="Split / Request money"
    >
      <SplitSquareVertical className="h-6 w-6" />
    </button>
  );
}
