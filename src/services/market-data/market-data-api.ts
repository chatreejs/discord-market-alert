import axios from "axios";
import puppeteer, { Browser } from "puppeteer";

import { Configuration } from "@configs";
import {
  NASDAQIndex,
  NASDAQIndexResponse,
  SETIndex,
  SETIndexInfo,
  SETIndexListResponse,
} from "@interfaces";
import { MarketData } from "./market-data";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const SET_OVERVIEW_URL = "https://www.set.or.th/en/market/index/set/overview";
const SET_INDEX_API_URL =
  "https://www.set.or.th/api/set/index/info/list?type=INDEX";
const NASDAQ_INDEX_API_URL =
  "https://api.nasdaq.com/api/quote/COMP/info?assetclass=index";

export class MarketDataApi extends MarketData {
  constructor(protected readonly configuration: Configuration) {
    super(configuration, "[MarketDataApi]");
  }

  async getSETIndexMarketData(): Promise<SETIndex> {
    let browser: Browser | undefined;
    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setUserAgent(USER_AGENT);

      // Visit the SET site first to pass the Incapsula JS challenge and obtain
      // its cookies before hitting the JSON API.
      this.logger.debug(`Priming Incapsula session via ${SET_OVERVIEW_URL}`);
      await page.goto(SET_OVERVIEW_URL, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      this.logger.debug(
        `Fetching SET index market data from ${SET_INDEX_API_URL}`,
      );
      const result = await page.evaluate(async (apiUrl) => {
        const response = await fetch(apiUrl, {
          headers: { Accept: "application/json" },
        });
        return { status: response.status, body: await response.text() };
      }, SET_INDEX_API_URL);

      if (result.status !== 200) {
        throw new Error(
          `Failed to fetch SET index market data. HTTP ${result.status}`,
        );
      }

      const payload: SETIndexListResponse = JSON.parse(result.body);
      const indexInfo = payload.indexIndustrySectors?.find(
        (entry: SETIndexInfo) => entry.symbol === "SET",
      );
      if (!indexInfo) {
        throw new Error("SET index entry not found in API response.");
      }

      const indexData: SETIndex = {
        index: indexInfo.last,
        change: indexInfo.change,
        percentChange: indexInfo.percentChange,
        high: indexInfo.high,
        low: indexInfo.low,
        volume: indexInfo.volume / 1_000,
        value: indexInfo.value / 1_000_000,
      };

      this.logger.debug(`index: ${indexData.index}`);
      this.logger.debug(`change: ${indexData.change}`);
      this.logger.debug(`percentChange: ${indexData.percentChange}`);
      this.logger.debug(`high: ${indexData.high}`);
      this.logger.debug(`low: ${indexData.low}`);
      this.logger.debug(`volume: ${indexData.volume}`);
      this.logger.debug(`value: ${indexData.value}`);

      return indexData;
    } catch (error) {
      this.logger.error("Error fetching SET index market data:", error);
      throw new Error("Failed to fetch SET index market data.");
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async getNASDAQIndexMarketData(): Promise<NASDAQIndex> {
    this.logger.debug(
      `Fetching NASDAQ index market data from ${NASDAQ_INDEX_API_URL}`,
    );

    try {
      const response = await axios.get<NASDAQIndexResponse>(
        NASDAQ_INDEX_API_URL,
        {
          headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
          },
        },
      );
      if (response.status === 200) {
        const data = response.data.data;
        const indexData: NASDAQIndex = {
          index: +data.primaryData.lastSalePrice.replace(/,/g, ""),
          change: +data.primaryData.netChange.replace(/,/g, ""),
          percentChange: +data.primaryData.percentageChange.replace(
            /[+%()]/g,
            "",
          ),
          high: +data.keyStats.dayrange.value.split(" - ")[1].replace(/,/g, ""),
          low: +data.keyStats.dayrange.value.split(" - ")[0].replace(/,/g, ""),
        };

        this.logger.debug(`index: ${indexData.index}`);
        this.logger.debug(`change: ${indexData.change}`);
        this.logger.debug(`percentChange: ${indexData.percentChange}`);
        this.logger.debug(`high: ${indexData.high}`);
        this.logger.debug(`low: ${indexData.low}`);

        return indexData;
      }
    } catch (error) {
      this.logger.error("Error fetching NASDAQ index market data:", error);
      throw new Error("Failed to fetch NASDAQ index market data.");
    }
  }
}
