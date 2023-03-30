import puppeteer from "puppeteer";
import { SETIndex } from "../common/model";
import { Logger, getLogger } from "log4js";

export class MarketScrapper {
  private logger: Logger;

  constructor() {
    this.logger = getLogger("MarketScrapper");
    this.logger.level = "debug";
  }

  async scrapeSETData(): Promise<SETIndex> {
    this.logger.info("Scraping SET data...");
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    const url = "https://www.settrade.com/th/home";
    this.logger.info(`Scraping data from ${url}`);
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
    let max = await page.evaluate((element) => element.textContent, maxElement);
    let min = await page.evaluate((element) => element.textContent, minElement);
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

    browser.close();
    this.logger.info("Scraping SET data completed.");
    return data;
  }
}
