import { BarChart2, PlaneTakeoff, ShieldCheck, KeyRound, Landmark, Receipt, SendHorizontal } from "lucide-react";

export const DISPLAY_NAME = "Nazia Haque";
export const PROFILE_URL =
  "https://drive.google.com/uc?export=view&id=11RxHel4R4ivzXL70DyE5fhnR2KIc_PgA";

export const TABS = ["Accounts", "FDR/DPS", "Credit Card", "Loans"] as const;

export const ACTIONS = [
  { label: "Payments", icon: Receipt, new: false },
  { label: "Transfers", icon: SendHorizontal, new: false },
  { label: "Foreign Txn", icon: BarChart2, new: true },
  { label: "Travel Insurance", icon: PlaneTakeoff, new: true },
  { label: "Endorsement", icon: ShieldCheck, new: true },
  { label: "Virtual Cards", icon: KeyRound, new: true },
  { label: "Eduflex", icon: Landmark, new: true },
] as const;
