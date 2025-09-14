// src/screens/split/rewards.ts
import { addPoints, unlockBadge, getPoints } from "./groups";

export type RewardEvent =
  | { type: "CREATE_SPLIT" }
  | { type: "PAY_ON_TIME"; minutes: number }
  | { type: "CREATE_GROUP" };

export function applyReward(ev: RewardEvent) {
  switch (ev.type) {
    case "CREATE_SPLIT":
      addPoints(10);
      break;
    case "CREATE_GROUP":
      addPoints(5);
      break;
    case "PAY_ON_TIME":
      addPoints(ev.minutes <= 60 ? 20 : 10);
      if (ev.minutes <= 60) unlockBadge("quick_payer");
      break;
  }
  // meta badges
  if (getPoints() >= 200) unlockBadge("group_leader");
}

export const BADGE_META: Record<string, { label: string; emoji: string }> = {
  quick_payer: { label: "Quick Payer", emoji: "🏎️" },
  group_leader: { label: "Group Leader", emoji: "👑" },
};
