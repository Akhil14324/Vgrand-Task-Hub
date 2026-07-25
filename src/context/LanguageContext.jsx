import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { translateBatch } from '../i18n/translateService';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'en';
  });

  const [dynamicCache, setDynamicCache] = useState({});
  const [translating, setTranslating] = useState(false);

  const translateDynamic = useCallback(
    async (texts) => {
      if (lang === 'en') return {};
      if (!texts.length) return {};

      setTranslating(true);
      try {
        const results = await translateBatch(texts, lang);
        const map = {};
        texts.forEach((text, i) => {
          map[text] = results[i] || text;
        });
        setDynamicCache((prev) => ({ ...prev, ...map }));
        return map;
      } finally {
        setTranslating(false);
      }
    },
    [lang]
  );

  const getDynamic = useCallback(
    (text) => {
      if (lang === 'en') return text;
      return dynamicCache[text] ?? text;
    },
    [dynamicCache, lang]
  );

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    setDynamicCache({}); // Clear dynamic cache on language switch
  };

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'en' ? 'te' : 'en';
      localStorage.setItem('lang', next);
      setDynamicCache({});
      return next;
    });
  };

  const t = useCallback(
    (key) => {
      const dict = translations[lang] || translations.en;
      return dict[key] ?? translations.en[key] ?? key;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, changeLang, toggleLang, t, translateDynamic, getDynamic, translating }),
    [lang, t, translateDynamic, getDynamic, translating]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
