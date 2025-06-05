import { NASDAQIndex, SETIndex } from "@interfaces";
import { getLogger, Logger } from "log4js";

export abstract class MarketData {
  protected readonly logger: Logger;

  constructor(logName: string = "[MarketData]", logLevel: string = "info") {
    this.logger = getLogger(logName);
    this.logger.level = logLevel;
  }
  abstract getSETIndexMarketData(): Promise<SETIndex>;
  abstract getNASDAQIndexMarketData(): Promise<NASDAQIndex>;
}
