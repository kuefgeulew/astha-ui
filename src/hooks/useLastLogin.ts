import { useEffect, useState } from "react";

function formatNow() {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: true,
    timeZone: "Asia/Dhaka",
  }).format(new Date());
}

export function useLastLogin() {
  const [lastLogin, setLastLogin] = useState(() => localStorage.getItem("astha_last_login") || formatNow());
  const [lastFailure] = useState<string | undefined>(() => localStorage.getItem("astha_last_fail") || undefined);

  useEffect(() => {
    const now = formatNow();
    setLastLogin(now);
    localStorage.setItem("astha_last_login", now);
  }, []);

  return { lastLogin, lastFailure };
}
