import client from "../api/client";

export type Asset = {
  id: string;
  symbol: string;
  name: string;
  slug: string;
  rank: number;
  priceUsd: string;
  changePercent24Hr: string;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  supply: string;
  maxSupply: string | null;
  updatedAt: string;
};

type PaginatedResponse = {
  data: Asset[];
  nextCursor: string | null;
};

export async function getTop100(cursor?: string, limit = 20) {
  const params: Record<string, string | number> = { limit };
  if (cursor) params.cursor = cursor;
  const { data } = await client.get<PaginatedResponse>("/assets/top100", { params });
  return data;
}

export async function getAssetById(id: string) {
  const { data } = await client.get<Asset>(`/assets/${id}`);
  return data;
}

type PricePoint = {
  priceUsd: string;
  timestamp: string;
};

export async function getAssetHistory(id: string) {
  const { data } = await client.get<PricePoint[]>(`/assets/${id}/history`);
  return data;
}
