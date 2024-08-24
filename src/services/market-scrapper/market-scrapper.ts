import { Logger, getLogger } from "log4js";
import puppeteer from "puppeteer";

import { configuration } from "@configs";
import { NASDAQIndex, SETIndex } from "@interfaces";

export class MarketScrapper {
  private logger: Logger;

  constructor() {
    this.logger = getLogger("[MarketScrapper]");
    this.logger.level = configuration.logLevel;
  }

  async scrapeSETData(): Promise<SETIndex> {
    try {
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      const url = "https://www.settrade.com/th/home";
      this.logger.debug(`Scraping SET data from ${url}`);
      await page.goto(url);

      let indexElement = await page.waitForXPath(
        '//*[@id="index-set-stock-detail-tab-pane-1"]/div/div[1]/div[1]/div[1]/div[2]/div/div/div[2]/div[1]/h2'
      );

      let changeElement = await page.waitForXPath(
        '//*[@id="index-set-stock-detail-tab-pane-1"]/div/div[1]/div[1]/div[1]/div[2]/div/div/div[2]/div[2]/span[1]'
      );

      let percentChangeElement = await page.waitForXPath(
        '//*[@id="index-set-stock-detail-tab-pane-1"]/div/div[1]/div[1]/div[1]/div[2]/div/div/div[2]/div[2]/span[2]'
      );

      let maxElement = await page.waitForXPath(
        '//*[@id="index-set-stock-detail-tab-pane-1"]/div/div[1]/div[1]/div[2]/div[1]/div[1]/span'
      );

      let minElement = await page.waitForXPath(
        '//*[@id="index-set-stock-detail-tab-pane-1"]/div/div[1]/div[1]/div[2]/div[2]/div[1]/span'
      );

      let volumeElement = await page.waitForXPath(
        '//*[@id="index-set-stock-detail-tab-pane-1"]/div/div[1]/div[1]/div[2]/div[1]/div[2]/span'
      );

      let valueElement = await page.waitForXPath(
        '//*[@id="index-set-stock-detail-tab-pane-1"]/div/div[1]/div[1]/div[2]/div[2]/div[2]/span'
      );

      let index = await page.evaluate(
        (element) => element.textContent,
        indexElement
      );
      let change = await page.evaluate(
        (element) => element.textContent,
        changeElement
      );

      let percentChange = await page.evaluate(
        (element) => element.textContent,
        percentChangeElement
      );
      let max = await page.evaluate(
        (element) => element.textContent,
        maxElement
      );
      let min = await page.evaluate(
        (element) => element.textContent,
        minElement
      );
      let value = await page.evaluate(
        (element) => element.textContent,
        valueElement
      );
      let volume = await page.evaluate(
        (element) => element.textContent,
        volumeElement
      );

      let data: SETIndex = {
        index: index.trim(),
        change: change.trim(),
        percentChange: percentChange.trim(),
        max: max.trim(),
        min: min.trim(),
        volume: volume.trim(),
        value: value.trim(),
      };

      this.logger.debug(`index: ${data.index}`);
      this.logger.debug(`change: ${data.change}`);
      this.logger.debug(`percentChange: ${data.percentChange}`);
      this.logger.debug(`max: ${data.max}`);
      this.logger.debug(`min: ${data.min}`);
      this.logger.debug(`volume: ${data.volume}`);
      this.logger.debug(`value: ${data.value}`);

      browser.close();
      this.logger.debug("Scraping SET data completed.");
      return data;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async scrapeNASDAQData(): Promise<NASDAQIndex> {
    try {
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      const url = "https://www.marketwatch.com/investing/index/comp";
      this.logger.debug(`Scraping NASDAQ data from ${url}`);
      await page.goto(url);

      let indexElement = await page.waitForXPath(
        '//*[@id="maincontent"]/div[2]/div[3]/div/div[2]/h2/bg-quote'
      );

      let changeElement = await page.waitForXPath(
        '//*[@id="maincontent"]/div[2]/div[3]/div/div[2]/bg-quote/span[1]/bg-quote'
      );

      let percentChangeElement = await page.waitForXPath(
        '//*[@id="maincontent"]/div[2]/div[3]/div/div[2]/bg-quote/span[2]/bg-quote'
      );

      let maxElement = await page.waitForXPath(
        '//*[@id="maincontent"]/div[2]/div[5]/mw-rangebar[1]/div[1]/span[3]'
      );

      let minElement = await page.waitForXPath(
        '//*[@id="maincontent"]/div[2]/div[5]/mw-rangebar[1]/div[1]/span[1]'
      );

      let index = await page.evaluate(
        (element) => element.textContent,
        indexElement
      );
      let change = await page.evaluate(
        (element) => element.textContent,
        changeElement
      );
      let percentChange = await page.evaluate(
        (element) => element.textContent,
        percentChangeElement
      );
      let max = await page.evaluate(
        (element) => element.textContent,
        maxElement
      );
      let min = await page.evaluate(
        (element) => element.textContent,
        minElement
      );

      let data: NASDAQIndex = {
        index: index.trim(),
        change: change.trim(),
        percentChange: percentChange.trim(),
        max: max.trim(),
        min: min.trim(),
      };

      browser.close();
      this.logger.debug("Scraping NASDAQ data completed.");
      return data;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
