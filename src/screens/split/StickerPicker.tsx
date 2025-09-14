// src/screens/split/StickerPicker.tsx
import React from "react";

const STICKERS = ["Paid 💸", "Thanks 🙏", "Teamwork 🤝", "Party 🎉", "Done ✅", "Win 🏆"];

export default function StickerPicker({
  onPick,
}: {
  onPick: (s: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {STICKERS.map(s => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
