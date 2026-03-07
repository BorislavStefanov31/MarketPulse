import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/contexts/AuthContext";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { LocaleProvider } from "./src/contexts/LocaleContext";
import RootNavigator from "./src/navigation/RootNavigator";

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <RootNavigator />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
