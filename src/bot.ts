import config from "config";
import { EmbedBuilder, WebhookClient } from "discord.js";
import { dateTH, monthTH } from "./common/constants";
import { toBEYear } from "./common/utils";
import { MarketScrapper } from "./market-scrapper";

export class Bot {
  private name: string;
  private webhookClient: WebhookClient;
  private marketScraper: MarketScrapper;

  constructor(name: string) {
    this.name = name;
    this.webhookClient = new WebhookClient({
      id: config.get("discord.webhook.id"),
      token: config.get("discord.webhook.token"),
    });
    this.marketScraper = new MarketScrapper();
  }

  async sendMessage(market: string) {
    let embed: EmbedBuilder;
    switch (market) {
      case "SET":
        embed = await this.generateSETIndexEmbed();
        break;
      default:
        break;
    }

    if (!embed) {
      return;
    }

    console.log(`Sending message to Discord...`);
    this.webhookClient.send({
      username: this.name,
      embeds: [embed],
    });
  }

  async generateSETIndexEmbed(): Promise<EmbedBuilder> {
    const data = await this.marketScraper.scrapeSETData();
    const date = new Date();
    const embed = new EmbedBuilder()
      .setTitle(
        `สรุปภาวะตลาดประจำวัน${dateTH[date.getDay()]} ที่ ${date.getDate()} ${
          monthTH[date.getMonth()]
        } ${toBEYear(date)}`
      )
      .setDescription(
        `
      SET Index: ${data.index}
      เปลี่ยนแปลง: ${data.change}
      `
      )
      .setURL("https://www.set.or.th/th/home")
      .setColor(0xfbb034)
      .addFields([
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
      ])
      .setAuthor({
        name: config.get("exchange.SET.name"),
        url: config.get("exchange.SET.url"),
        iconURL: config.get("exchange.SET.iconUrl"),
      });

    return embed;
  }
}
