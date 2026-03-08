import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { getTriggeredAlerts } from "../services/alerts";
import { useToast } from "../components/Toast";
import { useLocale } from "../contexts/LocaleContext";

const SOCKET_URL = __DEV__
  ? "http://localhost:3001"
  : "https://ws.marketpulse.app";

export function useSocket() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useLocale();
  const socketRef = useRef<Socket | null>(null);

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token || cancelled) return;

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 3000,
      });

      socket.on("prices:update", async () => {
        queryClient.invalidateQueries({ queryKey: ["assets"] });
        queryClient.invalidateQueries({ queryKey: ["asset"] });
        queryClient.invalidateQueries({ queryKey: ["assetHistory"] });
        queryClient.invalidateQueries({ queryKey: ["watchlists"] });

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
        }
      });

      socket.on("connect", () => {
        console.log("[Socket] Connected");
      });

      socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
      });

      socketRef.current = socket;
    }

    connect();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);
}
