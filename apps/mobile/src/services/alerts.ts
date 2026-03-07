import client from "../api/client";

export type Alert = {
  id: string;
  assetId: string;
  type: "ABOVE" | "BELOW";
  targetPrice: number;
  triggered: boolean;
  createdAt: string;
  asset?: { symbol: string; name: string };
};

export async function getAlerts() {
  const { data } = await client.get<Alert[]>("/alerts");
  return data;
}

export async function getTriggeredAlerts() {
  const { data } = await client.get<Alert[]>("/alerts/triggered");
  return data;
}

export async function createAlert(assetId: string, type: "ABOVE" | "BELOW", targetPrice: number) {
  const { data } = await client.post<Alert>("/alerts", { assetId, type, targetPrice });
  return data;
}

export async function updateAlert(id: string, updates: Partial<Pick<Alert, "type" | "targetPrice">>) {
  const { data } = await client.patch<Alert>(`/alerts/${id}`, updates);
  return data;
}

export async function deleteAlert(id: string) {
  await client.delete(`/alerts/${id}`);
}
