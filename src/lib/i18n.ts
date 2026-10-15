import { useEffect } from "react";
import { useElec, type Lang } from "@/lib/store";

export function useTx() {
  const lang = useElec((state) => state.lang);
  const setLang = useElec((state) => state.setLang);
  const tx = (vi: string, en: string) => (lang === "vi" ? vi : en);
  useEffect(() => {
    void useElec.persist.rehydrate();
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return { lang, setLang, tx };
}

export function slotLabel(lang: Lang, id: string) {
  const map: Record<string, [string, string]> = {
    s1: ["08:00–11:00", "08:00–11:00"],
    s2: ["11:00–14:00", "11:00–14:00"],
    s3: ["14:00–17:00", "14:00–17:00"],
    s4: ["17:00–20:00", "17:00–20:00"],
  };
  const pair = map[id] ?? ["", ""];
  return lang === "vi" ? pair[0] : pair[1];
}
