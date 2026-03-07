import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { updateMe } from "../services/users";

export type Locale = "en" | "bg";

const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    watchlists: "Watchlists",
    alerts: "Alerts",
    settings: "Settings",
    login: "Log In",
    signup: "Sign Up",
    logout: "Log Out",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account? Sign up",
    hasAccount: "Already have an account? Log in",
    theme: "Theme",
    currency: "Currency",
    language: "Language",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  bg: {
    dashboard: "\u0422\u0430\u0431\u043B\u043E",
    watchlists: "\u0421\u043F\u0438\u0441\u044A\u0446\u0438",
    alerts: "\u0410\u043B\u0430\u0440\u043C\u0438",
    settings: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    login: "\u0412\u0445\u043E\u0434",
    signup: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F",
    logout: "\u0418\u0437\u0445\u043E\u0434",
    email: "\u0418\u043C\u0435\u0439\u043B",
    password: "\u041F\u0430\u0440\u043E\u043B\u0430",
    forgotPassword: "\u0417\u0430\u0431\u0440\u0430\u0432\u0435\u043D\u0430 \u043F\u0430\u0440\u043E\u043B\u0430?",
    noAccount: "\u041D\u044F\u043C\u0430\u0442\u0435 \u0430\u043A\u0430\u0443\u043D\u0442? \u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0430\u0439\u0442\u0435 \u0441\u0435",
    hasAccount: "\u0418\u043C\u0430\u0442\u0435 \u0430\u043A\u0430\u0443\u043D\u0442? \u0412\u043B\u0435\u0437\u0442\u0435",
    theme: "\u0422\u0435\u043C\u0430",
    currency: "\u0412\u0430\u043B\u0443\u0442\u0430",
    language: "\u0415\u0437\u0438\u043A",
    light: "\u0421\u0432\u0435\u0442\u043B\u0430",
    dark: "\u0422\u044A\u043C\u043D\u0430",
    system: "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u0430",
  },
};

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  applyFromServer: (locale: string) => void;
  t: (key: string) => string;
};

const STORAGE_KEY = "locale";

const LocaleContext = createContext<LocaleState | undefined>(undefined);

function isValidLocale(v: string | null): v is Locale {
  return v === "en" || v === "bg";
}

function getDeviceLocale(): Locale {
  const deviceLocale = getLocales()[0]?.languageCode;
  return deviceLocale === "bg" ? "bg" : "en";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getDeviceLocale());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (isValidLocale(saved)) setLocaleState(saved);
      setLoaded(true);
    });
  }, []);

  // Called by user action — saves locally + syncs to backend
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    AsyncStorage.setItem(STORAGE_KEY, l);
    updateMe({ locale: l }).catch(() => {});
  }, []);

  // Called after login to apply server preference without re-saving to backend
  const applyFromServer = useCallback((l: string) => {
    if (isValidLocale(l)) {
      setLocaleState(l);
      AsyncStorage.setItem(STORAGE_KEY, l);
    }
  }, []);

  const t = useCallback(
    (key: string) => STRINGS[locale][key] ?? key,
    [locale]
  );

  if (!loaded) return null;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, applyFromServer, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
