import { getLogger } from "log4js";
import { Bot } from "./bot";

function bootstrap() {
  const bot = new Bot("Brown God (บอทกาว)");
  const logger = getLogger("bootstrap");

  logger.level = "debug";
  logger.info("🤖 Bot is running..");
  logger.info(`--------------------`);
  logger.info(`Selecting Market: ${process.env.MARKET}`);
  logger.info(`Date: ${new Date()}`);
  logger.info(`--------------------`);

  const market = process.env.MARKET;
  if (!market) {
    logger.error("No market selected");
    return;
  }
  bot.sendMessage(market);
}

bootstrap();
