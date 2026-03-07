import client from "../api/client";

export type Watchlist = {
  id: string;
  name: string;
  createdAt: string;
  assets?: Array<{ id: string; symbol: string; name: string; priceUsd: string; changePercent24Hr: string }>;
};

export async function getWatchlists() {
  const { data } = await client.get<Watchlist[]>("/watchlists");
  return data;
}

export async function createWatchlist(name: string) {
  const { data } = await client.post<Watchlist>("/watchlists", { name });
  return data;
}

export async function updateWatchlist(id: string, name: string) {
  const { data } = await client.patch<Watchlist>(`/watchlists/${id}`, { name });
  return data;
}

export async function deleteWatchlist(id: string) {
  await client.delete(`/watchlists/${id}`);
}

export async function addAssetToWatchlist(watchlistId: string, assetId: string) {
  await client.post(`/watchlists/${watchlistId}/assets`, { assetId });
}

export async function removeAssetFromWatchlist(watchlistId: string, assetId: string) {
  await client.delete(`/watchlists/${watchlistId}/assets/${assetId}`);
}
