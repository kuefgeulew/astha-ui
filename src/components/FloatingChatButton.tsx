import React from "react";
import { MessageCircle } from "lucide-react";

export default function FloatingChatButton({ hidden = false }: { hidden?: boolean }) {
  if (hidden) return null;
  return (
    <button
      onClick={() => { location.hash = "#chatbot"; }}
      aria-label="Open Chatbot"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-xl bg-blue-600 hover:brightness-110 active:scale-95 transition-all"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="sr-only sm:not-sr-only sm:block">Chat</span>
    </button>
  );
}
