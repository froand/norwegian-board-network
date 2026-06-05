import { createContext, useContext } from 'react';
import { translations, type Language } from './i18n';

interface I18nContextType {
  lang: Language;
  t: (key: string) => string;
  setLang: (lang: Language) => void;
}

export const I18nContext = createContext<I18nContextType>({
  lang: 'no',
  t: (key) => key,
  setLang: () => {},
});

export function useI18n() {
  return useContext(I18nContext);
}

export function createI18nValue(lang: Language, setLang: (l: Language) => void): I18nContextType {
  return {
    lang,
    t: (key: string) => translations[lang][key] || key,
    setLang,
  };
}
