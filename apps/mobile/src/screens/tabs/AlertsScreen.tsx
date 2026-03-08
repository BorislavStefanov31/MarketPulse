import { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  LayoutAnimation,
  StyleSheet,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../contexts/ThemeContext";
import { useLocale } from "../../contexts/LocaleContext";
import {
  getAlerts,
  deleteAlert,
  toggleAlert,
  type Alert as AlertT,
} from "../../services/alerts";

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toPrecision(4)}`;
}

export default function AlertsScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: getAlerts,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAlert(id),
    onSuccess: () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => toggleAlert(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const handleDelete = useCallback(
    (alert: AlertT) => {
      Alert.alert(t("deleteAlert"), t("deleteAlertConfirm"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("delete"), style: "destructive", onPress: () => deleteMutation.mutate(alert.id) },
      ]);
    },
    [t, deleteMutation],
  );

  const renderAlert = useCallback(
    ({ item }: { item: AlertT }) => {
      const isAbove = item.type === "ABOVE";
      const typeColor = isAbove ? "#22c55e" : "#ef4444";
      const typeLabel = isAbove ? t("priceAbove") : t("priceBelow");
      const typeIcon = isAbove ? "↑" : "↓";

      return (
        <View
          style={[
            styles.alertCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            item.isTriggered && { borderColor: typeColor, borderWidth: 1.5 },
          ]}
        >
          <View style={styles.alertTop}>
            <View style={styles.alertInfo}>
              <View style={styles.alertSymbolRow}>
                <Text style={[styles.alertSymbol, { color: colors.text }]}>{item.asset.symbol}</Text>
                <View style={[styles.typeBadge, { backgroundColor: typeColor + "20" }]}>
                  <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                    {typeIcon} {typeLabel}
                  </Text>
                </View>
              </View>
              <Text style={[styles.alertAssetName, { color: colors.textSecondary }]}>{item.asset.name}</Text>
            </View>
            {!item.isTriggered && (
              <Switch
                value={item.isActive}
                onValueChange={(val) => toggleMutation.mutate({ id: item.id, isActive: val })}
                trackColor={{ false: colors.border, true: colors.primary + "60" }}
                thumbColor={item.isActive ? colors.primary : colors.textSecondary}
              />
            )}
          </View>

          <View style={[styles.alertBottom, { borderTopColor: colors.border }]}>
            <View style={styles.alertPrices}>
              <View style={styles.alertPriceCol}>
                <Text style={[styles.alertPriceLabel, { color: colors.textSecondary }]}>{t("targetPrice")}</Text>
                <Text style={[styles.alertPriceValue, { color: colors.text }]}>{formatPrice(item.targetPrice)}</Text>
              </View>
              <View style={styles.alertPriceCol}>
                <Text style={[styles.alertPriceLabel, { color: colors.textSecondary }]}>{t("price")}</Text>
                <Text style={[styles.alertPriceValue, { color: colors.text }]}>{formatPrice(item.asset.currentPrice)}</Text>
              </View>
            </View>

            <View style={styles.alertActions}>
              {item.isTriggered && (
                <View style={[styles.triggeredBadge, { backgroundColor: typeColor + "20" }]}>
                  <Text style={[styles.triggeredText, { color: typeColor }]}>{t("triggered")}</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.deleteBtn, { backgroundColor: "#ef444415" }]}
              >
                <Text style={styles.deleteBtnText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [colors, t, handleDelete, toggleMutation],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderAlert}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>🔔</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("noAlerts")}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 12, paddingBottom: 24 },
  alertCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  alertTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  alertInfo: { flex: 1 },
  alertSymbolRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  alertSymbol: { fontSize: 17, fontWeight: "700" },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: { fontSize: 12, fontWeight: "700" },
  alertAssetName: { fontSize: 12, marginTop: 2 },
  alertBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  alertPrices: { flexDirection: "row", gap: 20 },
  alertPriceCol: {},
  alertPriceLabel: { fontSize: 11, fontWeight: "500" },
  alertPriceValue: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  alertActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  triggeredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  triggeredText: { fontSize: 11, fontWeight: "700" },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { color: "#ef4444", fontSize: 18, fontWeight: "600", marginTop: -1 },
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { textAlign: "center", fontSize: 15, lineHeight: 22 },
});
