// Lightweight mock account store for "profile QR" feature.
// Persists to localStorage so the selection survives reloads.

export type Account = {
  id: string;
  nickname: string;     // e.g., "Savings (Staff)"
  masked: string;       // e.g., "A/C •••• 0003"
  type: "savings" | "current";
};

export type ProfileQRState = {
  userId: string;       // permanent handle, e.g., "nazia325"
  linkedAccountId: string; // which account is currently tied
};

const K_ACCOUNTS = "astha_accounts_v1";
const K_PROFILE_QR = "astha_profile_qr_v1";

// Seed a few demo accounts
function seedAccounts(): Account[] {
  return [
    { id: "acct_main_staff", nickname: "Savings (Staff)", masked: "A/C •••• 0003", type: "savings" },
    { id: "acct_current",    nickname: "Current",          masked: "A/C •••• 1129", type: "current" },
    { id: "acct_savings2",   nickname: "Savings #2",       masked: "A/C •••• 7784", type: "savings" },
  ];
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
}

function saveJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadAccounts(): Account[] {
  return loadJSON<Account[]>(K_ACCOUNTS, seedAccounts());
}

export function saveAccounts(a: Account[]) {
  saveJSON(K_ACCOUNTS, a);
}

export function loadProfileQR(): ProfileQRState {
  // default: permanent userId "nazia325" linked to Savings (Staff)
  const def: ProfileQRState = { userId: "nazia325", linkedAccountId: "acct_main_staff" };
  return loadJSON<ProfileQRState>(K_PROFILE_QR, def);
}

export function saveProfileQR(s: ProfileQRState) {
  saveJSON(K_PROFILE_QR, s);
}

export function getLinkedAccount(): Account | undefined {
  const s = loadProfileQR();
  return loadAccounts().find(a => a.id === s.linkedAccountId);
}
