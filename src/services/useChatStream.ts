// client-side chat streamer

export type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

/**
 * Streams assistant tokens from your backend (/api/chat) using Server-Sent Events.
 * Accepts either { token } or { delta } chunks and a final { done: true }.
 * Falls back to a local stub if the server isn't reachable.
 */
export async function* streamChat(messages: ChatMsg[]) {
  try {
    const base = import.meta.env.VITE_CHAT_API_URL ?? "/api";
    const resp = await fetch(`${base}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!resp.ok || !resp.body) throw new Error("No stream");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      // SSE frames are separated by a blank line
      const frames = buf.split("\n\n");
      buf = frames.pop() || "";

      for (const frame of frames) {
        // lines look like: "data: {json}\n"
        const line = frame.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        const payload = line.slice("data:".length).trim();
        if (!payload) continue;

        try {
          const obj = JSON.parse(payload) as {
            token?: string;
            delta?: string;
            done?: boolean;
            error?: string;
          };

          if (obj?.error) throw new Error(obj.error);

          // Accept either { token } or { delta } from the server
          const piece = obj.token ?? obj.delta;
          if (piece) yield piece;

          if (obj.done) return;
        } catch {
          // ignore malformed frames
        }
      }
    }
  } catch {
    // fallback typing effect if server not available
    const fallback =
      "Hi! (local stub) Your chat server isn't running. Start the server on /api/chat or set VITE_CHAT_API_URL.";
    for (const ch of fallback) {
      await new Promise((r) => setTimeout(r, 8));
      yield ch;
    }
  }
}

// tiny dev checks
if (import.meta.env.DEV) {
  console.assert(typeof streamChat === "function", "streamChat should be a function");
}
