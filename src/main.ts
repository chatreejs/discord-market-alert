import { getLogger } from "log4js";
import { Bot } from "./bot";
import { Configuration, loadConfiguration } from "./config";

function bootstrap() {
  const logger = getLogger("bootstrap");
  const today = new Date();
  logger.level = "debug";
  logger.info("🤖 Bot is running..");
  logger.info(`--------------------`);
  logger.info(`Selecting Market: ${process.env.MARKET}`);
  logger.info(`Selecting Alert Type: ${process.env.ALERT_TYPE}`);
  logger.info(`Date: ${today}`);
  logger.info(`--------------------`);

  let config: Configuration;
  try {
    config = loadConfiguration();
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }

  const bot = new Bot(
    "Brown God (บอทกาว)",
    config.discordWebhookId,
    config.discordWebhookToken
  );
  bot.sendMessage(config.market, config.alertType);
}

bootstrap();
