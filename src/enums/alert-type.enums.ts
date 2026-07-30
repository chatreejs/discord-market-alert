export const AlertType = {
  MARKET_OPEN: "MARKET_OPEN",
  MARKET_BRIEFING: "MARKET_BRIEFING",
} as const;

export type AlertType = (typeof AlertType)[keyof typeof AlertType];
