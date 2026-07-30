export const Market = {
  SET: "SET",
  NASDAQ: "NASDAQ",
} as const;

export type Market = (typeof Market)[keyof typeof Market];
