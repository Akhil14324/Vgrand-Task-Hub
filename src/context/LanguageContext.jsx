import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'en';
  });

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'en' ? 'te' : 'en';
      localStorage.setItem('lang', next);
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

  const value = useMemo(() => ({ lang, changeLang, toggleLang, t }), [lang, t]);

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
