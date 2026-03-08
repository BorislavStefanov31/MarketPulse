import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../contexts/ThemeContext";
import { useLocale } from "../../contexts/LocaleContext";
import { useToast } from "../../components/Toast";
import {
  getWatchlists,
  createWatchlist,
  deleteWatchlist,
  removeAssetFromWatchlist,
  type Watchlist,
  type WatchlistAsset,
} from "../../services/watchlists";
import type { MainStackParamList } from "../../navigation/MainStack";
import Skeleton from "../../components/Skeleton";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

function WatchlistSkeleton({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={styles.list}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.watchlistCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.watchlistHeader}>
            <View style={styles.watchlistTitleRow}>
              <Skeleton width={120} height={18} />
              <Skeleton width={24} height={18} borderRadius={10} />
            </View>
            <Skeleton width={12} height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

function SwipeableAssetRow({
  wa,
  colors,
  onPress,
  onRemove,
}: {
  wa: WatchlistAsset;
  colors: ReturnType<typeof useTheme>["colors"];
  onPress: () => void;
  onRemove: () => void;
}) {
  const asset = wa.asset;
  const change = formatChange(asset.change24h);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const toggleSwipe = () => {
    const toValue = swiped ? 0 : -72;
    Animated.spring(slideAnim, { toValue, useNativeDriver: true, friction: 9 }).start();
    setSwiped(!swiped);
  };

  const handleRemove = () => {
    Animated.timing(slideAnim, { toValue: -400, duration: 250, useNativeDriver: true }).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onRemove();
    });
  };

  return (
    <View style={[styles.swipeContainer, { borderBottomColor: colors.border }]}>
      {/* Delete action behind */}
      <View style={styles.swipeAction}>
        <TouchableOpacity style={styles.swipeDeleteBtn} onPress={handleRemove} activeOpacity={0.7}>
          <Text style={styles.swipeDeleteText}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Foreground row */}
      <Animated.View style={[styles.assetRowAnimated, { backgroundColor: colors.surface, transform: [{ translateX: slideAnim }] }]}>
        <TouchableOpacity
          style={styles.assetRow}
          activeOpacity={0.6}
          onPress={swiped ? toggleSwipe : onPress}
          onLongPress={toggleSwipe}
          delayLongPress={300}
        >
          <View style={styles.assetRankBadge}>
            <Text style={[styles.assetRankText, { color: colors.textSecondary }]}>
              {asset.rank ?? "—"}
            </Text>
          </View>
          <View style={styles.assetInfo}>
            <Text style={[styles.assetSymbol, { color: colors.text }]}>{asset.symbol}</Text>
            <Text style={[styles.assetName, { color: colors.textSecondary }]} numberOfLines={1}>
              {asset.name}
            </Text>
          </View>
          <View style={styles.assetPrice}>
            <Text style={[styles.priceText, { color: colors.text }]}>{formatPrice(asset.currentPrice)}</Text>
            <Text style={[styles.changeText, { color: change.color }]}>{change.text}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function WatchlistScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const { showToast } = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fabScale = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0.85)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const { data: watchlists, isLoading } = useQuery({
    queryKey: ["watchlists"],
    queryFn: getWatchlists,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createWatchlist(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
      closeModal();
      showToast(t("watchlistCreated"), "");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWatchlist(id),
    onSuccess: () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    },
  });

  const removeAssetMutation = useMutation({
    mutationFn: ({ watchlistId, assetId }: { watchlistId: string; assetId: string }) =>
      removeAssetFromWatchlist(watchlistId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlists"] });
    },
  });

  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, friction: 8 }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalScale, { toValue: 0.85, duration: 150, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      setNewName("");
      modalScale.setValue(0.85);
      modalOpacity.setValue(0);
    });
  };

  const handleCreate = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  }, [newName, createMutation]);

  const handleDelete = useCallback(
    (wl: Watchlist) => {
      Alert.alert(t("deleteWatchlist"), t("deleteWatchlistConfirm", { name: wl.name }), [
        { text: t("cancel"), style: "cancel" },
        { text: t("delete"), style: "destructive", onPress: () => deleteMutation.mutate(wl.id) },
      ]);
    },
    [t, deleteMutation],
  );

  const handleRemoveAsset = useCallback(
    (watchlistId: string, assetId: string) => {
      removeAssetMutation.mutate({ watchlistId, assetId });
    },
    [removeAssetMutation],
  );

  const toggleExpand = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleFabPressIn = () => {
    Animated.spring(fabScale, { toValue: 0.85, useNativeDriver: true, friction: 5 }).start();
  };

  const handleFabPressOut = () => {
    Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };

  const renderWatchlist = useCallback(
    ({ item }: { item: Watchlist }) => {
      const isExpanded = expandedId === item.id;
      return (
        <View style={[styles.watchlistCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.watchlistHeader}
            onPress={() => toggleExpand(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.watchlistTitleRow}>
              <Text style={[styles.watchlistName, { color: colors.text }]}>{item.name}</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                  {item.assets.length}
                </Text>
              </View>
            </View>
            <View style={styles.watchlistActions}>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.deleteBtn, { backgroundColor: "#ef444415" }]}
              >
                <Text style={styles.deleteBtnText}>×</Text>
              </TouchableOpacity>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>
                {isExpanded ? "▲" : "▼"}
              </Text>
            </View>
          </TouchableOpacity>

          {isExpanded && (
            <View style={[styles.assetsList, { borderTopColor: colors.border }]}>
              {item.assets.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t("emptyWatchlist")}
                </Text>
              ) : (
                item.assets.map((wa) => (
                  <SwipeableAssetRow
                    key={wa.id}
                    wa={wa}
                    colors={colors}
                    onPress={() => navigation.navigate("AssetDetail", { assetId: wa.asset.id, name: wa.asset.name })}
                    onRemove={() => handleRemoveAsset(item.id, wa.asset.id)}
                  />
                ))
              )}
            </View>
          )}
        </View>
      );
    },
    [expandedId, colors, t, handleDelete, toggleExpand, navigation, handleRemoveAsset],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <WatchlistSkeleton colors={colors} />
      ) : (
        <FlatList
          data={watchlists}
          keyExtractor={(item) => item.id}
          renderItem={renderWatchlist}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>☆</Text>
              <Text style={[styles.noWatchlists, { color: colors.textSecondary }]}>
                {t("noWatchlists")}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <Animated.View style={[styles.fab, { backgroundColor: colors.primary, transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fabTouchable}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          onPress={openModal}
          activeOpacity={1}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Create modal */}
      <Modal visible={modalVisible} transparent animationType="none">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("newWatchlist")}</Text>
              <TextInput
                style={[styles.modalInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                placeholder={t("watchlistName")}
                placeholderTextColor={colors.textSecondary}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                  onPress={closeModal}
                >
                  <Text style={[styles.modalBtnText, { color: colors.text }]}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }, !newName.trim() && styles.modalBtnDisabled]}
                  onPress={handleCreate}
                  disabled={createMutation.isPending || !newName.trim()}
                >
                  {createMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={[styles.modalBtnText, { color: "#fff" }]}>{t("create")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 12, paddingBottom: 80 },
  watchlistCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  watchlistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  watchlistTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  watchlistName: { fontSize: 17, fontWeight: "700" },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: { fontSize: 13, fontWeight: "700" },
  watchlistActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: { color: "#ef4444", fontSize: 18, fontWeight: "600", marginTop: -1 },
  chevron: { fontSize: 11 },
  assetsList: { borderTopWidth: StyleSheet.hairlineWidth },

  // Swipeable row
  swipeContainer: {
    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  swipeAction: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  swipeDeleteBtn: {
    backgroundColor: "#ef4444",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeDeleteText: { color: "#fff", fontSize: 22, fontWeight: "500", marginTop: -1 },
  assetRowAnimated: {
    // sits on top of swipeAction
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assetRankBadge: {
    width: 28,
    alignItems: "center",
    marginRight: 8,
  },
  assetRankText: { fontSize: 12, fontWeight: "600" },
  assetInfo: { flex: 1, marginRight: 8 },
  assetSymbol: { fontSize: 15, fontWeight: "700" },
  assetName: { fontSize: 11, marginTop: 2 },
  assetPrice: { alignItems: "flex-end" },
  priceText: { fontSize: 15, fontWeight: "600" },
  changeText: { fontSize: 12, marginTop: 2, fontWeight: "600" },
  emptyText: { textAlign: "center", padding: 24, fontSize: 14 },

  // Empty state
  emptyState: { alignItems: "center", marginTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  noWatchlists: { textAlign: "center", fontSize: 15, lineHeight: 22 },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
  },
  fabTouchable: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: { color: "#fff", fontSize: 30, fontWeight: "300", marginTop: -1 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", gap: 10 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnDisabled: { opacity: 0.5 },
  modalBtnText: { fontSize: 16, fontWeight: "600" },
});
