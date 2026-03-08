import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

type Props = {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
};

export default function Skeleton({ width, height, borderRadius = 6, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, opacity, backgroundColor: "#94a3b8" },
        style,
      ]}
    />
  );
}

export function SkeletonGroup({ color, children }: { color: string; children: React.ReactNode }) {
  return <View>{children}</View>;
}

export function ReportSkeleton({ accentColor }: { accentColor: string }) {
  return (
    <View style={skStyles.container}>
      {/* Card skeleton */}
      <View style={skStyles.card}>
        <View style={skStyles.cardHeader}>
          <Skeleton width={80} height={24} borderRadius={12} />
          <Skeleton width={120} height={14} />
        </View>
        <View style={skStyles.cardBody}>
          <Skeleton width="100%" height={14} />
          <Skeleton width="85%" height={14} />
        </View>
      </View>

      {/* Content skeleton */}
      <View style={skStyles.content}>
        <Skeleton width="60%" height={20} borderRadius={4} />
        <View style={{ height: 12 }} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="75%" height={14} />
        <View style={{ height: 16 }} />
        <Skeleton width="50%" height={18} borderRadius={4} />
        <View style={{ height: 10 }} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="90%" height={14} />
        <Skeleton width="60%" height={14} />
        <View style={{ height: 16 }} />
        <Skeleton width="55%" height={18} borderRadius={4} />
        <View style={{ height: 10 }} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="95%" height={14} />
        <Skeleton width="80%" height={14} />
      </View>
    </View>
  );
}

export function ChartSkeleton() {
  return (
    <View style={skStyles.chartContainer}>
      <Skeleton width="100%" height={220} borderRadius={8} />
      <View style={skStyles.statsContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={skStyles.statRow}>
            <Skeleton width={80} height={14} />
            <Skeleton width={100} height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

const skStyles = StyleSheet.create({
  container: { padding: 16 },
  card: { padding: 16, borderRadius: 12, marginBottom: 16, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardBody: { gap: 8 },
  content: { gap: 6 },
  chartContainer: { paddingHorizontal: 8, paddingTop: 8 },
  statsContainer: { paddingHorizontal: 8, paddingTop: 16 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
});
