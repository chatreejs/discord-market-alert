import { getLogger } from "log4js";
import { Bot } from "./bot";
import { Configuration, loadConfiguration } from "./config";
import { HolidayValidator } from "./holiday-validator/holiday-validator";
import { logBar } from "./common/constants";

function bootstrap() {
  const logger = getLogger("bootstrap");

  const today = new Date();
  logger.level = "debug";
  logger.info("🤖 Bot is running..");
  logger.debug("Loading configuration...");

  let config: Configuration;
  try {
    config = loadConfiguration();
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }

  logger.info(logBar);
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
      bot.sendMessage(config.market, config.alertType);
    }
  });
}

bootstrap();
