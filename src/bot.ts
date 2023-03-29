import config from "config";
import { APIEmbed, EmbedBuilder, WebhookClient } from "discord.js";
import { dateTH, monthTH } from "./common/constants";
import { toBEYear } from "./common/utils";
import { MarketScrapper } from "./market-scrapper";
import { Market } from "./common/enums";
import { Logger, getLogger } from "log4js";

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
    this.logger = getLogger("Bot");
    this.logger.level = "debug";
  }

  async sendMessage(market: string) {
    let embeds: APIEmbed[] = [];
    switch (market) {
      case Market.SET:
        embeds.push(
          await this.generateSETIndexEmbed(
            "รายงายสถานการณ์ตลาดหลักทรัพย์แห่งประเทศไทย"
          )
        );
        break;
      case Market.SET_SUMMARY:
        embeds.push(
          await this.generateSETIndexEmbed(
            "สรุปภาวะตลาดหลักทรัพย์แห่งประเทศไทย"
          )
        );
        // embeds.push(await this.generateSETMostActiveVolumeEmbed());
        break;
      default:
        break;
    }

    if (embeds.length == 0) {
      return;
    }

    this.logger.info(`Sending message to Discord...`);
    this.webhookClient.send({
      username: this.name,
      embeds,
    });
  }

  async generateSETIndexEmbed(title: string): Promise<APIEmbed> {
    const data = await this.marketScraper.scrapeSETData();
    const date = new Date();
    const dataString = `วัน${dateTH[date.getDay()]} ที่ ${date.getDate()} ${
      monthTH[date.getMonth()]
    } ${toBEYear(date)}`;
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(`SET Index\n${data.index}`)
      .setURL("https://www.set.or.th/th/home")
      .setColor(0xfbb034)
      .addFields([
        {
          name: "เปลี่ยนแปลง",
          value: data.change,
          inline: true,
        },
        {
          name: "สูงสุด",
          value: data.max,
          inline: true,
        },
        {
          name: "ต่ำสุด",
          value: data.min,
          inline: true,
        },
        {
          name: "ปริมาณ ('000 หุ้น)",
          value: data.volume,
          inline: true,
        },
        {
          name: "มูลค่า (ล้านบาท)",
          value: data.value,
          inline: true,
        },
        {
          name: "🕒 ข้อมูลล่าสุด",
          value: `> ${dataString} ${date.toLocaleTimeString()}`,
          inline: false,
        },
      ])
      .setFooter({
        text: "ข้อมูลจาก settrade.com\nบอทโดย Chatree.js",
      })
      .setAuthor({
        name: config.get("exchange.SET.name"),
        url: config.get("exchange.SET.url"),
        iconURL: config.get("exchange.SET.iconUrl"),
      });

    return embed.toJSON();
  }

  async generateSETMostActiveVolumeEmbed(): Promise<APIEmbed> {
    throw new Error("Not implemented");
  }
}
