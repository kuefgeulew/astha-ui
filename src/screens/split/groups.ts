// src/screens/split/groups.ts

/** Person directory used across the Split/Request flow */
export type Person = {
  id: string;
  name: string;
  avatar?: string;   // emoji or small glyph
  mask: string;      // masked account string e.g. "A/C •••• 0003"
  isYou?: boolean;   // signed-in user
};

export const PEOPLE: Person[] = [
  { id: "me",      name: "Nazia Haque",   avatar: "👩🏻‍💼", mask: "A/C •••• 0003", isYou: true },
  { id: "ayesha",  name: "Ayesha Rahman", avatar: "🧕",     mask: "A/C •••• 0001" },
  { id: "siam",    name: "Siam Chowdhury",avatar: "🧑🏻",    mask: "A/C •••• 0002" },
  { id: "mahbub",  name: "Mahmud Karim",  avatar: "🧔🏻",    mask: "A/C •••• 0004" },
  { id: "jannat",  name: "Jannat Akter",  avatar: "👩🏻",    mask: "A/C •••• 0005" },
  { id: "arif",    name: "Arif Islam",    avatar: "👨🏻",    mask: "A/C •••• 0006" },
];

export function getPerson(id: string): Person | undefined {
  return PEOPLE.find(p => p.id === id);
}

/** Saved reusable group */
export type Group = {
  id: string;
  name: string;            // "Office Lunch Squad"
  emoji?: string;          // e.g. "🍔"
  memberIds: string[];     // references PEOPLE ids (must include "me" for user's groups)
  createdAt: number;
};

/* --------------------------- LocalStorage keys --------------------------- */
const LS_GROUPS = "astha_split_groups_v1";
const LS_POINTS = "astha_split_points_v1";
const LS_BADGES = "astha_split_badges_v1";

/* ------------------------------- Groups API ------------------------------ */

export function loadGroups(): Group[] {
  try {
    const raw = localStorage.getItem(LS_GROUPS);
    if (raw) {
      const parsed = JSON.parse(raw) as Group[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  // seed a couple so the UI isn't empty
  const seed: Group[] = [
    {
      id: "grp1",
      name: "Office Lunch Squad",
      emoji: "🍱",
      memberIds: ["me", "ayesha", "siam"],
      createdAt: Date.now(),
    },
    {
      id: "grp2",
      name: "Weekend Travel Gang",
      emoji: "🧳",
      memberIds: ["me", "mahbub", "jannat", "arif"],
      createdAt: Date.now(),
    },
  ];
  saveGroups(seed);
  return seed;
}

export function saveGroups(groups: Group[]) {
  try {
    localStorage.setItem(LS_GROUPS, JSON.stringify(groups));
  } catch {}
}

/** Optional helper if you need to insert/update a group by id */
export function upsertGroup(group: Group) {
  const all = loadGroups();
  const i = all.findIndex(g => g.id === group.id);
  if (i >= 0) all[i] = group; else all.unshift(group);
  saveGroups(all);
}

/* --------------------------- Points & Badges API ------------------------- */

export function getPoints(): number {
  const n = Number(localStorage.getItem(LS_POINTS) || "0");
  return Number.isFinite(n) ? n : 0;
}

export function addPoints(delta: number): number {
  const next = Math.max(0, getPoints() + (Number.isFinite(delta) ? delta : 0));
  localStorage.setItem(LS_POINTS, String(next));
  return next;
}

export function getBadges(): string[] {
  try {
    const raw = localStorage.getItem(LS_BADGES);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function addBadge(id: string) {
  const set = new Set(getBadges());
  if (!id) return;
  set.add(id);
  localStorage.setItem(LS_BADGES, JSON.stringify([...set]));
}

/* Aliases for compatibility with other modules */
export const awardBadge = addBadge;
export const unlockBadge = addBadge;
