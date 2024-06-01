export interface Configuration {
  botClientId: string;
  logLevel?: string;
  discordWebhookId: string;
  discordWebhookToken: string;
  marketSETOpenCron: string;
  marketSETCloseCron: string;
}

export const configuration: Configuration = {
  botClientId: process.env.BOT_CLIENT_ID,
  logLevel: process.env.LOG_LEVEL || "info",
  discordWebhookId: process.env.DISCORD_WEBHOOK_ID,
  discordWebhookToken: process.env.DISCORD_WEBHOOK_TOKEN,
  marketSETOpenCron: process.env.MARKET_SET_OPEN,
  marketSETCloseCron: process.env.MARKET_SET_CLOSE,
};

export function loadConfiguration(): Configuration {
  const requiredEnvVars = [
    "BOT_CLIENT_ID",
    "DISCORD_WEBHOOK_ID",
    "DISCORD_WEBHOOK_TOKEN",
    "MARKET_SET_OPEN",
    "MARKET_SET_CLOSE",
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
  return errors;
}
