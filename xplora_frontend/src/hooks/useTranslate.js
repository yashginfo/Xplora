// src/hooks/useTranslate.js
import { useState, useEffect } from "react";
import useLanguage from "./useLanguage";

const useTranslate = (texts) => {
  const { translate, translateBatch, language } = useLanguage();
  const isArray = Array.isArray(texts);

  const [translated, setTranslated] = useState(
    isArray ? texts : [texts]
  );

  useEffect(() => {
    if (!texts) return;
    let cancelled = false;

    const run = async () => {
      if (isArray) {
        const results = await translateBatch(texts);
        if (!cancelled) setTranslated(results);
      } else {
        const result = await translate(texts);
        if (!cancelled) setTranslated([result]);
      }
    };

    run();
    return () => { cancelled = true; }; 

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return isArray ? translated : translated[0];
};

export default useTranslate; 