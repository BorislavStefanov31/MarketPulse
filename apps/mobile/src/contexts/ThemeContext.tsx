import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { updateMe } from "../services/users";

type ThemeMode = "light" | "dark" | "system";

type ThemeState = {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  applyFromServer: (theme: string) => void;
  colors: typeof lightColors;
};

const lightColors = {
  background: "#ffffff",
  surface: "#f9f9f9",
  text: "#000000",
  textSecondary: "#666666",
  primary: "#2563eb",
  border: "#dddddd",
  danger: "#ef4444",
  success: "#22c55e",
  card: "#ffffff",
};

const darkColors: typeof lightColors = {
  background: "#0f172a",
  surface: "#1e293b",
  text: "#f8fafc",
  textSecondary: "#94a3b8",
  primary: "#3b82f6",
  border: "#334155",
  danger: "#f87171",
  success: "#4ade80",
  card: "#1e293b",
};

const STORAGE_KEY = "theme_mode";

function isValidTheme(v: string | null): v is ThemeMode {
  return v === "light" || v === "dark" || v === "system";
}

const ThemeContext = createContext<ThemeState | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (isValidTheme(saved)) setModeState(saved);
      setLoaded(true);
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode);
    updateMe({ theme: newMode }).catch(() => {});
  }, []);

  const applyFromServer = useCallback((theme: string) => {
    if (isValidTheme(theme)) {
      setModeState(theme);
      AsyncStorage.setItem(STORAGE_KEY, theme);
    }
  }, []);

  const isDark = mode === "system" ? systemScheme === "dark" : mode === "dark";

  if (!loaded) return null;

  return (
    <ThemeContext.Provider
      value={{ mode, isDark, setMode, applyFromServer, colors: isDark ? darkColors : lightColors }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
