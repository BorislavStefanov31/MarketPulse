import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../contexts/ThemeContext";
import { useLocale } from "../contexts/LocaleContext";
import { useAlertPoller } from "../hooks/useAlertPoller";
import HomeScreen from "../screens/tabs/HomeScreen";
import WatchlistScreen from "../screens/tabs/WatchlistScreen";
import AlertsScreen from "../screens/tabs/AlertsScreen";
import SettingsScreen from "../screens/tabs/SettingsScreen";

export type MainTabParamList = {
  Home: undefined;
  Watchlists: undefined;
  Alerts: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const { colors } = useTheme();
  const { t } = useLocale();
  useAlertPoller();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t("dashboard") }} />
      <Tab.Screen name="Watchlists" component={WatchlistScreen} options={{ title: t("watchlists") }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ title: t("alerts") }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t("settings") }} />
    </Tab.Navigator>
  );
}
