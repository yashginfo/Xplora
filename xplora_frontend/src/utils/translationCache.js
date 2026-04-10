// src/utils/translationCache.js
export const loadCache = () => {
  try {
    const stored = localStorage.getItem("xplora_translation_cache");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const saveCache = (cache) => {
  try {
    localStorage.setItem("xplora_translation_cache", JSON.stringify(cache));
  } catch {
    // fail silently
  }
}; 