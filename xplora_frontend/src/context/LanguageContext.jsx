// src/context/LanguageContext.jsx
import { useState, useCallback } from "react";
import { LanguageContext } from "./LanguageContextValue";
import { loadCache, saveCache } from "../utils/translationCache";

let cache = loadCache();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  const translate = useCallback(async (text) => {
    if (!text || language === "en") return text;

    const cacheKey = `${language}:${text}`;
    if (cache[cacheKey]) return cache[cacheKey];

    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${language}`
      );
      const data = await res.json();
      const translated = data.responseData?.translatedText || text;
      cache[cacheKey] = translated;
      saveCache(cache);
      return translated;
    } catch {
      return text;
    }
  }, [language]);

  const translateBatch = useCallback(async (texts) => {
    const results = await Promise.all(texts.map((t) => translate(t)));
    return results;
  }, [translate]);

  const changeLanguage = (code) => setLanguage(code);

  return (
    <LanguageContext.Provider value={{
      language,
      changeLanguage,
      translate,
      translateBatch,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}; 