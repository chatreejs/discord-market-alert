import puppeteer from "puppeteer";

import { NASDAQIndex, SETIndex } from "@interfaces";
import { MarketData } from "./market-data";

export class MarketDataScrapper extends MarketData {
  constructor(logLevel: string = "info") {
    super("[MarketDataScrapper]", logLevel);
  }

  async getSETIndexMarketData(): Promise<SETIndex> {
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

      let highElement = await page.waitForXPath(
        '//*[@id="index-set-stock-detail-tab-pane-1"]/div/div[1]/div[1]/div[2]/div[1]/div[1]/span'
      );

      let lowElement = await page.waitForXPath(
        '//*[@id="index-set-stock-detail-tab-pane-1"]/div/div[1]/div[1]/div[2]/div[2]/div[1]/span'
      );

      let volumeElement = await page.waitForXPath(
        '//*[@id="index-set-stock-detail-tab-pane-1"]/div/div[1]/div[1]/div[2]/div[1]/div[2]/span'
      );

      let valueElement = await page.waitForXPath(
        '//*[@id="index-set-stock-detail-tab-pane-1"]/div/div[1]/div[1]/div[2]/div[2]/div[2]/span'
      );

      let index = await page
        .evaluate((element) => element.textContent, indexElement)
        .then((text) => +text.trim().replace(/,/g, ""));
      let change = await page
        .evaluate((element) => element.textContent, changeElement)
        .then((text) => +text.trim().replace(/,/g, ""));
      let percentChange = await page
        .evaluate((element) => element.textContent, percentChangeElement)
        .then((text) => +text.trim().replace(/[+%()]/g, ""));
      let high = await page
        .evaluate((element) => element.textContent, highElement)
        .then((text) => +text.trim().replace(/,/g, ""));
      let low = await page
        .evaluate((element) => element.textContent, lowElement)
        .then((text) => +text.trim().replace(/,/g, ""));
      let value = await page
        .evaluate((element) => element.textContent, valueElement)
        .then((text) => +text.trim().replace(/,/g, ""));
      let volume = await page
        .evaluate((element) => element.textContent, volumeElement)
        .then((text) => +text.trim().replace(/,/g, ""));

      let data: SETIndex = {
        index: index,
        change: change,
        percentChange: percentChange,
        high: high,
        low: low,
        volume: volume,
        value: value,
      };

      this.logger.debug(`index: ${data.index}`);
      this.logger.debug(`change: ${data.change}`);
      this.logger.debug(`percentChange: ${data.percentChange}`);
      this.logger.debug(`high: ${data.high}`);
      this.logger.debug(`low: ${data.low}`);
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

  async getNASDAQIndexMarketData(): Promise<NASDAQIndex> {
    try {
      const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      const url = "https://finance.yahoo.com/quote/%5EIXIC";
      this.logger.debug(`Scraping NASDAQ data from ${url}`);
      await page.goto(url);

      let indexElement = await page.waitForXPath(
        '//*[@id="nimbus-app"]/section/section/section/article/section[1]/div[2]/div[1]/section/div/section/div[1]/fin-streamer[1]/span'
      );

      let changeElement = await page.waitForXPath(
        '//*[@id="nimbus-app"]/section/section/section/article/section[1]/div[2]/div[1]/section/div/section/div[1]/fin-streamer[2]/span'
      );

      let percentChangeElement = await page.waitForXPath(
        '//*[@id="nimbus-app"]/section/section/section/article/section[1]/div[2]/div[1]/section/div/section/div[1]/fin-streamer[3]/span'
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
