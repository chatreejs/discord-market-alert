import { configure, getLogger, shutdown } from "log4js";
import "module-alias/register";
import moment from "moment-timezone";

import { Configuration, loadConfiguration } from "@configs";
import { logBar } from "@constants";
import { AlertScheduler } from "@services";

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

  // Create Alert Scheduler
  logger.info("Creating Alert Scheduler");
  const scheduler = new AlertScheduler(configuration);
  scheduler.create();
} catch (error: any) {
  logger.error(error.message);
  shutdown(() => {
    process.exit(1);
  });
}
