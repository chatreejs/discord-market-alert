import log4js, { type Logger } from "log4js";
const { getLogger } = log4js;

import type { Configuration } from "#configs";
import type { NASDAQIndex, SETIndex } from "#interfaces";

export abstract class MarketData {
  protected readonly logger: Logger;
  protected readonly configuration: Configuration;

  constructor(configuration: Configuration, logName: string = "[MarketData]") {
    this.configuration = configuration;
    this.logger = getLogger(logName);
    this.logger.level = configuration.logLevel;
  }
  abstract getSETIndexMarketData(): Promise<SETIndex>;
  abstract getNASDAQIndexMarketData(): Promise<NASDAQIndex>;
}
