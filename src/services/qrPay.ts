// src/services/qrPay.ts
import { BankApi, type Account, type TransferPayload } from "./bankApi";

/** Very light QR payload parser (accepts plain merchant ID too). */
export function parseQrPayload(raw: string): { merchantId: string } | null {
  if (!raw) return null;
  try {
    // Accept common QR forms:
    // 1) plain merchant id like "01XXXXXXXXX" or "MERCHANT123"
    // 2) url with ?merchant=... or ?merchantId=...
    const urlish = /^https?:\/\//i.test(raw);
    if (urlish) {
      const u = new URL(raw);
      const id = u.searchParams.get("merchant") || u.searchParams.get("merchantId");
      return id ? { merchantId: id } : null;
    }
    // fallback: trimmed content as merchant id
    const id = raw.trim();
    return id ? { merchantId: id } : null;
  } catch {
    return null;
  }
}

/** Source accounts to show in QR Pay “Pay From” select. */
export async function listSourceAccounts(): Promise<Account[]> {
  return BankApi.listAccounts();
}

/** Fetch the live balance for a selected account. */
export async function getAccountBalance(accountId: string): Promise<{ balance: number; currency: string }> {
  const res = await BankApi.getBalance(accountId);
  return { balance: res.balance, currency: res.currency };
}

/** Execute payment by calling the mock bank transfer endpoint. */
export async function payMerchantViaTransfer(
  fromId: string,
  merchantId: string,
  amount: number,
  note?: string
): Promise<{ ok: true; txId: string } | { ok: false; error: string }> {
  const payload: TransferPayload = {
    fromId,
    toAccount: merchantId,
    amount,
    note,
  };
  return BankApi.makeTransfer(payload);
}

export type { Account } from "./bankApi";
