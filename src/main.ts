import { configure, getLogger, shutdown } from "log4js";
import moment from "moment-timezone";
import { Bot } from "./bot";
import { logBar } from "./common/constants";
import { Configuration, loadConfiguration } from "./config";
import { TradingDayValidator } from "./trading-day-validator/trading-day-validator";
import { APP_VERSION } from "./version";

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
  logger.info(`Version: ${APP_VERSION}`);
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
