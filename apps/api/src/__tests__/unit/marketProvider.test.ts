import { describe, it, expect, vi, beforeEach } from "vitest";
import { coingeckoProvider } from "../../services/marketProvider.js";

describe("coingeckoProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps CoinGecko response to MarketAsset format", async () => {
    const mockResponse = [
      {
        id: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        image: "https://example.com/btc.png",
        current_price: 95000,
        market_cap: 1800000000000,
        total_volume: 30000000000,
        price_change_percentage_24h: 2.5,
        market_cap_rank: 1,
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const assets = await coingeckoProvider.fetchTopAssets(1);

    expect(assets).toHaveLength(1);
    expect(assets[0]).toEqual({
      id: "bitcoin",
      symbol: "BTC",
      name: "Bitcoin",
      image: "https://example.com/btc.png",
      currentPrice: 95000,
      marketCap: 1800000000000,
      volume24h: 30000000000,
      change24h: 2.5,
      rank: 1,
    });
  });

  it("converts symbol to uppercase", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{
        id: "ethereum", symbol: "eth", name: "Ethereum", image: "",
        current_price: 3200, market_cap: 400000000000, total_volume: 10000000000,
        price_change_percentage_24h: -1.2, market_cap_rank: 2,
      }]),
    } as Response);

    const assets = await coingeckoProvider.fetchTopAssets(1);
    expect(assets[0].symbol).toBe("ETH");
  });

  it("throws on API error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
    } as Response);

    await expect(coingeckoProvider.fetchTopAssets(100)).rejects.toThrow("CoinGecko API error: 429");
  });

  it("passes limit as per_page param", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    await coingeckoProvider.fetchTopAssets(50);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("per_page=50")
    );
  });
});
