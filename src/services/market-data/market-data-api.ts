import axios from "axios";

import { Configuration } from "@configs";
import { NASDAQIndex, NASDAQIndexResponse, SETIndex } from "@interfaces";
import { MarketData } from "./market-data";

export class MarketDataApi extends MarketData {
  constructor(protected readonly configuration: Configuration) {
    super(configuration, "[MarketDataApi]");
  }

  async getSETIndexMarketData(): Promise<SETIndex> {
    throw new Error(
      "Method not implemented. Use MarketDataScrapper to fetch SET index data."
    );
  }

  async getNASDAQIndexMarketData(): Promise<NASDAQIndex> {
    const url = "https://api.nasdaq.com/api/quote/COMP/info?assetclass=index";
    this.logger.debug(`Fetching NASDAQ index market data from ${url}`);

    try {
      const response = await axios.get<NASDAQIndexResponse>(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
          Accept: "application/json",
        },
      });
      if (response.status === 200) {
        const data = response.data.data;
        const indexData: NASDAQIndex = {
          index: data.primaryData.lastSalePrice,
          change: data.primaryData.netChange,
          percentChange: data.primaryData.percentageChange,
          high: data.keyStats.dayrange.value.split(" - ")[1],
          low: data.keyStats.dayrange.value.split(" - ")[0],
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
