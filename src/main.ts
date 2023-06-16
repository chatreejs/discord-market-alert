import { configure, getLogger, shutdown } from "log4js";
import { Bot } from "./bot";
import { logBar } from "./common/constants";
import { Configuration, loadConfiguration } from "./config";
import { TradingDayValidator } from "./trading-day-validator/trading-day-validator";

const { version } = require("../package.json");

function configLogger() {
  const today = new Date();
  const fileName =
    today.getFullYear() +
    "-" +
    (today.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    today.getDate().toString().padStart(2, "0");

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

  const today = new Date();
  logger.info("Discord Market Alert Bot 🤖");
  logger.info(`Version: ${version}`);
  logger.info("Loading configuration...");

  let config: Configuration;
  try {
    config = loadConfiguration();
    logger.level = config.logLevel;
    logger.debug("Configuration:");
    logger.debug("Market: " + config.market);
    logger.debug("Alert Type: " + config.alertType);
    logger.debug("Discord Webhook ID: " + config.discordWebhookId);
    logger.debug("Discord Webhook Token: " + config.discordWebhookToken);

    logger.info(logBar);
    logger.info(`Selecting Market: ${process.env.MARKET}`);
    logger.info(`Selecting Alert Type: ${process.env.ALERT_TYPE}`);
    logger.info(`Date: ${today}`);
    logger.info(logBar);

    const tradingDayValidator = new TradingDayValidator(today, config.market);
    tradingDayValidator.checkTradingDay().then((isTradingDay) => {
      if (!isTradingDay) {
        logger.info("Today is not trading day. Exiting...");
        process.exit(0);
      } else {
        logger.info("Today is trading day. Sending alert...");
        const bot = new Bot(
          "Brown God (บอทกาว)",
          config.discordWebhookId,
          config.discordWebhookToken
        );
        bot.sendMessage(config.market, config.alertType).then(
          () => {
            logger.info("Exiting...");
          },
          (error) => {
            logger.info("Exiting...");
            shutdown(() => {
              process.exit(1);
            });
          }
        );
      }
    });
  } catch (error) {
    logger.error(error.message);
    shutdown(() => {
      process.exit(1);
    });
  }
}

bootstrap();
