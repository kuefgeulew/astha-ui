import { useEffect, useState } from "react";
export function useNickname() {
  const [nickname, setNickname] = useState(() => localStorage.getItem("astha_nickname") || "gloryhunter23");
  useEffect(() => { localStorage.setItem("astha_nickname", nickname); }, [nickname]);
  return { nickname, setNickname };
}
