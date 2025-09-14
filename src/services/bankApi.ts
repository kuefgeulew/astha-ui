// src/services/bankApi.ts
export interface Account {
  id: string;
  name: string;
  numberMasked?: string;
  currency: string;
  balance: number;
}
export interface TransferPayload {
  fromId: string;
  toAccount: string;
  amount: number;
  note?: string;
}

const BASE = (import.meta.env.VITE_BANK_API_URL ?? "/bank").replace(/\/+$/, "");

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = import.meta.env.VITE_BANK_API_KEY;
  if (apiKey) headers["x-api-key"] = apiKey;
  return headers;
}

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = res.statusText;
    try { const d = await res.json(); msg = d?.error || JSON.stringify(d); } catch {}
    throw new Error(`${res.status} ${msg}`);
  }
  return res.json() as Promise<T>;
}

export const BankApi = {
  async listAccounts(): Promise<Account[]> {
    const res = await fetch(`${BASE}/accounts`, { headers: authHeaders() });
    const data = await toJson<{ accounts: Account[] }>(res);
    return data.accounts ?? [];
  },

  async getBalance(id: string): Promise<{ accountId: string; balance: number; currency: string }> {
    const res = await fetch(`${BASE}/accounts/${encodeURIComponent(id)}/balance`, {
      headers: authHeaders(),
    });
    return toJson(res);
  },

  async makeTransfer(
    body: TransferPayload
  ): Promise<{ ok: true; txId: string; newBalance?: number } | { ok: false; error: string }> {
    const res = await fetch(`${BASE}/transfers`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        fromAccountId: body.fromId,
        toAccount: body.toAccount,
        amount: body.amount,
        note: body.note,
      }),
    });

    if (!res.ok) {
      try {
        const err = await res.json();
        return { ok: false, error: err?.error ?? `${res.status} ${res.statusText}` };
      } catch {
        return { ok: false, error: `${res.status} ${res.statusText}` };
      }
    }
    const data = await res.json(); // { success, transfer, newBalance }
    if (data?.success && data?.transfer?.id) {
      return { ok: true, txId: data.transfer.id, newBalance: data.newBalance };
    }
    return { ok: false, error: "Unexpected transfer response" };
  },

  async health(): Promise<{ ok: boolean } | { status: string }> {
    const res = await fetch(`${BASE}/health`, { headers: authHeaders() });
    return toJson(res);
  },
};
