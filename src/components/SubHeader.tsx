import React from "react";

export default function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="relative z-10 flex items-center justify-between px-4 pt-4 text-white">
      <button onClick={onBack} className="rounded-full px-3 py-1 hover:bg-white/10">&lt; Back</button>
      <div className="text-[17px] font-medium">{title}</div>
      <div className="w-14" />
    </div>
  );
}
