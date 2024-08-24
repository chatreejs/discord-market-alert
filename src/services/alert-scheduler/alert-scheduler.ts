import config from "config";
import { CronJob } from "cron";
import { getLogger, Logger } from "log4js";

import { Configuration } from "@configs";
import { AlertType, Market } from "@enums";
import { DiscordBot, TradingDayValidator } from "@services";

export class AlertScheduler {
  private enabledMarket: string[];
  private logger: Logger;

  private discordBot: DiscordBot;
  private tradingDayValidator: TradingDayValidator;

  constructor(private configuration: Configuration) {
    this.enabledMarket = configuration.enableMarket;
    this.logger = getLogger("[AlertScheduler]");
    this.logger.level = configuration.logLevel;

    this.discordBot = new DiscordBot(
      config.get("discordbot.name"),
      configuration.discordWebhookId,
      configuration.discordWebhookToken
    );
    this.tradingDayValidator = new TradingDayValidator(configuration);
  }

  create(): void {
    this.enabledMarket.forEach((market) => {
      this.logger.info(`Creating schedule for market: ${market}`);
      switch (market) {
        case Market.SET:
          this.createSETSchedule();
          break;
        case Market.NASDAQ:
          this.logger.warn(`Market ${market} is currently not supported`);
          break;
        default:
          this.logger.warn(`Market ${market} is not supported`);
      }
    });
  }

  private createSETSchedule(): void {
    this.logger.debug(
      "Configuring SET market open using cron: " +
        this.configuration.marketSETOpenCron
    );
    const marketSETOpenJob = new CronJob(
      this.configuration.marketSETOpenCron,
      () => {
        this.logger.info("Market SET Open cronjob triggered");
        this.sendAlert(Market.SET, AlertType.MARKET_OPEN);
      },
      null,
      true,
      "Asia/Bangkok"
    );

    this.logger.debug(
      "Configuring SET market close using cron: " +
        this.configuration.marketSETCloseCron
    );
    const marketSETCloseJob = new CronJob(
      this.configuration.marketSETCloseCron,
      () => {
        this.logger.info("Market SET Close cronjob triggered");
        this.sendAlert(Market.SET, AlertType.MARKET_BRIEFING);
      },
      null,
      true,
      "Asia/Bangkok"
    );

    this.logger.info("Starting Cron job");
    marketSETOpenJob.start();
    marketSETCloseJob.start();
  }

  private sendAlert = (market: string, alertType: string) => {
    this.tradingDayValidator.checkTradingDay(market).then((isTradingDay) => {
      if (!isTradingDay) {
        this.logger.info("Today is not trading day. Skip...");
      } else {
        this.logger.info("Today is trading day. Sending alert...");
        this.discordBot.sendMessage(market, alertType).then(
          () => {
            this.logger.info("Sending message complete");
          },
          (error: any) => {
            this.logger.error(error.message);
          }
        );
      }
    });
  };
}
