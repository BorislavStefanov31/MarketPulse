import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Currency = "USD" | "EUR" | "GBP" | "BGN";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "\u20AC",
  GBP: "\u00A3",
  BGN: "\u043B\u0432",
};

type CurrencyState = {
  currency: Currency;
  symbol: string;
  setCurrency: (currency: Currency) => void;
  format: (value: number | string) => string;
};

const STORAGE_KEY = "currency";

const CurrencyContext = createContext<CurrencyState | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && saved in CURRENCY_SYMBOLS) {
        setCurrencyState(saved as Currency);
      }
    });
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    AsyncStorage.setItem(STORAGE_KEY, c);
  }, []);

  const format = useCallback(
    (value: number | string) => {
      const num = typeof value === "string" ? parseFloat(value) : value;
      return `${CURRENCY_SYMBOLS[currency]}${num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, symbol: CURRENCY_SYMBOLS[currency], setCurrency, format }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used within CurrencyProvider");
  return context;
}
