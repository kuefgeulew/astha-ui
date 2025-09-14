import React, { useEffect, useRef, useState } from "react";
import { streamChat, type ChatMsg } from "../services/useChatStream";

type Props = { onClose: () => void };

export default function ChatbotOverlay({ onClose }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! I’m your Astha Assistant. How can I help today?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      let acc = "";
      for await (const token of streamChat(next)) {
        acc += token;
        setMessages([...next, { role: "assistant", content: acc }]);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I couldn’t reach the chat server." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Panel */}
      <div className="relative z-10 flex h-[90vh] w-[min(900px,95vw)] flex-col rounded-2xl bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-800">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white grid place-items-center font-semibold">A</div>
            <h2 className="text-base font-semibold">Astha Assistant</h2>
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800">Close</button>
        </header>

        <main className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl p-3 text-sm leading-relaxed shadow
                ${m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-none"}`}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </main>

        <div className="border-t border-neutral-200 dark:border-neutral-800 p-3">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button
              onClick={send}
              disabled={busy}
              className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
              {busy ? "Sending…" : "Send"}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Tip: In dev, `/api` is proxied to your chatbot server. Or set <code>VITE_CHAT_API_URL</code> for a deployed server.
          </p>
        </div>
      </div>
    </div>
  );
}
