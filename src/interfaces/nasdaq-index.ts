export interface NASDAQIndex {
  index: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
}

export interface NASDAQIndexResponse {
  data: NASDAQIndexData;
  message: string | null;
  status: ResponseStatus;
}

export interface NASDAQIndexData {
  symbol: string;
  companyName: string;
  stockType: string;
  exchange: string;
  isNasdaqListed: boolean;
  isNasdaq100: boolean;
  isHeld: boolean;
  primaryData: PrimaryData;
  secondaryData: any | null;
  marketStatus: string;
  assetClass: string;
  keyStats: KeyStats;
  notifications: any | null;
}

export interface PrimaryData {
  lastSalePrice: string;
  netChange: string;
  percentageChange: string;
  deltaIndicator: string;
  lastTradeTimestamp: string;
  isRealTime: boolean;
  bidPrice: string;
  askPrice: string;
  bidSize: string;
  askSize: string;
  volume: string;
  currency: string | null;
}

export interface KeyStats {
  previousclose: StatItem;
  dayrange: StatItem;
}

export interface StatItem {
  label: string;
  value: string;
}

export interface ResponseStatus {
  rCode: number;
  bCodeMessage: string | null;
  developerMessage: string | null;
}
