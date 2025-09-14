import { useEffect, useState } from "react";
import type { Screen } from "../types";

export function useHashScreen(initial: Screen = "home") {
  const [screen, setScreen] = useState<Screen>(() => (location.hash.slice(1) as Screen) || initial);

  useEffect(() => {
    const onHash = () => setScreen((location.hash.slice(1) as Screen) || initial);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [initial]);

  useEffect(() => {
    const next = `#${screen}`;
    if (location.hash !== next) location.hash = next;
  }, [screen]);

  return { screen, setScreen };
}
