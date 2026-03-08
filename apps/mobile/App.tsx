import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";
import { ThemeProvider, useTheme } from "./src/contexts/ThemeContext";
import { LocaleProvider } from "./src/contexts/LocaleContext";
import { ToastProvider } from "./src/components/Toast";
import RootNavigator from "./src/navigation/RootNavigator";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000,
      retry: 2,
    },
  },
});

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
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </LocaleProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
