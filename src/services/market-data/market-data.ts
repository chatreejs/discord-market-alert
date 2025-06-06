import { getLogger, Logger } from "log4js";

import { Configuration } from "@configs";
import { NASDAQIndex, SETIndex } from "@interfaces";

export abstract class MarketData {
  protected readonly logger: Logger;

  constructor(
    protected readonly configuration: Configuration,
    logName: string = "[MarketData]"
  ) {
    this.logger = getLogger(logName);
    this.logger.level = configuration.logLevel;
  }
  abstract getSETIndexMarketData(): Promise<SETIndex>;
  abstract getNASDAQIndexMarketData(): Promise<NASDAQIndex>;
}
