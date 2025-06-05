import { CronJob } from "cron";
import { getLogger, Logger } from "log4js";

import { Configuration } from "@configs";
import { AlertType, Market } from "@enums";
import { DiscordBot, TradingDayValidator } from "@services";

export class AlertScheduler {
  private readonly enabledMarket: string[];
  private readonly logger: Logger;

  private readonly discordBot: DiscordBot;
  private readonly tradingDayValidator: TradingDayValidator;

  constructor(private readonly configuration: Configuration) {
    this.enabledMarket = configuration.enableMarket;
    this.logger = getLogger("[AlertScheduler]");
    this.logger.level = configuration.logLevel;

    this.discordBot = new DiscordBot(
      configuration.discordBotName,
      configuration.discordWebhookId,
      configuration.discordWebhookToken,
      configuration.logLevel
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
          this.createNASDAQSchedule();
          break;
        default:
          this.logger.warn(`Market ${market} is not supported`);
      }
    });
  }

  private createSETSchedule(): void {
    this.logger.debug(
      `Create job [SET market open] using crontab: ${
        this.configuration.crontabConfig.get(Market.SET).open
      }`
    );
    const marketOpenJob = new CronJob(
      this.configuration.crontabConfig.get(Market.SET).open,
      () => {
        this.logger.info("Market SET Open cronjob triggered");
        this.sendAlert(Market.SET, AlertType.MARKET_OPEN);
      },
      null,
      true,
      "Asia/Bangkok"
    );

    this.logger.debug(
      `Create job [SET market close] using crontab: ${
        this.configuration.crontabConfig.get(Market.SET).close
      }`
    );
    const marketCloseJob = new CronJob(
      this.configuration.crontabConfig.get(Market.SET).close,
      () => {
        this.logger.info("Market SET Close cronjob triggered");
        this.sendAlert(Market.SET, AlertType.MARKET_BRIEFING);
      },
      null,
      true,
      "Asia/Bangkok"
    );

    this.logger.info("Starting Cron job");
    marketOpenJob.start();
    marketCloseJob.start();
  }

  private createNASDAQSchedule(): void {
    this.logger.debug(
      `Create job [NASDAQ market close] using crontab: ${
        this.configuration.crontabConfig.get(Market.NASDAQ).close
      }`
    );
    const marketCloseJob = new CronJob(
      this.configuration.crontabConfig.get(Market.NASDAQ).close,
      () => {
        this.logger.info("Market NASDAQ Close cronjob triggered");
        this.sendAlert(Market.NASDAQ, AlertType.MARKET_BRIEFING);
      },
      null,
      true,
      "Asia/Bangkok"
    );

    this.logger.info("Starting Cron job");
    marketCloseJob.start();
  }

  private readonly sendAlert = (market: string, alertType: string) => {
    this.tradingDayValidator.checkTradingDay(market).then((isTradingDay) => {
      if (!isTradingDay) {
        this.logger.info("Today is not trading day. Skip");
      } else {
        this.logger.info("Today is trading day. Sending alert");
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
