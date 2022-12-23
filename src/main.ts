import config from "config";
import { CronJob } from "cron";
import { Bot } from "./bot";

function bootstrap() {
  const bot = new Bot("Brown God (บอทกาว)");
  const SETIndexJob = new CronJob(
    config.get("cron.SET"),
    function () {
      bot.sendMessage("SET");
    },
    null,
    false,
    "Asia/Bangkok"
  );

  SETIndexJob.start();
  // bot.sendMessage("SET");
}

bootstrap();
