import { describe, it, expect } from "vitest";
import { extractSentiment, extractSummary } from "../../services/aiHelpers.js";

describe("extractSentiment", () => {
  it("returns bullish when content contains bullish", () => {
    expect(extractSentiment("The market outlook is bullish for Bitcoin.")).toBe("bullish");
  });

  it("returns bearish when content contains bearish", () => {
    expect(extractSentiment("Analysts predict a bearish trend.")).toBe("bearish");
  });

  it("returns neutral when neither bullish nor bearish", () => {
    expect(extractSentiment("The market is stable with no clear direction.")).toBe("neutral");
  });

  it("is case insensitive", () => {
    expect(extractSentiment("BULLISH momentum detected.")).toBe("bullish");
    expect(extractSentiment("BEARISH signals everywhere.")).toBe("bearish");
  });

  it("prefers bullish when both are present", () => {
    expect(extractSentiment("Despite bearish fears, the trend is bullish.")).toBe("bullish");
  });
});

describe("extractSummary", () => {
  it("returns first 3 sentences", () => {
    const content = "First sentence. Second sentence. Third sentence. Fourth sentence.";
    expect(extractSummary(content)).toBe("First sentence. Second sentence. Third sentence.");
  });

  it("returns all content if less than 3 sentences", () => {
    const content = "Only one sentence.";
    expect(extractSummary(content)).toBe("Only one sentence.");
  });

  it("handles question marks and exclamation marks", () => {
    const content = "Is Bitcoin going up? Yes it is! Third sentence here. Fourth.";
    expect(extractSummary(content)).toBe("Is Bitcoin going up? Yes it is! Third sentence here.");
  });
});
