import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { getTriggeredAlerts } from "../services/alerts";
import { useToast } from "../components/Toast";
import { useLocale } from "../contexts/LocaleContext";

const POLL_INTERVAL = 1 * 60 * 1000; // 1 minute

export function useAlertPoller() {
  const { showToast } = useToast();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep latest refs so the interval callback always uses current values
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const tRef = useRef(t);
  tRef.current = t;

  const checkAlerts = useCallback(async () => {
    try {
      const triggered = await getTriggeredAlerts();
      if (triggered.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
        for (const alert of triggered) {
          const price = alert.asset.currentPrice?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) ?? "—";
          const msg =
            alert.type === "ABOVE"
              ? tRef.current("alertAboveMsg", { symbol: alert.asset.symbol, price })
              : tRef.current("alertBelowMsg", { symbol: alert.asset.symbol, price });
          showToastRef.current(tRef.current("alertTriggered"), msg, "alert");
        }
      }
    } catch {
      // silently ignore polling errors
    }
  }, [queryClient]);

  useEffect(() => {
    // Check immediately on mount
    checkAlerts();

    // Poll every 5 minutes
    intervalRef.current = setInterval(checkAlerts, POLL_INTERVAL);

    // Pause when app goes to background, resume when foreground
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkAlerts();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(checkAlerts, POLL_INTERVAL);
        }
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      subscription.remove();
    };
  }, [checkAlerts]);
}
