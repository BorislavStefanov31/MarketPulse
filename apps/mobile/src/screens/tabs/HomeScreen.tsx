import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { getTop100, type Asset, type SortField, type SortOrder } from "../../services/assets";
import type { MainStackParamList } from "../../navigation/MainStack";
import { useTheme } from "../../contexts/ThemeContext";
import { useLocale } from "../../contexts/LocaleContext";


const SORT_FIELDS: { labelKey: string; field: SortField }[] = [
  { labelKey: "rank", field: "rank" },
  { labelKey: "price", field: "currentPrice" },
  { labelKey: "change24h", field: "change24h" },
  { labelKey: "volume", field: "volume24h" },
];

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toPrecision(4)}`;
}

function formatChange(change: number | null): { text: string; color: string } {
  if (change == null) return { text: "—", color: "#666" };
  const sign = change >= 0 ? "+" : "";
  const color = change >= 0 ? "#22c55e" : "#ef4444";
  return { text: `${sign}${change.toFixed(2)}%`, color };
}

function AssetRow({ item, colors, onPress }: { item: Asset; colors: ReturnType<typeof useTheme>["colors"]; onPress: () => void }) {
  const change = formatChange(item.change24h);
  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.6}>
      <Text style={[styles.rank, { color: colors.textSecondary }]}>{item.rank ?? "—"}</Text>
      <View style={styles.nameCol}>
        <Text style={[styles.symbol, { color: colors.text }]}>{item.symbol}</Text>
        <Text style={[styles.name, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <View style={styles.priceCol}>
        <Text style={[styles.price, { color: colors.text }]}>{formatPrice(item.currentPrice)}</Text>
        <Text style={[styles.change, { color: change.color }]}>{change.text}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [sortIdx, setSortIdx] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const currentField = SORT_FIELDS[sortIdx];

  const handleSortPress = (i: number) => {
    if (i === sortIdx) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortIdx(i);
      setSortOrder(i === 0 ? "asc" : "desc");
    }
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["assets", currentField.field, sortOrder],
    queryFn: ({ pageParam }) =>
      getTop100({
        cursor: pageParam,
        limit: 10,
        sort: currentField.field,
        order: sortOrder,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchOnWindowFocus: true
  });

  const assets = data?.pages.flatMap((p) => p.data) ?? [];

  // Refetch when tab gains focus (skip initial mount)
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );

  // Separate state for pull-to-refresh so background refetch doesn't show spinner
  const [manualRefresh, setManualRefresh] = useState(false);
  const handleRefresh = useCallback(async () => {
    setManualRefresh(true);
    await refetch();
    setManualRefresh(false);
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.sortBar}>
        {SORT_FIELDS.map((opt, i) => (
          <TouchableOpacity
            key={opt.field}
            style={[
              styles.sortChip,
              { borderColor: colors.border },
              i === sortIdx && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => handleSortPress(i)}
          >
            <Text
              style={[
                styles.sortText,
                { color: colors.textSecondary },
                i === sortIdx && { color: "#fff" },
              ]}
            >
              {t(opt.labelKey)}{i === sortIdx ? (sortOrder === "asc" ? " ↑" : " ↓") : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AssetRow
              item={item}
              colors={colors}
              onPress={() => navigation.navigate("AssetDetail", { assetId: item.id, name: item.name })}
            />
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={manualRefresh} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={{ padding: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>{t("noAssetsFound")}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sortBar: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  sortText: { fontSize: 12, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rank: { width: 30, fontSize: 13, fontWeight: "500" },
  nameCol: { flex: 1, marginRight: 8 },
  symbol: { fontSize: 15, fontWeight: "700" },
  name: { fontSize: 12, marginTop: 1 },
  priceCol: { alignItems: "flex-end" },
  price: { fontSize: 15, fontWeight: "600" },
  change: { fontSize: 12, marginTop: 1, fontWeight: "500" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 16 },
});
