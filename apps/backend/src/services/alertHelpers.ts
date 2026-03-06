export interface AlertCheckInput {
  isActive: boolean;
  isTriggered: boolean;
  targetPrice: number;
  currentPrice: number | null;
}

export function shouldTriggerAlert(alert: AlertCheckInput): boolean {
  return (
    alert.isActive &&
    !alert.isTriggered &&
    alert.currentPrice !== null &&
    alert.currentPrice >= alert.targetPrice
  );
}
