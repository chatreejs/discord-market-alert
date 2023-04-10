import { configure, getLogger, shutdown } from "log4js";
import { Bot } from "./bot";
import { Configuration, loadConfiguration } from "./config";
import { HolidayValidator } from "./holiday-validator/holiday-validator";
import { logBar } from "./common/constants";

const version = require("./package.json").version;

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

    const holidayValidator = new HolidayValidator(today, config.market);
    holidayValidator.checkHoliday().then((isHoliday) => {
      if (isHoliday) {
        logger.info("Today is holiday. Exiting...");
        process.exit(0);
      } else {
        logger.info("Today is not holiday. Sending alert...");
        const bot = new Bot(
          "Brown God (บอทกาว)",
          config.discordWebhookId,
          config.discordWebhookToken
        );
        bot.sendMessage(config.market, config.alertType).then(() => {
          logger.info("Exiting...");
        });
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
