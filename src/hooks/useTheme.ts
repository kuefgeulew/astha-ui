import { useEffect, useState } from "react";
export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(
    () =>
      (localStorage.getItem("astha_theme") as "light" | "dark") ||
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
  useEffect(() => {
    localStorage.setItem("astha_theme", theme);
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);
  return { theme, setTheme };
}
