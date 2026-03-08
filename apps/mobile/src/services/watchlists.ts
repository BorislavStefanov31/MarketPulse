import client from "../api/client";
import type { Asset } from "./assets";

export type WatchlistAsset = {
  id: string;
  assetId: string;
  sortOrder: number;
  addedAt: string;
  asset: Asset;
};

export type Watchlist = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  assets: WatchlistAsset[];
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
  const { data } = await client.post<WatchlistAsset>(`/watchlists/${watchlistId}/assets`, { assetId });
  return data;
}

export async function removeAssetFromWatchlist(watchlistId: string, assetId: string) {
  await client.delete(`/watchlists/${watchlistId}/assets/${assetId}`);
}
