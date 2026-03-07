import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLocale, type Locale } from "../../contexts/LocaleContext";

type ThemeMode = "light" | "dark" | "system";

function OptionRow({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <View style={styles.optionsRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.option,
              { borderColor: colors.border },
              selected === opt.value && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text
              style={[
                styles.optionText,
                { color: colors.text },
                selected === opt.value && { color: "#fff" },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { mode, setMode, colors } = useTheme();
  const { locale, setLocale, t } = useLocale();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <OptionRow
          label={t("theme")}
          options={[
            { value: "light", label: t("light") },
            { value: "dark", label: t("dark") },
            { value: "system", label: t("system") },
          ]}
          selected={mode}
          onSelect={(v) => setMode(v as ThemeMode)}
        />

        <OptionRow
          label={t("language")}
          options={[
            { value: "en", label: "English" },
            { value: "bg", label: "\u0411\u044A\u043B\u0433\u0430\u0440\u0441\u043A\u0438" },
          ]}
          selected={locale}
          onSelect={(v) => setLocale(v as Locale)}
        />
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.danger }]}
        onPress={logout}
      >
        <Text style={styles.logoutText}>{t("logout")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  section: { marginBottom: 24 },
  email: { fontSize: 16, textAlign: "center", marginBottom: 8 },
  row: { marginBottom: 20 },
  rowLabel: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  optionsRow: { flexDirection: "row", gap: 8 },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: { fontSize: 14, fontWeight: "500" },
  logoutButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  logoutText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
