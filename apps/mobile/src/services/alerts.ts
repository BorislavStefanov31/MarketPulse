import client from "../api/client";
import type { Asset } from "./assets";

export type AlertType = "ABOVE" | "BELOW";

export type Alert = {
  id: string;
  assetId: string;
  type: AlertType;
  targetPrice: number;
  isTriggered: boolean;
  isActive: boolean;
  triggeredAt: string | null;
  createdAt: string;
  asset: Asset;
};

export async function getAlerts() {
  const { data } = await client.get<Alert[]>("/alerts");
  return data;
}

export async function getTriggeredAlerts() {
  const { data } = await client.get<Alert[]>("/alerts/triggered");
  return data;
}

export async function createAlert(assetId: string, type: AlertType, targetPrice: number) {
  const { data } = await client.post<Alert>("/alerts", { assetId, type, targetPrice });
  return data;
}

export async function toggleAlert(id: string, isActive: boolean) {
  const { data } = await client.patch<Alert>(`/alerts/${id}`, { isActive });
  return data;
}

export async function deleteAlert(id: string) {
  await client.delete(`/alerts/${id}`);
}
