import axios from "axios";
import { getLogger, Logger } from "log4js";
import moment from "moment";

import { Configuration } from "@configs";

export class FinancialHoliday {
  private readonly logger: Logger;

  constructor(private readonly configuration: Configuration) {
    this.logger = getLogger("[FinancialHoliday]");
    this.logger.level = configuration.logLevel;
  }

  async fetchThaiHolidays(): Promise<string[]> {
    const date = moment().tz("Asia/Bangkok");
    const year = date.year();
    const url = `https://gateway.api.bot.or.th/financial-institutions-holidays/`;
    this.logger.debug(`Call Thai holiday API from ${url}`);

    const response = await axios.get(url, {
      headers: {
        Authorization: this.configuration.botApiToken,
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

  async fetchUSAHolidays(): Promise<string[]> {
    const date = moment().tz("America/New_York");
    const year = date.year();
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/US`;
    this.logger.debug(`Call USA holiday API from ${url}`);

    const response = await axios.get(url, {
      headers: {
        accept: "application/json",
      },
    });

    if (response.status === 200) {
      const holidayList = response.data.map((holiday) => holiday.date);
      this.logger.debug(`Found ${holidayList.length} USA holidays.`);
      this.logger.debug(`USA holidays: ${holidayList}`);
      return holidayList;
    }
    return [];
  }
}
