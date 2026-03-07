import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { setOnSessionExpired } from "../api/client";
import * as authService from "../services/auth";
import { getMe, type UserProfile } from "../services/users";

type AuthState = {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    authService.clearTokens();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getMe();
      setUser(profile);
    } catch {
      // ignore — user stays as-is
    }
  }, []);

  // Check for existing token on app start
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        if (token) {
          const profile = await getMe();
          setUser(profile);
        }
      } catch {
        await authService.clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Wire up session expired callback
  useEffect(() => {
    setOnSessionExpired(clearSession);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    setUser(data.user as unknown as UserProfile);
    // Fetch full profile (includes locale, theme)
    refreshUser();
  }, [refreshUser]);

  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      const data = await authService.signup(email, password, displayName);
      setUser(data.user as unknown as UserProfile);
      refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
