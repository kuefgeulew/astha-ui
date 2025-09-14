import { useEffect, useState } from "react";
export function useLang() {
  const [lang, setLang] = useState(() => localStorage.getItem("astha_lang") || "বাংলা");
  useEffect(() => { localStorage.setItem("astha_lang", lang); }, [lang]);
  return { lang, setLang };
}
