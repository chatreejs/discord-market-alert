import puppeteer from "puppeteer";
import { SETIndex } from "../common/model";

export class MarketScrapper {
  constructor() {}

  async scrapeSETData(): Promise<SETIndex> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto("https://www.settrade.com/th/home");

    let indexElement = await page.waitForSelector(
      "#index-set-stock-detail-tab-pane-1 > div > div.d-flex.flex-wrap > div.d-flex.flex-column.col-12.col-md-6.pe-md-3 > div.card-market-index > div.card.card-index.border-0.pt-1.pb-3.shadow-none.theme-success-1 > div > div > div.d-flex.flex-column > div.d-flex.align-items-center.text-nowrap.mb-2.market-last > h2"
    );

    let changeElement = await page.waitForSelector(
      "#index-set-stock-detail-tab-pane-1 > div > div.d-flex.flex-wrap > div.d-flex.flex-column.col-12.col-md-6.pe-md-3 > div.card-market-index > div.card.card-index.border-0.pt-1.pb-3.shadow-none.theme-success-1 > div > div > div.d-flex.flex-column > div.market-change.title-font-family.lh-1.d-flex.justify-content-center.text-nowrap.fs-24px.px-2.theme-success > span.me-1"
    );

    let maxElement = await page.waitForSelector(
      "#index-set-stock-detail-tab-pane-1 > div > div.d-flex.flex-wrap > div.d-flex.flex-column.col-12.col-md-6.pe-md-3 > div.market-summary-index-items.d-flex.flex-wrap > div.d-flex.flex-column.col-5.me-auto > div.d-flex.flex-column.border-bottom.py-3 > span"
    );

    let minElement = await page.waitForSelector(
      "#index-set-stock-detail-tab-pane-1 > div > div.d-flex.flex-wrap > div.d-flex.flex-column.col-12.col-md-6.pe-md-3 > div.market-summary-index-items.d-flex.flex-wrap > div:nth-child(2) > div.d-flex.flex-column.border-bottom.py-3 > span"
    );

    let volumeElement = await page.waitForSelector(
      "#index-set-stock-detail-tab-pane-1 > div > div.d-flex.flex-wrap > div.d-flex.flex-column.col-12.col-md-6.pe-md-3 > div.market-summary-index-items.d-flex.flex-wrap > div.d-flex.flex-column.col-5.me-auto > div:nth-child(2) > span"
    );

    let valueElement = await page.waitForSelector(
      "#index-set-stock-detail-tab-pane-1 > div > div.d-flex.flex-wrap > div.d-flex.flex-column.col-12.col-md-6.pe-md-3 > div.market-summary-index-items.d-flex.flex-wrap > div:nth-child(2) > div:nth-child(2) > span"
    );

    let index = await page.evaluate(
      (element) => element.textContent,
      indexElement
    );
    let change = await page.evaluate(
      (element) => element.textContent,
      changeElement
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
      max: max.trim(),
      min: min.trim(),
      volume: volume.trim(),
      value: value.trim(),
    };

    browser.close();
    return data;
  }
}
