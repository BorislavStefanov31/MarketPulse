export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  rank: number;
}

export interface MarketProvider {
  fetchTopAssets(limit: number): Promise<MarketAsset[]>;
}

const COINGECKO_URL = "https://api.coingecko.com/api/v3";

export const coingeckoProvider: MarketProvider = {
  async fetchTopAssets(limit: number): Promise<MarketAsset[]> {
    const res = await fetch(
      `${COINGECKO_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1`
    );

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const coins = await res.json();

    return coins.map((coin: Record<string, unknown>) => ({
      id: coin.id as string,
      symbol: (coin.symbol as string).toUpperCase(),
      name: coin.name as string,
      image: coin.image as string,
      currentPrice: coin.current_price as number,
      marketCap: coin.market_cap as number,
      volume24h: coin.total_volume as number,
      change24h: coin.price_change_percentage_24h as number,
      rank: coin.market_cap_rank as number,
    }));
  },
};
