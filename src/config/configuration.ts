import { AlertType, Market } from "../common/enums";

export interface Configuration {
  market: string;
  alertType: string;
  discordWebhookId: string;
  discordWebhookToken: string;
  logLevel?: string;
}

export const configuration: Configuration = {
  market: process.env.MARKET,
  alertType: process.env.ALERT_TYPE,
  discordWebhookId: process.env.DISCORD_WEBHOOK_ID,
  discordWebhookToken: process.env.DISCORD_WEBHOOK_TOKEN,
  logLevel: process.env.LOG_LEVEL || "info",
};

export function loadConfiguration(): Configuration {
  const requiredEnvVars = [
    "MARKET",
    "ALERT_TYPE",
    "DISCORD_WEBHOOK_ID",
    "DISCORD_WEBHOOK_TOKEN",
  ];
  const errorEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
  if (errorEnvVars.length > 0) {
    throw new Error(
      `Missing environment variables: ${errorEnvVars.join(", ")}`
    );
  }

  const config = configuration;
  const errors = validateConfiguration(config);
  if (errors.length > 0) {
    throw new Error(`Invalid configuration: ${errors.join(", ")}`);
  }
  return config;
}

function validateConfiguration(config: Configuration): string[] {
  const errors = [];
  if (!(config.market in Market)) {
    errors.push(`MARKET: ${config.market}`);
  }
  if (!(config.alertType in AlertType)) {
    errors.push(`ALERT_TYPE: ${config.alertType}`);
  }
  return errors;
}
