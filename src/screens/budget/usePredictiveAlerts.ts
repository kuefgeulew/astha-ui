// src/screens/budget/usePredictiveAlerts.ts
import { useEffect, useMemo, useState } from "react";
import { getMerchantCapStatus } from "./budgetStore";

export type CapAlert = {
  merchant: string;
  spend: number;
  cap: number;
  usage: number;
  level: "warn" | "critical";
};

export default function usePredictiveAlerts(pollMs = 60000) {
  const calc = () =>
    getMerchantCapStatus("weekly")
      .filter((s) => s.status !== "ok")
      .map((s) => ({
        merchant: s.merchant,
        spend: s.spend,
        cap: s.cap,
        usage: s.usage,
        level: s.status === "breached" ? "critical" : "warn",
      })) as CapAlert[];

  const [alerts, setAlerts] = useState<CapAlert[]>(calc);

  useEffect(() => {
    const t = setInterval(() => setAlerts(calc()), pollMs);
    return () => clearInterval(t);
  }, [pollMs]);

  return useMemo(() => alerts, [alerts]);
}
