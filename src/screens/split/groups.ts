// src/screens/split/groups.ts
// Minimal shared data/helpers for Split & Request flows

export type Person = {
  id: string;
  name: string;
  mask: string;     // masked account / phone text shown under the name
  avatar?: string;  // simple emoji/initial for now
};

export type Group = {
  id: string;
  name: string;
  emoji: string;
  memberIds: string[];
  createdAt: number;
};

/* ------------------------------------------------------------------ */
/*  People (from your screenshots)                                    */
/* ------------------------------------------------------------------ */

export const PEOPLE: Person[] = [
  // Screenshot 1
  { id: "abdur-rahman",          name: "Abdur Rahman",            mask: "•••0582", avatar: "🌙" },
  { id: "anjumee-troyee",        name: "Anjumee Troyee",          mask: "•••4921", avatar: "🧕" },
  { id: "ashraful-munir-shakil", name: "Ashraful Munir Shakil",   mask: "•••7740", avatar: "🧔🏻" },
  { id: "iffat-sanjida-dola",    name: "Iffat Sanjida Dola",      mask: "•••3316", avatar: "👩🏻" },
  { id: "jannat-shaky",          name: "Jannat Shaky",            mask: "•••9284", avatar: "👩🏽" },
  { id: "kazi-zinia",            name: "Kazi Zinia",              mask: "•••6402", avatar: "👩🏽‍🎨" },
  { id: "maliha-mahfuz",         name: "Maliha Mahfuz",           mask: "•••1180", avatar: "👩🏼" },
  { id: "maliha-nusrat-arpa",    name: "Maliha Nusrat Arpa",      mask: "•••4477", avatar: "👩🏻‍💼" },
  { id: "morium-mannan-tonni",   name: "Morium Mannan Tonni",     mask: "•••9008", avatar: "👤" },
  { id: "mortoza-morshed",       name: "Mortoza Morshed",         mask: "•••2673", avatar: "🏔️" },
  { id: "nabil-hassan",          name: "Nabil Hassan",            mask: "•••7304", avatar: "🧑🏽" },
  { id: "nazia-haque",           name: "Nazia Haque",             mask: "•••5529", avatar: "🧕🏼" },
  { id: "nazmul-hasan-shihab",   name: "Nazmul Hasan Shihab",     mask: "•••8892", avatar: "🧑🏻‍💼" },
  { id: "nibula-rashid",         name: "Nibula Rashid",           mask: "•••3351", avatar: "🧕🏽" },
  { id: "nupur-sarker",          name: "Nupur Sarker",            mask: "•••6407", avatar: "🌆" },

  // Screenshot 2
  { id: "rifat-jahan-biva",      name: "Rifat Jahan Biva",        mask: "•••4142", avatar: "🌸" },
  { id: "sadia-islam-ananya",    name: "Sadia Islam Ananya",      mask: "•••7059", avatar: "🏞️" },
  { id: "sakib-alam",            name: "Sakib Alam",              mask: "•••2214", avatar: "👔" },
  { id: "samen-yasar",           name: "Samen Yasar",             mask: "•••6071", avatar: "🧑🏽‍💻" },
  { id: "sanjana-soheli-ahmed",  name: "Sanjana Soheli Ahmed",    mask: "•••7730", avatar: "🎀" },
  { id: "sumaiya-aditi",         name: "Sumaiya Aditi",           mask: "•••5428", avatar: "🧕🏾" },
  { id: "tanvir-islam",          name: "Tanvir Islam",            mask: "•••9022", avatar: "🧑🏽" },
  { id: "tawsif-zaman",          name: "Tawsif Zaman",            mask: "•••6608", avatar: "👓" },
  { id: "utsha-barua",           name: "Utsha Barua",             mask: "•••2884", avatar: "😎" },

  // Me (keep for self-splits)
  { id: "me",                    name: "You",                     mask: "Primary ••1234", avatar: "🫶" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

export function getPerson(id: string) {
  return PEOPLE.find((p) => p.id === id);
}

const LS_GROUPS = "astha_groups";
const LS_POINTS = "astha_points";
const LS_BADGES = "astha_badges";

/**
 * Seed a few default groups if none exist in localStorage.
 * Includes the requested “JAIBB Books Order” (from screenshot 3).
 */
function seedGroups(): Group[] {
  // member pick helper by id
  const pick = (...ids: string[]) => ids;

  const g: Group[] = [
    {
      id: "g-jaibb-books",
      name: "JAIBB Books Order",
      emoji: "📚",
      // From 3rd screenshot selection
      memberIds: pick(
        "iffat-sanjida-dola",
        "maliha-mahfuz",
        "mortoza-morshed",
        "nazia-haque",
        "sadia-islam-ananya",
        "sakib-alam",
        "sanjana-soheli-ahmed",
        "sumaiya-aditi",
        "tanvir-islam"
      ),
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    },
    {
      id: "g-weekend-travel",
      name: "Weekend Travel Gang",
      emoji: "🧳",
      memberIds: pick(
        "abdur-rahman",
        "ashraful-munir-shakil",
        "nabil-hassan",
        "nazmul-hasan-shihab",
        "utsha-barua",
        "me"
      ),
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    },
    {
      id: "g-office-lunch",
      name: "Office Lunch",
      emoji: "🍱",
      memberIds: pick(
        "kazi-zinia",
        "maliha-nusrat-arpa",
        "morium-mannan-tonni",
        "nibula-rashid",
        "nupur-sarker",
        "me"
      ),
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    },
    {
      id: "g-batch-friends",
      name: "Batch ’18 Friends",
      emoji: "🎓",
      memberIds: pick(
        "anjumee-troyee",
        "jannat-shaky",
        "rifat-jahan-biva",
        "samen-yasar",
        "tawsif-zaman",
        "me"
      ),
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 25,
    },
  ];

  // persist once
  localStorage.setItem(LS_GROUPS, JSON.stringify(g));
  return g;
}

export function loadGroups(): Group[] {
  try {
    const raw = localStorage.getItem(LS_GROUPS);
    if (!raw) return seedGroups();
    const parsed: Group[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return seedGroups();
    return parsed;
  } catch {
    return seedGroups();
  }
}

export function saveGroups(groups: Group[]) {
  localStorage.setItem(LS_GROUPS, JSON.stringify(groups));
}

/* ------------------------------------------------------------------ */
/*  Gamification counters (kept compatible with your existing calls)  */
/* ------------------------------------------------------------------ */

export function getPoints(): number {
  const n = Number(localStorage.getItem(LS_POINTS) || "0");
  return isNaN(n) ? 0 : n;
}

export function setPoints(v: number) {
  localStorage.setItem(LS_POINTS, String(v));
}

export function addPoints(delta: number) {
  setPoints(getPoints() + delta);
}

export function getBadges(): string[] {
  try {
    const raw = localStorage.getItem(LS_BADGES);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function setBadges(list: string[]) {
  localStorage.setItem(LS_BADGES, JSON.stringify(list));
}

/* ------------------------------------------------------------------ */
/*  🔧 Minimal badge helper exports for rewards.ts compatibility      */
/* ------------------------------------------------------------------ */

export function unlockBadge(id: string) {
  if (!id) return;
  const set = new Set(getBadges());
  set.add(id);
  setBadges([...set]);
}

// Optional alias if any place uses awardBadge
export const awardBadge = unlockBadge;
