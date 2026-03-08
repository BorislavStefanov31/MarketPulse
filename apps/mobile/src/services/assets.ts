import client from "../api/client";

export type Asset = {
  id: string;
  symbol: string;
  name: string;
  type: string;
  image: string | null;
  currentPrice: number | null;
  marketCap: number | null;
  volume24h: number | null;
  change24h: number | null;
  rank: number | null;
  updatedAt: string;
};

export type SortField = "rank" | "marketCap" | "volume24h" | "change24h" | "currentPrice";
export type SortOrder = "asc" | "desc";

type PaginatedResponse = {
  data: Asset[];
  nextCursor: string | null;
  hasNext: boolean;
};

export async function getTop100(options: {
  cursor?: string;
  limit?: number;
  sort?: SortField;
  order?: SortOrder;
}) {
  const params: Record<string, string | number> = { limit: options.limit ?? 10 };
  if (options.cursor) params.cursor = options.cursor;
  if (options.sort) params.sort = options.sort;
  if (options.order) params.order = options.order;
  const { data } = await client.get<PaginatedResponse>("/assets/top100", { params });
  return data;
}

export async function getAssetById(id: string) {
  const { data } = await client.get<Asset>(`/assets/${id}`);
  return data;
}

export type AssetSnapshot = {
  id: string;
  price: number;
  marketCap: number | null;
  volume: number | null;
  change24h: number | null;
  timestamp: string;
};

export async function getAssetHistory(id: string, days = 7) {
  const { data } = await client.get<AssetSnapshot[]>(`/assets/${id}/history`, {
    params: { days },
  });
  return data;
}
