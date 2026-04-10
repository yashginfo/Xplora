// src/components/LanguageSelector.jsx
import { useState, useRef, useEffect } from "react";
import useLanguage from "../hooks/useLanguage";
import { LANGUAGES } from "../constants/languages";

const LanguageSelector = ({ mobileFullWidth = false }) => {
  const { language, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find((l) => l.code === language);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Mobile full-width mode (used inside the drawer)
  if (mobileFullWidth) {
    return (
      <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors text-left ${
              language === lang.code
                ? "bg-amber-400/15 text-amber-400"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.name}</span>
            {language === lang.code && (
              <svg className="ml-auto w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-xs font-medium border border-white/15 text-white/50 hover:text-white hover:border-white/30 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all"
      >
        <span className="text-sm">{current?.flag}</span>
        <span className="hidden sm:inline">{current?.name}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown — keep within viewport */}
      {open && (
        <div className="absolute right-0 mt-2 w-44 backdrop-blur-xl bg-black/70 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden max-h-72 overflow-y-auto">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { changeLanguage(lang.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                ${language === lang.code
                  ? "bg-amber-400/15 text-amber-400"
                  : "text-white/50 hover:bg-white/8 hover:text-white"}`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
              {language === lang.code && (
                <svg className="ml-auto w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;