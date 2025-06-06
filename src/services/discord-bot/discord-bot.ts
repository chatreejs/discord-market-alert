import { APIEmbed, EmbedBuilder, WebhookClient } from "discord.js";
import { Logger, getLogger } from "log4js";
import moment from "moment-timezone";

import { Configuration } from "@configs";
import {
  NASDAQ_BANNER_URL,
  NASDAQ_ICON_URL,
  NASDAQ_WEBSITE_URL,
  SET_BANNER_URL,
  SET_ICON_URL,
  SET_WEBSITE_URL,
} from "@constants";
import { AlertType, Market } from "@enums";
import { NASDAQIndex } from "@interfaces";
import { MarketData, MarketDataApi, MarketDataScrapper } from "@services";
import { currencyFormat, toBuddhistYear } from "@utils";

export class DiscordBot {
  private readonly name: string;
  private readonly webhookId: string[];
  private readonly webhookToken: string[];
  private readonly marketDataScrapper: MarketData;
  private readonly marketDataApi: MarketDataApi;
  private readonly logger: Logger;

  constructor(
    name: string,
    webhookId: string[],
    webhookToken: string[],
    configuration: Configuration
  ) {
    this.name = name;
    this.webhookId = webhookId;
    this.webhookToken = webhookToken;
    this.marketDataScrapper = new MarketDataScrapper(configuration);
    this.marketDataApi = new MarketDataApi(configuration);
    this.logger = getLogger("[DiscordBot]");
    this.logger.level = configuration.logLevel;
  }

  async sendMessage(market: string, alertType: string): Promise<void> {
    let embeds: APIEmbed[] = [];
    switch (market) {
      case Market.SET:
        if (alertType === AlertType.MARKET_OPEN) {
          embeds.push(
            await this.generateSETIndexEmbed(
              "รายงานสถานการณ์ตลาดหลักทรัพย์แห่งประเทศไทย"
            )
          );
        } else if (alertType === AlertType.MARKET_BRIEFING) {
          embeds.push(
            await this.generateSETIndexEmbed(
              "สรุปภาวะตลาดหลักทรัพย์แห่งประเทศไทย"
            )
          );
          // embeds.push(await this.generateSETMostActiveVolumeEmbed());
        }
        break;
      case Market.NASDAQ:
        if (alertType === AlertType.MARKET_OPEN) {
          embeds.push(
            await this.generateNASDAQIndexEmbed(
              "รายงานสถานการณ์ NASDAQ Composite Index"
            )
          );
        } else if (alertType === AlertType.MARKET_BRIEFING) {
          embeds.push(
            await this.generateNASDAQIndexEmbed(
              "สรุปภาวะ NASDAQ Composite Index"
            )
          );
        }
        break;
      default:
        break;
    }

    if (embeds.length == 0) {
      this.logger.info("No embeds to send.");
      return;
    }

    this.logger.info(`Sending message to Discord`);
    this.logger.debug(`embeds: ${JSON.stringify(embeds)}`);
    this.webhookId.forEach((id, index) => {
      let webhookClient = new WebhookClient({
        id: id,
        token: this.webhookToken[index],
      });

      this.logger.debug(`webhook id:${id}, token:${this.webhookToken[index]}`);
      webhookClient.send({
        username: this.name,
        embeds,
      });
    });
  }

  async generateSETIndexEmbed(title: string): Promise<APIEmbed> {
    this.logger.debug("Retrieving SET Index data");
    const data = await this.marketDataScrapper.getSETIndexMarketData();
    const date = new Date();
    const dateString = toBuddhistYear(moment(date).locale("th"), "LLLL");
    this.logger.debug("Generating SET Index embed...");
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`SET Index\n${currencyFormat(data.index)}\n`)
      .setURL(SET_WEBSITE_URL)
      .setColor(0xfbb034)
      .addFields([
        {
          name: ":chart_with_upwards_trend: เปลี่ยนแปลง",
          value:
            (data.change > 0
              ? "+" + currencyFormat(data.change)
              : currencyFormat(data.change)) +
            ` (${
              data.percentChange > 0
                ? "+" + currencyFormat(data.percentChange)
                : currencyFormat(data.percentChange)
            }%)`,
          inline: true,
        },
        {
          name: ":green_square: สูงสุด",
          value: currencyFormat(data.high),
          inline: true,
        },
        {
          name: ":red_square: ต่ำสุด",
          value: currencyFormat(data.low),
          inline: true,
        },
        {
          name: ":coin: ปริมาณ ('000 หุ้น)",
          value: currencyFormat(data.volume),
          inline: true,
        },
        {
          name: ":dollar: มูลค่า (ล้านบาท)",
          value: currencyFormat(data.value),
          inline: true,
        },
      ])
      .setThumbnail(SET_ICON_URL)
      .setImage(SET_BANNER_URL)
      .setFooter({
        text: `ข้อมูลเมื่อ ${dateString}\nข้อมูลจาก settrade.com\nบอทโดย Chatree.js`,
      });

    return embed.toJSON();
  }

  async generateSETMostActiveVolumeEmbed(): Promise<APIEmbed> {
    throw new Error("Not implemented");
  }

  async generateNASDAQIndexEmbed(title: string): Promise<APIEmbed> {
    this.logger.debug("Retrieving NASDAQ Index data");
    let data: NASDAQIndex;
    try {
      data = await this.marketDataApi.getNASDAQIndexMarketData();
    } catch (error) {
      this.logger.error("Error retrieving NASDAQ data.");
      throw error;
    }
    const date = new Date();
    const dateString = toBuddhistYear(moment(date).locale("th"), "LLLL");
    this.logger.debug("Generating NASDAQ Index embed...");
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`NASDAQ Composite Index (COMP)\n${data.index}\n`)
      .setURL(NASDAQ_WEBSITE_URL)
      .setColor(0x0679a1)
      .addFields([
        {
          name: ":chart_with_upwards_trend: เปลี่ยนแปลง",
          value: `${data.change} ${data.percentChange}`,
          inline: true,
        },
        {
          name: ":green_square: สูงสุด",
          value: data.high,
          inline: true,
        },
        {
          name: ":red_square: ต่ำสุด",
          value: data.low,
          inline: true,
        },
      ])
      .setThumbnail(NASDAQ_ICON_URL)
      .setImage(NASDAQ_BANNER_URL)
      .setFooter({
        text: `ข้อมูลเมื่อ ${dateString}\nข้อมูลจาก nasdaq.com\nบอทโดย Chatree.js`,
      });

    return embed.toJSON();
  }
}
