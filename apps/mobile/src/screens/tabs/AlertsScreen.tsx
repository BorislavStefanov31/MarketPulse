import { View, Text, StyleSheet } from "react-native";
import { useLocale } from "../../contexts/LocaleContext";

export default function AlertsScreen() {
  const { t } = useLocale();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("alerts")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
});
