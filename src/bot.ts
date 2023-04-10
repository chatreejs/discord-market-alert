import config from "config";
import { APIEmbed, EmbedBuilder, WebhookClient } from "discord.js";
import { dateTH, monthTH } from "./common/constants";
import { toBEYear } from "./common/utils";
import { MarketScrapper } from "./market-scrapper";
import { AlertType, Market } from "./common/enums";
import { Logger, getLogger } from "log4js";
import { configuration } from "./config";

export class Bot {
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
    this.logger = getLogger("[Bot]");
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
        } else if (alertType === AlertType.MARKET_SUMMARY) {
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
        } else if (alertType === AlertType.MARKET_SUMMARY) {
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
    const dateString = `วัน${dateTH[date.getDay()]} ที่ ${date.getDate()} ${
      monthTH[date.getMonth()]
    } ${toBEYear(date)}`;
    this.logger.debug("Generating SET Index embed...");
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`SET Index\n \`\`\`\n${data.index}\n\`\`\``)
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
        text: `ข้อมูลเมื่อ ${dateString} ${date.toLocaleTimeString()}\nข้อมูลจาก settrade.com\nบอทโดย Chatree.js`,
      });

    return embed.toJSON();
  }

  async generateSETMostActiveVolumeEmbed(): Promise<APIEmbed> {
    throw new Error("Not implemented");
  }

  async generateNASDAQIndexEmbed(title: string): Promise<APIEmbed> {
    this.logger.debug("Retrieving NASDAQ Index data...");
    const data = await this.marketScraper.scrapeNASDAQData();
    const date = new Date();
    const dateString = `วัน${dateTH[date.getDay()]} ที่ ${date.getDate()} ${
      monthTH[date.getMonth()]
    } ${toBEYear(date)}`;
    this.logger.debug("Generating NASDAQ Index embed...");
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(
        `NASDAQ Composite Index (COMP)\n \`\`\`\n${data.index}\n\`\`\``
      )
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
        text: `ข้อมูลเมื่อ ${dateString} ${date.toLocaleTimeString()}\nข้อมูลจาก nasdaq.com\nบอทโดย Chatree.js`,
      });

    return embed.toJSON();
  }
}
