import { Router } from "express";
import OpenAI from "openai";
import { prisma } from "../prisma.js";
import { authenticate } from "../middlewares/auth.js";
import { validateUUID } from "../middlewares/validateUUID.js";
import { env } from "../config.js";
import { cache } from "../services/cache.js";
import { extractSentiment, extractSummary } from "../services/aiHelpers.js";

const router = Router();
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

router.use(authenticate);

router.get("/report/:assetId/latest", validateUUID("assetId"), async (req, res) => {
  const assetId = req.params.assetId as string;

  // Check cache first
  const cacheKey = cache.keys.aiReport(assetId);
  const cached = await cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  // Check DB for today's report
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.aIReport.findFirst({
    where: { assetId, createdAt: { gte: startOfDay } },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await cache.set(cacheKey, existing);
    res.json(existing);
    return;
  }

  // No report for today — generate one
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  const response = await openai.responses.create({
    model: "gpt-5.2",
    tools: [{ type: "web_search_preview" }],
    instructions: `You are a financial analyst. The user will give you an asset name and symbol.
Search the web for the latest news and market data about this asset.
Then provide a detailed analysis with:
1. A short summary (2-3 sentences)
2. Recent news and events affecting the price
3. Technical and fundamental analysis
4. Your sentiment (bullish, bearish, or neutral)
5. Price prediction reasoning

Be specific with data and sources. Write in a professional but accessible tone.`,
    input: `Analyze ${asset.name} (${asset.symbol}). Current price: $${asset.currentPrice}. Market cap: $${asset.marketCap}. 24h change: ${asset.change24h}%.`,
  });

  const content = response.output_text;
  const sentiment = extractSentiment(content);
  const summary = extractSummary(content);

  const report = await prisma.aIReport.create({
    data: { assetId, summary, content, sentiment },
  });

  // Cache the new report (no TTL — stays until next report is generated)
  await cache.set(cacheKey, report);

  await prisma.auditLog.create({
    data: { userId: req.userId, action: "AI_REPORT_GENERATED", entity: "AIReport", entityId: report.id },
  });

  res.json(report);
});

router.get("/report/:assetId/history", validateUUID("assetId"), async (req, res) => {
  const reports = await prisma.aIReport.findMany({
    where: { assetId: req.params.assetId as string },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  res.json(reports);
});

export default router;
