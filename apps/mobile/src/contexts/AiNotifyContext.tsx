import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../components/Toast";
import { useLocale } from "./LocaleContext";

type PendingRequest = { assetId: string; symbol: string };

type AiNotifyContextType = {
  requestNotify: (assetId: string, symbol: string) => void;
  isPending: (assetId: string) => boolean;
};

const AiNotifyContext = createContext<AiNotifyContextType>({
  requestNotify: () => {},
  isPending: () => false,
});

export function useAiNotify() {
  return useContext(AiNotifyContext);
}

export function AiNotifyProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const { showToast } = useToast();
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;
  const tRef = useRef(t);
  tRef.current = t;

  const requestNotify = useCallback((assetId: string, symbol: string) => {
    setPending((prev) => {
      if (prev.some((p) => p.assetId === assetId)) return prev;
      return [...prev, { assetId, symbol }];
    });
  }, []);

  const isPending = useCallback(
    (assetId: string) => pending.some((p) => p.assetId === assetId),
    [pending],
  );

  // Subscribe to query cache changes to detect when AI reports land
  useEffect(() => {
    if (pending.length === 0) return;

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "success") return;

      const current = pendingRef.current;
      if (current.length === 0) return;

      const key = event.query.queryKey;
      if (!Array.isArray(key) || key[0] !== "aiReport") return;

      const assetId = key[1] as string;
      const match = current.find((p) => p.assetId === assetId);
      if (!match) return;

      showToastRef.current(
        tRef.current("aiReportReady"),
        tRef.current("aiReportReadyMsg", { symbol: match.symbol }),
      );
      setPending((prev) => prev.filter((p) => p.assetId !== assetId));
    });

    return unsubscribe;
  }, [pending.length > 0, queryClient]);

  return (
    <AiNotifyContext.Provider value={{ requestNotify, isPending }}>
      {children}
    </AiNotifyContext.Provider>
  );
}
