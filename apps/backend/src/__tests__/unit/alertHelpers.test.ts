import { describe, it, expect } from "vitest";
import { shouldTriggerAlert } from "../../services/alertHelpers.js";

describe("shouldTriggerAlert", () => {
  it("triggers ABOVE when price reaches target", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: false, type: "ABOVE", targetPrice: 100, currentPrice: 100,
    })).toBe(true);
  });

  it("triggers ABOVE when price exceeds target", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: false, type: "ABOVE", targetPrice: 100, currentPrice: 150,
    })).toBe(true);
  });

  it("does not trigger ABOVE when price is below target", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: false, type: "ABOVE", targetPrice: 100, currentPrice: 99,
    })).toBe(false);
  });

  it("triggers BELOW when price drops to target", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: false, type: "BELOW", targetPrice: 100, currentPrice: 100,
    })).toBe(true);
  });

  it("triggers BELOW when price drops below target", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: false, type: "BELOW", targetPrice: 100, currentPrice: 80,
    })).toBe(true);
  });

  it("does not trigger BELOW when price is above target", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: false, type: "BELOW", targetPrice: 100, currentPrice: 150,
    })).toBe(false);
  });

  it("does not trigger when alert is inactive", () => {
    expect(shouldTriggerAlert({
      isActive: false, isTriggered: false, type: "ABOVE", targetPrice: 100, currentPrice: 200,
    })).toBe(false);
  });

  it("does not trigger when already triggered", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: true, type: "ABOVE", targetPrice: 100, currentPrice: 200,
    })).toBe(false);
  });

  it("does not trigger when currentPrice is null", () => {
    expect(shouldTriggerAlert({
      isActive: true, isTriggered: false, type: "ABOVE", targetPrice: 100, currentPrice: null,
    })).toBe(false);
  });
});
