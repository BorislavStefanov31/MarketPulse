import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

type ToastType = "success" | "error" | "alert";

type ToastItem = {
  id: number;
  title: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (title: string, message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICON_MAP: Record<ToastType, { name: keyof typeof Ionicons.glyphMap; bg: string; accent: string }> = {
  success: { name: "checkmark-circle", bg: "rgba(34,197,94,0.12)", accent: "#22c55e" },
  error: { name: "close-circle", bg: "rgba(239,68,68,0.12)", accent: "#ef4444" },
  alert: { name: "notifications", bg: "rgba(245,158,11,0.12)", accent: "#f59e0b" },
};

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 10, tension: 80 }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -80, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.9, duration: 300, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const { name: iconName, bg: iconBg, accent } = ICON_MAP[item.type];
  const hasMessage = item.message.length > 0;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.card,
          borderLeftColor: accent,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity style={styles.toastContent} onPress={onDismiss} activeOpacity={0.7}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={20} color={accent} />
        </View>
        <View style={styles.toastText}>
          <Text style={[styles.toastTitle, { color: colors.text }]}>{item.title}</Text>
          {hasMessage && (
            <Text style={[styles.toastMessage, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.message}
            </Text>
          )}
        </View>
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((title: string, message: string, type: ToastType = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, title, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={[styles.container, { top: insets.top + (Platform.OS === "ios" ? 4 : 8) }]} pointerEvents="box-none">
        {toasts.map((t) => (
          <ToastView key={t.id} item={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toastText: { flex: 1 },
  toastTitle: { fontSize: 15, fontWeight: "700" },
  toastMessage: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});
