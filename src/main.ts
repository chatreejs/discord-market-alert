import config from "config";
import { configure, getLogger, shutdown } from "log4js";
import moment from "moment-timezone";
import { Bot } from "./bot";
import { logBar } from "./common/constants";
import { Configuration, loadConfiguration } from "./config";
import { TradingDayValidator } from "./trading-day-validator/trading-day-validator";

function configLogger() {
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
}

function bootstrap() {
  const logger = getLogger("[main]");
  configLogger();

  const today = moment().toDate();
  logger.info("Discord Market Alert Bot 🤖");
  logger.info(`Version: ${process.env.npm_package_version}`);
  logger.info("Loading configuration...");

  let configuration: Configuration;
  try {
    configuration = loadConfiguration();
    logger.level = configuration.logLevel;
    logger.debug("Configuration:");
    logger.debug("Market: " + configuration.market);
    logger.debug("Alert Type: " + configuration.alertType);
    logger.debug("Discord Webhook ID: " + configuration.discordWebhookId);
    logger.debug("Discord Webhook Token: " + configuration.discordWebhookToken);

    logger.info(logBar);
    logger.info(`Selecting Market: ${process.env.MARKET}`);
    logger.info(`Selecting Alert Type: ${process.env.ALERT_TYPE}`);
    logger.info(`Date: ${today}`);
    logger.info(logBar);

    const tradingDayValidator = new TradingDayValidator(
      today,
      configuration.market
    );
    tradingDayValidator.checkTradingDay().then((isTradingDay) => {
      if (!isTradingDay) {
        logger.info("Today is not trading day. Exiting...");
        process.exit(0);
      } else {
        logger.info("Today is trading day. Sending alert...");
        const bot = new Bot(
          config.get("bot.name"),
          configuration.discordWebhookId,
          configuration.discordWebhookToken
        );
        bot.sendMessage(configuration.market, configuration.alertType).then(
          () => {
            logger.info("Exiting...");
          },
          (error: any) => {
            logger.error(error.message);
            logger.info("Exiting...");
            shutdown(() => {
              process.exit(1);
            });
          }
        );
      }
    });
  } catch (error: any) {
    logger.error(error.message);
    shutdown(() => {
      process.exit(1);
    });
  }
}

bootstrap();
