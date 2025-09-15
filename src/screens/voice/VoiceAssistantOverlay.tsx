// src/screens/voice/VoiceAssistantOverlay.tsx
import { RetellWebClient } from "retell-client-js-sdk";
import Vapi from "@vapi-ai/web";
import React from "react";
import { Mic, MicOff, X, Volume2, Activity } from "lucide-react";

// Provider-agnostic interface
type Provider = "retell" | "vapi";

type Props = {
  onClose: () => void;
  defaultProvider?: Provider; // "retell" or "vapi"
};

/* ----------------------------------------------------
   Retell text normalizer (does NOT affect the Vapi path)
   Turns {role, content}, {text}, arrays of blocks, etc.
   into a single plain string for safe rendering.
---------------------------------------------------- */
function retellToText(input: any): string {
  if (!input) return "";
  if (typeof input === "string") return input;

  if (Array.isArray(input)) {
    return input.map(retellToText).filter(Boolean).join(" ");
  }

  if (typeof input === "object") {
    if ("text" in input && typeof (input as any).text === "string") {
      return (input as any).text;
    }
    if ("content" in input) {
      const c = (input as any).content;
      if (typeof c === "string") return c;
      return retellToText(c);
    }
    if ("role" in input && "content" in input) {
      return retellToText((input as any).content);
    }
  }

  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

export default function VoiceAssistantOverlay({ onClose, defaultProvider = "retell" }: Props) {
  const [provider, setProvider] = React.useState<Provider>(defaultProvider);
  const [listening, setListening] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);
  const [partial, setPartial] = React.useState<string>("");
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "assistant", text: string }>>([]);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // keep a reference to current session cleanup
  const teardownRef = React.useRef<null | (() => void)>(null);

  React.useEffect(() => {
    return () => {
      // on unmount, stop any media / sockets
      if (teardownRef.current) teardownRef.current();
    };
  }, []);

  async function start() {
    if (connecting || listening) return;
    setConnecting(true);
    setPartial("");
    try {
      // ask for mic early to surface permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // we'll reopen inside provider
    } catch (e) {
      setConnecting(false);
      alert("Microphone permission is required.");
      return;
    }

    try {
      let teardown: () => void;
      if (provider === "retell") {
        teardown = await startRetell(setPartial, pushMsg, playAudio);
      } else {
        teardown = await startVapi(setPartial, pushMsg, playAudio);
      }
      teardownRef.current = teardown;
      setListening(true);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Failed to start voice session");
    } finally {
      setConnecting(false);
    }
  }

  function pushMsg(role: "user" | "assistant", text: string) {
    setMessages((m) => [...m, { role, text }]);
  }

  function playAudio(src: string | MediaStream) {
    const el = audioRef.current;
    if (!el) return;
    if (src instanceof MediaStream) {
      (el as any).srcObject = src;
    } else {
      el.src = src;
    }
    el.play().catch(() => {/* ignore */});
  }

  function stop() {
    if (teardownRef.current) teardownRef.current();
    teardownRef.current = null;
    setListening(false);
    setPartial("");
  }

  return (
    <div className="fixed inset-0 z-[1000] grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-[1001] w-[min(980px,95vw)] h-[min(85vh,720px)] rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-800">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Voice Assistant</span>
            </div>
            <select
              className="rounded-md border px-2 py-1 text-sm"
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
            >
              <option value="retell">Retell AI</option>
              <option value="vapi">Vapi</option>
            </select>
          </div>
          <button className="rounded-lg border px-3 py-1.5" onClick={onClose}>
            <X className="h-4 w-4 inline -mt-0.5 mr-1" /> Close
          </button>
        </header>

        {/* transcript column */}
        <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100%-56px)]">
          <div className="md:col-span-2 h-full overflow-auto p-4 space-y-3">
            {messages.length === 0 && !partial && (
              <div className="text-sm text-slate-500">No conversation yet. Click “Start” and talk normally.</div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow ${m.role === "user" ? "bg-blue-600 text-white ml-auto" : "bg-slate-100 text-slate-900"}`}
              >
                {m.text}
              </div>
            ))}
            {!!partial && (
              <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-slate-50 text-slate-700 border border-slate-200">
                {partial}
                <span className="animate-pulse">▍</span>
              </div>
            )}
          </div>

          {/* controls column */}
          <div className="border-l p-4 flex flex-col">
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-amber-50 p-4 ring-1 ring-black/5">
              <div className="text-sm font-medium mb-1">Status</div>
              <div className="text-[13px] text-slate-700">
                {connecting ? "Connecting…" : listening ? "Live" : "Idle"}
              </div>
            </div>

            <div className="mt-3 rounded-xl border p-4">
              <div className="text-sm font-medium mb-2">Controls</div>
              {!listening ? (
                <button
                  onClick={start}
                  disabled={connecting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  <Mic className="h-4 w-4" />
                  Start
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-white"
                >
                  <MicOff className="h-4 w-4" />
                  Stop
                </button>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 p-2 text-slate-600">Provider: <b className="text-slate-900">{provider}</b></div>
                <div className="rounded-lg bg-slate-50 p-2 text-slate-600 inline-flex items-center gap-1"><Volume2 className="h-3.5 w-3.5" /> Speaker: Default</div>
              </div>
            </div>

            <audio ref={audioRef} className="mt-3 w-full" controls />
            <p className="mt-2 text-[11px] text-slate-500">
              Your mic audio stays in the browser and is sent only to the selected provider session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Retell via NPM SDK ---
async function startRetell(
  setPartial: (s: string) => void,
  pushMsg: (r: "user" | "assistant", t: string) => void,
  _playAudio: (s: string | MediaStream) => void
) {
  // Ask your server for the short-lived token (we fixed the server to use /v2/create-web-call)
  const resp = await fetch("/v1/voice/retell/token");
  if (!resp.ok) throw new Error("Failed to get Retell token");
  const data = await resp.json();
  const accessToken = data.access_token || data.token;
  if (!accessToken) throw new Error("No access_token in Retell response");

  const client = new RetellWebClient();

  client.on("update", (u: any) => {
    // Normalize partials (could be { transcript } or richer object)
    const t = retellToText(u?.transcript ?? u);
    if (t) setPartial(t);
  });

  client.on("message", (m: any) => {
    // Retell may emit { role, content } where content can be string or blocks
    if (m?.role === "assistant" && m?.content != null) {
      const t = retellToText(m.content);
      if (t) pushMsg("assistant", t);
    }
    if (m?.role === "user" && m?.content != null) {
      const t = retellToText(m.content);
      if (t) pushMsg("user", t);
    }
  });

  client.on("error", (err: any) => console.error("Retell error", err));

  await client.startCall({ accessToken });

  const teardown = () => {
    try { client.stopCall(); } catch {}
  };
  return teardown;
}

// --- Vapi via NPM Web SDK ---
async function startVapi(
  setPartial: (s: string) => void,
  pushMsg: (r: "user" | "assistant", t: string) => void,
  playAudio: (s: string | MediaStream) => void
) {
  // These two should be set in your .env (Vite env) and available on the client:
  // VITE_VAPI_PUBLIC_KEY and VITE_VAPI_ASSISTANT_ID
  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
  const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
  if (!publicKey || !assistantId) {
    throw new Error("Vapi public key or assistant id missing (VITE_VAPI_PUBLIC_KEY / VITE_VAPI_ASSISTANT_ID).");
  }

  const client = new Vapi(publicKey);

  client.on("partial-transcript", (t: string) => setPartial(t || ""));
  client.on("final-transcript", (t: string) => { setPartial(""); pushMsg("user", t || ""); });
  client.on("message", (m: any) => {
    if (m?.role === "assistant" && m?.content) pushMsg("assistant", m.content);
  });
  client.on("audio-stream", (ms: MediaStream) => playAudio(ms));

  await client.start(assistantId);

  const teardown = () => {
    try { client.stop(); } catch {}
  };
  return teardown;
}
