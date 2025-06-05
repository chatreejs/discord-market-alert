import moduleAlias from "module-alias";
moduleAlias.addAliases({
  "@configs": `${__dirname}/configs`,
  "@constants": `${__dirname}/constants`,
  "@enums": `${__dirname}/enums`,
  "@interfaces": `${__dirname}/interfaces`,
  "@services": `${__dirname}/services`,
  "@utils": `${__dirname}/utils`,
});

import { configure, getLogger, shutdown } from "log4js";

import { Configuration, loadConfiguration } from "@configs";
import { LOG_BAR } from "@constants";
import { AlertScheduler } from "@services";
import { APP_VERSION } from "./version";

process.on("SIGINT", function () {
  logger.info("Caught interrupt signal");
  shutdown(() => {
    process.exit(0);
  });
});

const configLogger = () => {
  configure({
    appenders: {
      console: { type: "console" },
      file: { type: "file", filename: `logs/discord-market-alert.log` },
      errorFile: {
        type: "file",
        filename: `logs/discord-market-alert-error.log`,
      },
      filterError: {
        type: "logLevelFilter",
        appender: "errorFile",
        level: "error",
      },
    },
    categories: {
      default: {
        appenders: ["console", "file", "filterError"],
        level: "debug",
      },
    },
  });
};

const logger = getLogger("[main]");
configLogger();

logger.info("Discord Market Alert Bot 🤖");
logger.info(`Version: ${APP_VERSION}`);

let configuration: Configuration;
try {
  logger.info("Loading configuration");
  configuration = loadConfiguration();
  logger.level = configuration.logLevel;
  logger.debug("Configuration:");
  logger.debug(`- BOT Client ID: ${configuration.botClientId}`);
  logger.debug(`- Discord Webhook ID: ${configuration.discordWebhookId}`);
  logger.debug(`- Discord Webhook Token: ${configuration.discordWebhookToken}`);
  logger.debug(`- Enabled Market: ${configuration.enableMarket}`);
  logger.info("Configuration loaded");
  logger.info(LOG_BAR);

  logger.info("Running Alert Scheduler");
  const scheduler = new AlertScheduler(configuration);
  scheduler.start();
  logger.info(LOG_BAR);
  logger.info("All tasks started. Waiting for trigger.");
} catch (error: any) {
  logger.error(error.message);
  shutdown(() => {
    process.exit(1);
  });
}
