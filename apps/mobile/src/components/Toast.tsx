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

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onDismiss());
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const bgColor =
    item.type === "alert" ? "#f59e0b" : item.type === "error" ? "#ef4444" : "#22c55e";
  const icon = item.type === "alert" ? "🔔" : item.type === "error" ? "✕" : "✓";

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bgColor, transform: [{ translateY }], opacity }]}>
      <TouchableOpacity style={styles.toastContent} onPress={onDismiss} activeOpacity={0.8}>
        <Text style={styles.toastIcon}>{icon}</Text>
        <View style={styles.toastText}>
          <Text style={styles.toastTitle}>{item.title}</Text>
          <Text style={styles.toastMessage} numberOfLines={2}>{item.message}</Text>
        </View>
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
    left: 12,
    right: 12,
    zIndex: 9999,
    gap: 6,
  },
  toast: {
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  toastIcon: { fontSize: 20 },
  toastText: { flex: 1 },
  toastTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  toastMessage: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 2 },
});
