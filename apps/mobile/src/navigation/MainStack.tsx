import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../contexts/ThemeContext";
import MainTabs from "./MainTabs";
import AssetDetailScreen from "../screens/AssetDetailScreen";

export type MainStackParamList = {
  Tabs: undefined;
  AssetDetail: { assetId: string; name: string };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="AssetDetail"
        component={AssetDetailScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
    </Stack.Navigator>
  );
}
