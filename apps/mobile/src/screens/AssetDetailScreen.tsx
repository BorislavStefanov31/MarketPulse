import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Markdown from "react-native-marked";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../navigation/MainStack";
import { getAssetById, getAssetHistory } from "../services/assets";
import { getLatestReport } from "../services/ai";
import { getWatchlists, addAssetToWatchlist } from "../services/watchlists";
import { createAlert, type AlertType } from "../services/alerts";
import { useTheme } from "../contexts/ThemeContext";
import { useLocale } from "../contexts/LocaleContext";
import LightweightChart from "../components/LightweightChart";
import { ReportSkeleton, ChartSkeleton } from "../components/Skeleton";

type Props = NativeStackScreenProps<MainStackParamList, "AssetDetail">;
type Tab = "chart" | "ai";

const screenWidth = Dimensions.get("window").width;

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toPrecision(4)}`;
}

function formatLargeNumber(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

function StatRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[styles.statRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) return null;
  const bg = sentiment === "bullish" ? "#22c55e" : sentiment === "bearish" ? "#ef4444" : "#94a3b8";
  return (
    <View style={styles.badge}>
      <Text style={[styles.badgeText, { backgroundColor: bg }]}>{sentiment.toUpperCase()}</Text>
    </View>
  );
}

export default function AssetDetailScreen({ route }: Props) {
  const { assetId } = route.params;
  const { colors, isDark } = useTheme();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("chart");
  const [wlPickerVisible, setWlPickerVisible] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>("ABOVE");
  const [alertPrice, setAlertPrice] = useState("");
  const aiTriggered = useRef(false);
  if (tab === "ai") aiTriggered.current = true;

  const { data: watchlists } = useQuery({
    queryKey: ["watchlists"],
    queryFn: getWatchlists,
    enabled: wlPickerVisible,
  });

  const addToWlMutation = useMutation({
    mutationFn: (watchlistId: string) => addAssetToWatchlist(watchlistId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      setWlPickerVisible(false);
    },
    onError: () => {
      Alert.alert(t("error"), t("somethingWentWrong"));
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: () => createAlert(assetId, alertType, parseFloat(alertPrice)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setAlertModalVisible(false);
      setAlertPrice("");
    },
    onError: () => {
      Alert.alert(t("error"), t("somethingWentWrong"));
    },
  });

  const { data: asset, isLoading: assetLoading } = useQuery({
    queryKey: ["asset", assetId],
    queryFn: () => getAssetById(assetId),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["assetHistory", assetId],
    queryFn: () => getAssetHistory(assetId),
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["aiReport", assetId],
    queryFn: () => getLatestReport(assetId),
    enabled: aiTriggered.current,
  });

  if (assetLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!asset) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{t("assetNotFound")}</Text>
      </View>
    );
  }

  const change = asset.change24h;
  const changeColor = change != null && change >= 0 ? "#22c55e" : "#ef4444";
  const changeText = change != null ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "—";

  const chartData = (history ?? []).map((s) => ({
    time: Math.floor(new Date(s.timestamp).getTime() / 1000),
    value: s.price,
  }));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Price header */}
      <View style={styles.header}>
        <Text style={[styles.price, { color: colors.text }]}>{formatPrice(asset.currentPrice)}</Text>
        <Text style={[styles.change, { color: changeColor }]}>{changeText} (24h)</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, { borderColor: colors.primary }]}
            onPress={() => setWlPickerVisible(true)}
          >
            <Text style={[styles.headerBtnText, { color: colors.primary }]}>{t("addToWatchlist")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { borderColor: colors.primary }]}
            onPress={() => setAlertModalVisible(true)}
          >
            <Text style={[styles.headerBtnText, { color: colors.primary }]}>{t("newAlert")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab selector */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {(["chart", "ai"] as Tab[]).map((tabKey) => (
          <TouchableOpacity
            key={tabKey}
            style={[
              styles.tab,
              { borderBottomColor: tabKey === tab ? colors.primary : "transparent" },
            ]}
            onPress={() => setTab(tabKey)}
          >
            <Text
              style={[
                styles.tabText,
                { color: tabKey === tab ? colors.primary : colors.textSecondary },
              ]}
            >
              {tabKey === "chart" ? t("chartAndStats") : t("aiReport")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "chart" ? (
        <View>
          {/* Chart */}
          {historyLoading ? (
            <ChartSkeleton />
          ) : chartData.length > 1 ? (
            <View style={styles.chart}>
              <LightweightChart
                data={chartData}
                width={screenWidth - 16}
                height={220}
                lineColor={colors.primary}
                areaTopColor={isDark ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.28)"}
                areaBottomColor={isDark ? "rgba(59,130,246,0.02)" : "rgba(59,130,246,0.02)"}
                backgroundColor={colors.background}
                textColor={colors.textSecondary}
                gridColor={colors.border}
              />
            </View>
          ) : (
            <Text style={[styles.noData, { color: colors.textSecondary }]}>{t("noPriceHistory")}</Text>
          )}

          {/* Stats */}
          <View style={styles.stats}>
            <StatRow label={t("rank")} value={asset.rank != null ? `#${asset.rank}` : "—"} colors={colors} />
            <StatRow label={t("marketCap")} value={formatLargeNumber(asset.marketCap)} colors={colors} />
            <StatRow label={t("volume24h")} value={formatLargeNumber(asset.volume24h)} colors={colors} />
            <StatRow label={t("change24hLabel")} value={changeText} colors={colors} />
            <StatRow label={t("type")} value={asset.type} colors={colors} />
          </View>
        </View>
      ) : (
        <View style={styles.reportContainer}>
          {reportLoading ? (
            <ReportSkeleton accentColor={colors.primary} />
          ) : report ? (
            <>
              <View style={styles.reportHeader}>
                <SentimentBadge sentiment={report.sentiment} />
                <Text style={[styles.reportDate, { color: colors.textSecondary }]}>
                  {new Date(report.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </Text>
              </View>
              <Markdown
                value={report.content}
                flatListProps={{
                  scrollEnabled: false,
                  style: { backgroundColor: colors.background },
                }}
                theme={{
                  colors: {
                    text: colors.text,
                    background: colors.background,
                    link: colors.primary,
                    border: colors.border,
                    code: colors.surface,
                  },
                }}
                styles={{
                  h1: { color: colors.text, fontSize: 22, fontWeight: "700", marginBottom: 8 },
                  h2: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 6 },
                  h3: { color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 4 },
                  text: { color: colors.text, fontSize: 14, lineHeight: 22 },
                  paragraph: { marginBottom: 12 },
                  strong: { color: colors.text, fontWeight: "700" },
                  em: { color: colors.textSecondary },
                  li: { color: colors.text, fontSize: 14, lineHeight: 22 },
                  blockquote: {
                    backgroundColor: colors.surface,
                    borderLeftColor: colors.primary,
                    borderLeftWidth: 3,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 4,
                    marginBottom: 12,
                  },
                  code: {
                    backgroundColor: colors.surface,
                    borderRadius: 6,
                    padding: 12,
                    marginBottom: 12,
                  },
                  codespan: { color: colors.primary, backgroundColor: colors.surface, fontSize: 13 },
                  hr: { backgroundColor: colors.border, marginVertical: 16 },
                }}
              />
            </>
          ) : (
            <Text style={[styles.noData, { color: colors.textSecondary }]}>
              {t("noAiReport")}
            </Text>
          )}
        </View>
      )}
      {/* Watchlist picker modal */}
      <Modal visible={wlPickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("addToWatchlist")}</Text>
            {!watchlists || watchlists.length === 0 ? (
              <Text style={[styles.modalEmpty, { color: colors.textSecondary }]}>{t("noWatchlists")}</Text>
            ) : (
              <FlatList
                data={watchlists}
                keyExtractor={(wl) => wl.id}
                style={styles.modalList}
                renderItem={({ item: wl }) => (
                  <TouchableOpacity
                    style={[styles.modalRow, { borderBottomColor: colors.border }]}
                    onPress={() => addToWlMutation.mutate(wl.id)}
                    disabled={addToWlMutation.isPending}
                  >
                    <Text style={[styles.modalRowText, { color: colors.text }]}>{wl.name}</Text>
                    <Text style={[styles.modalRowCount, { color: colors.textSecondary }]}>{wl.assets.length}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              onPress={() => setWlPickerVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.text }]}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create alert modal */}
      <Modal visible={alertModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("newAlert")}</Text>

            <View style={styles.alertTypeRow}>
              {(["ABOVE", "BELOW"] as AlertType[]).map((at) => (
                <TouchableOpacity
                  key={at}
                  style={[
                    styles.alertTypeBtn,
                    { borderColor: colors.border },
                    alertType === at && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setAlertType(at)}
                >
                  <Text
                    style={[
                      styles.alertTypeBtnText,
                      { color: colors.text },
                      alertType === at && { color: "#fff" },
                    ]}
                  >
                    {at === "ABOVE" ? t("priceAbove") : t("priceBelow")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.alertInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              placeholder={t("targetPrice")}
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              value={alertPrice}
              onChangeText={setAlertPrice}
            />

            <View style={styles.alertModalButtons}>
              <TouchableOpacity
                style={[styles.alertModalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => { setAlertModalVisible(false); setAlertPrice(""); }}
              >
                <Text style={[styles.alertModalBtnText, { color: colors.text }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.alertModalBtn,
                  { backgroundColor: colors.primary },
                  (!alertPrice.trim() || isNaN(parseFloat(alertPrice))) && { opacity: 0.5 },
                ]}
                onPress={() => createAlertMutation.mutate()}
                disabled={createAlertMutation.isPending || !alertPrice.trim() || isNaN(parseFloat(alertPrice))}
              >
                {createAlertMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={[styles.alertModalBtnText, { color: "#fff" }]}>{t("create")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { alignItems: "center", paddingVertical: 16 },
  price: { fontSize: 32, fontWeight: "bold" },
  change: { fontSize: 16, fontWeight: "600", marginTop: 4 },
  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: "600" },
  chart: { marginHorizontal: 8, borderRadius: 8, marginTop: 8 },
  noData: { textAlign: "center", padding: 40, fontSize: 14 },
  stats: { paddingHorizontal: 16, paddingTop: 8 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: "600" },
  reportContainer: { padding: 16 },
  reportHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  badge: {},
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700", overflow: "hidden", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  reportDate: { fontSize: 12 },
  headerActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  headerBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  headerBtnText: { fontSize: 13, fontWeight: "600" },
  alertTypeRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  alertTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  alertTypeBtnText: { fontSize: 14, fontWeight: "600" },
  alertInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  alertModalButtons: { flexDirection: "row", gap: 10 },
  alertModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  alertModalBtnText: { fontSize: 15, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "60%",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  modalEmpty: { fontSize: 14, textAlign: "center", paddingVertical: 20 },
  modalList: { maxHeight: 250 },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalRowText: { fontSize: 15, fontWeight: "600" },
  modalRowCount: { fontSize: 13 },
  modalCancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "600" },
});
