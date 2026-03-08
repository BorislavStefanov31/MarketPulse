export interface AlertCheckInput {
  isActive: boolean;
  isTriggered: boolean;
  type: "ABOVE" | "BELOW";
  targetPrice: number;
  currentPrice: number | null;
}

export function shouldTriggerAlert(alert: AlertCheckInput): boolean {
  if (!alert.isActive || alert.isTriggered || alert.currentPrice === null) {
    return false;
  }

  if (alert.type === "ABOVE") {
    return alert.currentPrice >= alert.targetPrice;
  }

  return alert.currentPrice <= alert.targetPrice;
}
