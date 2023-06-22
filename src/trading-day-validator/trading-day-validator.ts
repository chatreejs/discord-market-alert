import axios from "axios";
import { Logger, getLogger } from "log4js";
import moment from "moment-timezone";
import { Market } from "../common/enums";
import { configuration } from "../config";

export class TradingDayValidator {
  private date: Date;
  private market: string;
  private logger: Logger;

  constructor(date: Date, market: string) {
    this.date = date;
    this.market = market;
    this.logger = getLogger("[TradingDayValidator]");
    this.logger.level = configuration.logLevel;
  }

  async checkTradingDay(): Promise<boolean> {
    let holidayList = [];
    switch (this.market) {
      case Market.SET:
        this.logger.info("Checking SET trading day...");
        holidayList = await this.loadThaiHolidayDate();
        return this.isSETTradingDay(holidayList);
      case Market.NASDAQ:
        this.logger.info("Checking NASDAQ trading day...");
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
    const year = this.date.getFullYear();
    const url = `https://apigw1.bot.or.th/bot/public/financial-institutions-holidays`;
    this.logger.debug(`Call Thai holiday API from ${url}`);

    const response = await axios.get(url, {
      headers: {
        "x-ibm-client-id": configuration.botClientId,
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
