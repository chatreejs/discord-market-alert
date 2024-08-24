import config from "config";
import { APIEmbed, EmbedBuilder, WebhookClient } from "discord.js";
import { Logger, getLogger } from "log4js";
import moment from "moment-timezone";

import { configuration } from "@configs";
import { AlertType, Market } from "@enums";
import { NASDAQIndex } from "@interfaces";
import { MarketScrapper } from "@services";
import { toBuddhistYear } from "@utils";

export class DiscordBot {
  private name: string;
  private webhookClient: WebhookClient;
  private marketScraper: MarketScrapper;
  private logger: Logger;

  constructor(name: string, webhookId: string, webhookToken: string) {
    this.name = name;
    this.webhookClient = new WebhookClient({
      id: webhookId,
      token: webhookToken,
    });
    this.marketScraper = new MarketScrapper();
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

    this.logger.info(`Sending message to Discord...`);
    this.webhookClient.send({
      username: this.name,
      embeds,
    });
  }

  async generateSETIndexEmbed(title: string): Promise<APIEmbed> {
    this.logger.debug("Retrieving SET Index data...");
    const data = await this.marketScraper.scrapeSETData();
    const date = new Date();
    const dateString = toBuddhistYear(moment(date).locale("th"), "LLLL");
    this.logger.debug("Generating SET Index embed...");
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`SET Index\n${data.index}\n`)
      .setURL(config.get("exchange.SET.url"))
      .setColor(0xfbb034)
      .addFields([
        {
          name: ":chart_with_upwards_trend: เปลี่ยนแปลง",
          value: `${data.change} ${data.percentChange}`,
          inline: true,
        },
        {
          name: ":green_square: สูงสุด",
          value: data.max,
          inline: true,
        },
        {
          name: ":red_square: ต่ำสุด",
          value: data.min,
          inline: true,
        },
        {
          name: ":coin: ปริมาณ ('000 หุ้น)",
          value: data.volume,
          inline: true,
        },
        {
          name: ":dollar: มูลค่า (ล้านบาท)",
          value: data.value,
          inline: true,
        },
      ])
      .setThumbnail(config.get("exchange.SET.iconUrl"))
      .setImage(config.get("exchange.SET.bannerUrl"))
      .setFooter({
        text: `ข้อมูลเมื่อ ${dateString}\nข้อมูลจาก settrade.com\nบอทโดย Chatree.js`,
      });

    return embed.toJSON();
  }

  async generateSETMostActiveVolumeEmbed(): Promise<APIEmbed> {
    throw new Error("Not implemented");
  }

  async generateNASDAQIndexEmbed(title: string): Promise<APIEmbed> {
    this.logger.debug("Retrieving NASDAQ Index data...");
    let data: NASDAQIndex;
    try {
      data = await this.marketScraper.scrapeNASDAQData();
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
      .setURL(config.get("exchange.NASDAQ.url"))
      .setColor(0x0679a1)
      .addFields([
        {
          name: ":chart_with_upwards_trend: เปลี่ยนแปลง",
          value: `${data.change} ${data.percentChange}`,
          inline: true,
        },
        {
          name: ":green_square: สูงสุด",
          value: data.max,
          inline: true,
        },
        {
          name: ":red_square: ต่ำสุด",
          value: data.min,
          inline: true,
        },
      ])
      .setThumbnail(config.get("exchange.NASDAQ.iconUrl"))
      .setImage(config.get("exchange.NASDAQ.bannerUrl"))
      .setFooter({
        text: `ข้อมูลเมื่อ ${dateString}\nข้อมูลจาก nasdaq.com\nบอทโดย Chatree.js`,
      });

    return embed.toJSON();
  }
}
