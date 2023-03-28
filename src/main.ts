import { getLogger } from "log4js";
import { Bot } from "./bot";

function bootstrap() {
  const logger = getLogger("bootstrap");
  logger.level = "debug";
  logger.info("🤖 Bot is running..");
  logger.info(`--------------------`);
  logger.info(`Selecting Market: ${process.env.MARKET}`);
  logger.info(`Date: ${new Date()}`);
  logger.info(`--------------------`);

  const { MARKET, DISCORD_WEBHOOK_ID, DISCORD_WEBHOOK_TOKEN } = process.env;
  if (!MARKET) {
    logger.error("No market selected");
  }
  if (!DISCORD_WEBHOOK_ID) {
    logger.error("No discord webhook id");
  }
  if (!DISCORD_WEBHOOK_TOKEN) {
    logger.error("No discord webhook token");
  }
  if (!MARKET || !DISCORD_WEBHOOK_ID || !DISCORD_WEBHOOK_TOKEN) {
    return -1;
  }
  const bot = new Bot(
    "Brown God (บอทกาว)",
    DISCORD_WEBHOOK_ID,
    DISCORD_WEBHOOK_TOKEN
  );
  bot.sendMessage(MARKET);
}

bootstrap();
