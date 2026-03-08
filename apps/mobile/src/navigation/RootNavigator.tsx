import { useEffect, useRef } from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLocale } from "../contexts/LocaleContext";
import AuthStack from "./AuthStack";
import MainStack from "./MainStack";

export default function RootNavigator() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isDark, colors, applyFromServer: applyTheme } = useTheme();
  const { applyFromServer: applyLocale } = useLocale();
  const appliedRef = useRef(false);

  // Apply server preferences once after login
  useEffect(() => {
    if (user && !appliedRef.current) {
      appliedRef.current = true;
      if (user.theme) applyTheme(user.theme);
      if (user.locale) applyLocale(user.locale);
    }
    if (!user) appliedRef.current = false;
  }, [user, applyTheme, applyLocale]);

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
