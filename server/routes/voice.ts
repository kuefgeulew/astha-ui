// server/routes/voice.ts
import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

/**
 * Retell — create a web call and return the short-lived access_token
 * Docs: https://docs.retellai.com/deploy/web-call  → “Create Web Call”
 */
router.get("/retell/token", async (_req, res) => {
  const tries: Array<{ url: string; status?: number; ok?: boolean; header?: "bearer" | "x-api-key" }> = [];
  try {
    const key = process.env.RETELL_API_KEY;
    const agentId = process.env.RETELL_AGENT_ID;
    if (!key) return res.status(500).json({ error: "RETELL_API_KEY missing" });
    if (!agentId) return res.status(500).json({ error: "RETELL_AGENT_ID missing" });

    // Correct endpoint as per latest docs
    const url = "https://api.retellai.com/v2/create-web-call";

    // Retell accepts either Bearer or x-api-key depending on workspace;
    // we’ll try both once to be safe.
    for (const header of ["bearer", "x-api-key"] as const) {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(header === "bearer"
            ? { Authorization: `Bearer ${key}` }
            : { "x-api-key": key }),
        },
        body: JSON.stringify({ agent_id: agentId }),
      });
      tries.push({ url, status: resp.status, ok: resp.ok, header });

      if (resp.ok) {
        const json = await resp.json();
        // Retell returns { access_token, call_id, ... }
        return res.json({
          access_token: json.access_token,
          call_id: json.call_id,
        });
      }
    }

    res
      .status(502)
      .json({
        error: "Retell token mint failed across all known endpoints/headers",
        tried: tries,
        hint:
          "Check your Retell dashboard → Web Call docs for exact auth (Bearer vs x-api-key) and that the agent_id is correct.",
      });
  } catch (e: any) {
    res
      .status(500)
      .json({
        error: "Retell token mint failed",
        details: e?.message || String(e),
        tried: tries.map(t => t.url),
      });
  }
});

/**
 * Vapi — keep as-is or remove; the Web SDK usually uses a PUBLIC key on client.
 * (If you do get a server token flow from Vapi later, you can update here.)
 */
router.get("/vapi/token", async (_req, res) => {
  res
    .status(501)
    .json({
      error:
        "Not implemented. Use the Vapi Web SDK with your PUBLIC KEY on the client, or provide the server token endpoint from your Vapi dashboard.",
    });
});

/** Optional: config for IDs */
router.get("/config", (_req, res) => {
  res.json({
    retell: { agentId: process.env.RETELL_AGENT_ID || null },
    vapi: { assistantId: process.env.VAPI_ASSISTANT_ID || null, publicKey: process.env.VITE_VAPI_PUBLIC_KEY || null },
  });
});

export default router;
