import { describe, it, expect } from "vitest";
import { shouldTriggerAlert } from "../../services/alertHelpers.js";

describe("shouldTriggerAlert", () => {
  it("triggers when price reaches target", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: false, targetPrice: 100, currentPrice: 100,
    })).toBe(true);
  });

  it("triggers when price exceeds target", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: false, targetPrice: 100, currentPrice: 150,
    })).toBe(true);
  });

  it("does not trigger when price is below target", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: false, targetPrice: 100, currentPrice: 99,
    })).toBe(false);
  });

  it("does not trigger when alert is inactive", () => {
    expect(shouldTriggerAlert({
      isActive: false, isTriggered: false, targetPrice: 100, currentPrice: 200,
    })).toBe(false);
  });

  it("does not trigger when already triggered", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: true, targetPrice: 100, currentPrice: 200,
    })).toBe(false);
  });

  it("does not trigger when currentPrice is null", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: false, targetPrice: 100, currentPrice: null,
    })).toBe(false);
  });
});
