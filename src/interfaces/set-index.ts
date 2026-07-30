export interface SETIndex {
  index: number;
  change: number;
  percentChange: number;
  high: number;
  low: number;
  volume: number;
  value: number;
}

export interface SETIndexListResponse {
  indexIndustrySectors: SETIndexInfo[];
}

export interface SETIndexInfo {
  symbol: string;
  nameEN: string;
  nameTH: string;
  prior: number;
  open: number;
  high: number;
  low: number;
  last: number;
  change: number;
  percentChange: number;
  volume: number;
  value: number;
  querySymbol: string;
  marketStatus: string;
  marketDateTime: string;
  marketName: string;
  industryName: string;
  sectorName: string;
  level: string;
}
