import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { updateMe } from "../services/users";

export type Locale = "en" | "bg";

const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    // Tabs
    dashboard: "Dashboard",
    watchlists: "Watchlists",
    alerts: "Alerts",
    settings: "Settings",
    logout: "Log Out",
    // Common
    error: "Error",
    somethingWentWrong: "Oops! Something went wrong.",
    // Settings
    theme: "Theme",
    currency: "Currency",
    language: "Language",
    light: "Light",
    dark: "Dark",
    system: "System",
    // Home
    rank: "Rank",
    price: "Price",
    change24h: "24h %",
    volume: "Volume",
    noAssetsFound: "No assets found",
    // Asset detail
    assetNotFound: "Asset not found",
    chartAndStats: "Chart & Stats",
    aiReport: "AI Report",
    marketCap: "Market Cap",
    volume24h: "24h Volume",
    change24hLabel: "24h Change",
    type: "Type",
    noPriceHistory: "No price history yet",
    noAiReport: "No AI report available. One will be generated shortly.",
    // Watchlists
    newWatchlist: "New Watchlist",
    watchlistName: "Watchlist name",
    create: "Create",
    cancel: "Cancel",
    deleteWatchlist: "Delete Watchlist",
    deleteWatchlistConfirm: "Are you sure you want to delete \"{name}\"?",
    delete: "Delete",
    rename: "Rename",
    removeAsset: "Remove",
    emptyWatchlist: "No assets in this watchlist yet",
    noWatchlists: "No watchlists yet. Tap + to create one.",
    addToWatchlist: "Add to Watchlist",
    // Alerts
    newAlert: "New Alert",
    priceAbove: "Price Reached",
    priceBelow: "Price Dropped",
    targetPrice: "Target price",
    noAlerts: "No alerts yet. Tap + to create one.",
    deleteAlert: "Delete Alert",
    deleteAlertConfirm: "Are you sure you want to delete this alert?",
    alertTriggered: "Alert Triggered!",
    alertAboveMsg: "{symbol} reached ${price}",
    alertBelowMsg: "{symbol} dropped to ${price}",
    active: "Active",
    triggered: "Triggered",
    maxAlerts: "Maximum 10 alerts allowed",
    alertAboveMustBeHigher: "Target price must be above current price ({price})",
    alertBelowMustBeLower: "Target price must be below current price ({price})",
    currentPrice: "Current: {price}",
    addedToWatchlist: "Added to watchlist",
    watchlistCreated: "Watchlist created",
    alertCreated: "Alert created",
    notifyWhenReady: "Notify me when ready",
    aiReportReady: "AI Report Ready",
    aiReportReadyMsg: "The analysis for {symbol} is ready to view.",
    generatingReport: "Generating...",
  },
  bg: {
    // Табове
    dashboard: "Табло",
    watchlists: "Списъци",
    alerts: "Аларми",
    settings: "Настройки",
    logout: "Изход",
    // Общи
    error: "Грешка",
    somethingWentWrong: "Упс! Нещо се обърка.",
    // Настройки
    theme: "Тема",
    currency: "Валута",
    language: "Език",
    light: "Светла",
    dark: "Тъмна",
    system: "Системна",
    // Начален екран
    rank: "Ранг",
    price: "Цена",
    change24h: "24ч %",
    volume: "Обем",
    noAssetsFound: "Няма намерени активи",
    // Детайли за актив
    assetNotFound: "Активът не е намерен",
    chartAndStats: "Графика и статистика",
    aiReport: "AI Доклад",
    marketCap: "Пазарна кап.",
    volume24h: "24ч обем",
    change24hLabel: "24ч промяна",
    type: "Тип",
    noPriceHistory: "Няма история на цените",
    noAiReport: "Няма наличен AI доклад. Ще бъде генериран скоро.",
    // Списъци
    newWatchlist: "Нов списък",
    watchlistName: "Име на списъка",
    create: "Създай",
    cancel: "Отказ",
    deleteWatchlist: "Изтрий списъка",
    deleteWatchlistConfirm: "Сигурни ли сте, че искате да изтриете \"{name}\"?",
    delete: "Изтрий",
    rename: "Преименувай",
    removeAsset: "Премахни",
    emptyWatchlist: "Все още няма активи в този списък",
    noWatchlists: "Все още нямате списъци. Натиснете + за да създадете.",
    addToWatchlist: "Добави към списък",
    // Аларми
    newAlert: "Нова аларма",
    priceAbove: "Цената достигна",
    priceBelow: "Цената падна",
    targetPrice: "Целева цена",
    noAlerts: "Все още нямате аларми. Натиснете + за да създадете.",
    deleteAlert: "Изтрий аларма",
    deleteAlertConfirm: "Сигурни ли сте, че искате да изтриете тази аларма?",
    alertTriggered: "Аларма!",
    alertAboveMsg: "{symbol} достигна ${price}",
    alertBelowMsg: "{symbol} падна до ${price}",
    active: "Активна",
    triggered: "Задействана",
    maxAlerts: "Максимум 10 аларми",
    alertAboveMustBeHigher: "Целевата цена трябва да е над текущата ({price})",
    alertBelowMustBeLower: "Целевата цена трябва да е под текущата ({price})",
    currentPrice: "Текуща: {price}",
    addedToWatchlist: "Добавено в списък",
    watchlistCreated: "Списъкът е създаден",
    alertCreated: "Алармата е създадена",
    notifyWhenReady: "Извести ме когато е готов",
    aiReportReady: "AI докладът е готов",
    aiReportReadyMsg: "Анализът за {symbol} е готов за преглед.",
    generatingReport: "Генериране...",
  },
};

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  applyFromServer: (locale: string) => void;
  t: (key: string, params?: Record<string, string>) => string;
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
    (key: string, params?: Record<string, string>) => {
      let str = STRINGS[locale][key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(`{${k}}`, v);
        }
      }
      return str;
    },
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
