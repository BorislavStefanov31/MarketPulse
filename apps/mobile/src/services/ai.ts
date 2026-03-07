import client from "../api/client";

export type AiReport = {
  id: string;
  assetId: string;
  report: string;
  createdAt: string;
};

export async function getLatestReport(assetId: string) {
  const { data } = await client.get<AiReport>(`/ai/report/${assetId}/latest`);
  return data;
}

export async function getReportHistory(assetId: string) {
  const { data } = await client.get<AiReport[]>(`/ai/report/${assetId}/history`);
  return data;
}
