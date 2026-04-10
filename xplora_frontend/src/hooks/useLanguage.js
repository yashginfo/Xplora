// src/hooks/useLanguage.js
import { useContext } from "react";
import { LanguageContext } from "../context/LanguageContextValue";  // ✅ updated

const useLanguage = () => useContext(LanguageContext);

export default useLanguage; 