import { Logger, getLogger } from "log4js";
import { Market } from "../common/enums";
import puppeteer from "puppeteer";
import { monthTHToMonth } from "../common/utils";
import moment from "moment-timezone";
import { configuration } from "../config";

export class HolidayValidator {
  private date: Date;
  private market: string;
  private logger: Logger;

  constructor(date, market) {
    this.date = date;
    this.market = market;
    this.logger = getLogger("HolidayValidator");
    this.logger.level = configuration.logLevel;
  }

  async checkHoliday(): Promise<boolean> {
    switch (this.market) {
      case Market.SET:
        this.logger.info("Checking Thai holiday...");
        const thaiHolidayDates = await this.scrapeThaiHolidayData();
        if (this.isThaiHoliday(thaiHolidayDates)) {
          return true;
        } else {
          return false;
        }
      default:
        return false;
    }
  }

  private isThaiHoliday(holidayDates: string[]): boolean {
    const now = moment().tz("Asia/Bangkok");
    if (now.day() === 0 || now.day() === 6) {
      return true;
    }
    return holidayDates.includes(now.format("YYYY-MM-DD"));
  }

  private async scrapeThaiHolidayData(): Promise<string[]> {
    const year = this.date.getFullYear();
    const url = `https://www.bot.or.th/Thai/FinancialInstitutions/FIholiday/Pages/${year}.aspx`;
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    this.logger.debug(`Scraping Thai holiday data from ${url}`);
    await page.goto(url);

    let tableBody = await page.waitForXPath(
      '//*[@id="WebPartWPQ1"]/div[1]/table[2]/tbody'
    );

    let holidayDates: string[] = [];
    let rows = await tableBody.$$("tr");
    for (let i = 0; i < rows.length; i++) {
      let row = rows[i];
      let cells = await row.$$("td");
      let dateString = await cells[2].evaluate((node) => node.innerText);
      let monthString = await cells[3].evaluate((node) => node.innerText);
      dateString = this.removeSpaceAndNewLine(dateString);
      monthString = this.removeSpaceAndNewLine(monthString);
      const holidayDate = moment.tz("Asia/Bangkok").set({
        year: year,
        month: monthTHToMonth(monthString) - 1,
        date: +dateString,
      });
      holidayDates.push(holidayDate.format("YYYY-MM-DD"));
    }

    this.logger.debug(`Found ${holidayDates.length} Thai holidays.`);
    this.logger.debug(`Thai holidays: ${holidayDates}`);

    browser.close();
    this.logger.debug("Scraping Thai holiday data completed.");
    return holidayDates;
  }

  private removeSpaceAndNewLine(text: string): string {
    let result = text.replace(/\n|\r/g, "");
    //remove zero-width characters
    result = result.replace(/[\u200B-\u200D\uFEFF]/g, "");
    return result;
  }
}
