import axios from "axios";
import { Logger, getLogger } from "log4js";
import moment from "moment-timezone";

import { Configuration } from "@configs";
import { Market } from "@enums";

export class TradingDayValidator {
  private readonly logger: Logger;

  constructor(private readonly configuration: Configuration) {
    this.logger = getLogger("[TradingDayValidator]");
    this.logger.level = configuration.logLevel;
  }

  async checkTradingDay(market: string): Promise<boolean> {
    let holidayList: string[] = [];
    switch (market) {
      case Market.SET:
        this.logger.info("Checking SET trading day");
        holidayList = await this.loadThaiHolidayDate();
        return this.isSETTradingDay(holidayList);
      case Market.NASDAQ:
        this.logger.info("Checking NASDAQ trading day");
        holidayList = [];
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
    return true;
  }

  private async loadThaiHolidayDate(): Promise<string[]> {
    const date = moment().tz("Asia/Bangkok");
    const year = date.year();
    const url = `https://apigw1.bot.or.th/bot/public/financial-institutions-holidays`;
    this.logger.debug(`Call Thai holiday API from ${url}`);

    const response = await axios.get(url, {
      headers: {
        "x-ibm-client-id": this.configuration.botClientId,
        accept: "application/json",
      },
      params: {
        year,
      },
    });
    if (response.status === 200) {
      const holidayList = response.data.result.data.map(
        (holiday) => holiday.Date
      );
      this.logger.debug(`Found ${holidayList.length} Thai holidays.`);
      this.logger.debug(`Thai holidays: ${holidayList}`);
      return holidayList;
    }
    return [];
  }
}
