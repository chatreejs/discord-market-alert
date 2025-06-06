import { Market } from "@enums";

interface CrontabConfig {
  open: string;
  close: string;
  timezone: string;
}

export interface Configuration {
  logLevel?: string;
  botClientId: string;
  discordBotName?: string;
  discordWebhookId: string[];
  discordWebhookToken: string[];
  enableMarket: string[];
  crontabConfig: Map<Market, CrontabConfig>;
}

const configuration: Configuration = {
  logLevel: process.env.LOG_LEVEL || "info",
  botClientId: process.env.BOT_CLIENT_ID,
  discordBotName: process.env.DISCORD_BOT_NAME || "Market Alert Bot",
  discordWebhookId: process.env.DISCORD_WEBHOOK_ID.split(","),
  discordWebhookToken: process.env.DISCORD_WEBHOOK_TOKEN.split(","),
  enableMarket: process.env.ENABLE_MARKET
    ? process.env.ENABLE_MARKET.split(",")
    : [],
  crontabConfig: new Map<Market, CrontabConfig>(),
};

export function loadConfiguration(): Configuration {
  const requiredEnvVars = [
    "BOT_CLIENT_ID",
    "DISCORD_WEBHOOK_ID",
    "DISCORD_WEBHOOK_TOKEN",
    "ENABLE_MARKET",
  ];
  const errorEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  if (errorEnvVars.length > 0) {
    throw new Error(
      `Missing environment variables: ${errorEnvVars.join(", ")}`
    );
  }

  const config = configuration;
  config.enableMarket.forEach((market) => {
    config.crontabConfig.set(market as Market, {
      open: process.env[`MARKET_${market}_OPEN_CRON`],
      close: process.env[`MARKET_${market}_CLOSE_CRON`],
      timezone: process.env[`MARKET_${market}_CRON_TZ`],
    });
  });
  const errors = validateConfiguration(config);
  if (errors.length > 0) {
    throw new Error(`Invalid configuration: ${errors.join(", ")}`);
  }

  return config;
}

function validateConfiguration(config: Configuration): string[] {
  const errors = [];
  // check enableMarket in Market enum
  if (config.enableMarket.length > 0) {
    const invalidMarkets = config.enableMarket.filter(
      (market) => !Object.values(Market).includes(market as Market)
    );
    if (invalidMarkets.length > 0) {
      errors.push(`Invalid market: ${invalidMarkets.join(", ")}`);
    }
    // check cronConfig for all enabled markets
    config.enableMarket.forEach((market) => {
      const crontab = config.crontabConfig.get(market as Market);
      if (crontab.open === undefined || crontab.close === undefined) {
        errors.push(`Missing crontab config for ${market}`);
      }
    });
  }
  return errors;
}
