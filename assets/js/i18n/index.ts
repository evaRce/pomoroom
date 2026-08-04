import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./locales/es";
import en from "./locales/en";

export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function normalizeLocale(locale: string | null | undefined): SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? (locale as SupportedLocale) : "es";
}

export function initI18n(initialLocale?: string | null) {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources: {
        es: { translation: es },
        en: { translation: en },
      },
      lng: normalizeLocale(initialLocale),
      fallbackLng: "es",
      interpolation: { escapeValue: false },
    });
  }

  return i18n;
}

export { normalizeLocale };
export default i18n;
