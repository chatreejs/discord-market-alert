import { Logger, getLogger } from "log4js";
import moment from "moment-timezone";

import { Configuration } from "@configs";
import { Market } from "@enums";
import { FinancialHoliday } from "@services";

export class TradingDayValidator {
  private readonly logger: Logger;

  private readonly financialHoliday: FinancialHoliday;

  constructor(private readonly configuration: Configuration) {
    this.logger = getLogger("[TradingDayValidator]");
    this.logger.level = configuration.logLevel;

    this.financialHoliday = new FinancialHoliday(configuration);
  }

  async checkTradingDay(market: string): Promise<boolean> {
    let holidayList: string[] = [];
    switch (market) {
      case Market.SET:
        this.logger.info("Checking SET trading day");
        holidayList = await this.financialHoliday.fetchThaiHolidays();
        return this.isSETTradingDay(holidayList);
      case Market.NASDAQ:
        this.logger.info("Checking NASDAQ trading day");
        holidayList = await this.financialHoliday.fetchUSAHolidays();
        return this.isNasdaqTradingDay(holidayList);
      default:
        return false;
    }
  }

  private isSETTradingDay(holidayList: string[]): boolean {
    const now = moment().tz("Asia/Bangkok");
    if (now.day() === 0 || now.day() === 6) {
      return false;
    }
    return !holidayList.includes(now.format("YYYY-MM-DD"));
  }

  private isNasdaqTradingDay(holidayList: string[]): boolean {
    const now = moment().tz("America/New_York");
    if (now.day() === 0 || now.day() === 6) {
      return false;
    }
    return !holidayList.includes(now.format("YYYY-MM-DD"));
  }
}
