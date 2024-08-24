import config from "config";
import { CronJob } from "cron";
import { configure, getLogger, shutdown } from "log4js";
import "module-alias/register";
import moment from "moment-timezone";

import { Configuration, loadConfiguration } from "@configs";
import { logBar } from "@constants";
import { AlertType, Market } from "@enums";
import { TradingDayValidator } from "@services";
import { Bot } from "./bot";
import { APP_VERSION } from "./version";

process.on("SIGINT", function () {
  logger.info("Caught interrupt signal");
  shutdown(() => {
    process.exit(0);
  });
});

const configLogger = () => {
  const fileName = moment().format("YYYY-MM-DD");
  configure({
    appenders: {
      console: { type: "console" },
      file: { type: "file", filename: `logs/${fileName}.log` },
    },
    categories: {
      default: { appenders: ["console", "file"], level: "debug" },
    },
  });
};

const logger = getLogger("[main]");
configLogger();

const today = moment().toDate();
logger.info("Discord Market Alert Bot 🤖");
logger.info(`Version: ${APP_VERSION}`);

let configuration: Configuration;
try {
  logger.info("Loading configuration...");
  configuration = loadConfiguration();
  logger.level = configuration.logLevel;
  logger.debug("Configuration:");
  logger.debug(`BOT Client ID: ${configuration.botClientId}`);
  logger.debug(`Discord Webhook ID: ${configuration.discordWebhookId}`);
  logger.debug(`Discord Webhook Token: ${configuration.discordWebhookToken}`);
  logger.debug(`Market SET Open Cron: ${configuration.marketSETOpenCron}`);
  logger.debug(`Market SET Close Cron: ${configuration.marketSETCloseCron}`);
  logger.info("Configuration loaded successfully");
  logger.info(logBar);

  // Create Cron Job
  logger.info("Creating Cron Job");
  logger.debug("Market SET Open Cron: " + configuration.marketSETOpenCron);
  const marketSETOpenJob = new CronJob(
    configuration.marketSETOpenCron,
    () => {
      logger.info("Market SET Open Cron Job started");
      sendMarketAlert(Market.SET, AlertType.MARKET_OPEN);
    },
    null,
    true,
    "Asia/Bangkok"
  );

  logger.debug("Market SET Close Cron: " + configuration.marketSETCloseCron);
  const marketSETCloseJob = new CronJob(
    configuration.marketSETCloseCron,
    () => {
      logger.info("Market SET Close Cron Job started");
      sendMarketAlert(Market.SET, AlertType.MARKET_BRIEFING);
    },
    null,
    true,
    "Asia/Bangkok"
  );

  // Start Cron Job
  logger.info("Starting Cron Job");
  marketSETOpenJob.start();
  marketSETCloseJob.start();
} catch (error: any) {
  logger.error(error.message);
  shutdown(() => {
    process.exit(1);
  });
}

const sendMarketAlert = (market: string, alertType: string) => {
  const tradingDayValidator = new TradingDayValidator(today, market);
  tradingDayValidator.checkTradingDay().then((isTradingDay) => {
    if (!isTradingDay) {
      logger.info("Today is not trading day. Skip...");
    } else {
      logger.info("Today is trading day. Sending alert...");
      const bot = new Bot(
        config.get("discordbot.name"),
        configuration.discordWebhookId,
        configuration.discordWebhookToken
      );
      bot.sendMessage(market, alertType).then(
        () => {
          logger.info("Sending message complete");
        },
        (error: any) => {
          logger.error(error.message);
        }
      );
    }
  });
};
