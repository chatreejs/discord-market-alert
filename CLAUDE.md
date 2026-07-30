# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Discord bot that posts stock market index alerts (SET and NASDAQ) to Discord channels via webhooks. It runs as a long-lived process driven by cron schedules — there is no HTTP server. On a scheduled trigger it checks whether today is a trading day, fetches index data, and sends a formatted Discord embed.

The project runs TypeScript **natively on Node.js (>= 24)** via type stripping — there is no build/transpile step. Source in `src/` is executed directly (`node src/main.ts`). The runtime module system is native **ESM** (`"type": "module"` in `package.json`). Node version is pinned in `.tool-versions` (asdf).

## Commands

```bash
yarn install            # install dependencies
yarn typecheck          # tsc (noEmit) — type-check only, produces no output
yarn gen:version        # regenerate src/version.ts from package.json version
yarn start              # generates src/version.ts (prestart), then env-cmd -f .env.develop node src/main.ts
yarn dev                # same as start but with node --watch
```

There is no test suite or linter configured. `yarn start` requires a `.env.develop` file (copy from `.env.example`).

`gen:version` (run automatically via `prestart`) writes the `package.json` version into `src/version.ts`, so that file is generated — do not edit it by hand.

Because Node only strips types (it does not transform), the source must use **erasable** TypeScript only: no `enum`, `namespace`, or parameter-property runtime constructs, and **type-only imports must use `import type`** (or inline `type`). `tsconfig.json` enforces this with `verbatimModuleSyntax` + `erasableSyntaxOnly`. Relative imports must include the `.ts` extension (ESM requirement).

## Configuration

All config comes from environment variables, loaded and validated in `src/configs/configuration.ts`. Required vars (`BOT_API_TOKEN`, `DISCORD_WEBHOOK_ID`, `DISCORD_WEBHOOK_TOKEN`, `ENABLE_MARKET`) cause startup to throw if missing. See `.env.example` for the full set.

- `ENABLE_MARKET` is comma-separated and must match the `Market` values (`SET`, `NASDAQ`). `Market` and `AlertType` are `as const` objects (not `enum`s) so they remain erasable for native type stripping.
- `DISCORD_WEBHOOK_ID` / `DISCORD_WEBHOOK_TOKEN` are comma-separated parallel lists — the bot sends to every webhook in the list (positional pairing by index).
- Per-market cron schedules are read dynamically as `MARKET_{MARKET}_OPEN_CRON`, `MARKET_{MARKET}_CLOSE_CRON`, and `MARKET_{MARKET}_CRON_TZ` for each enabled market.

## Architecture

The flow is a chain of single-responsibility services constructed top-down from `main.ts`:

```
main.ts → AlertScheduler → DiscordBot → MarketData (Api | Scraper)
                        └→ TradingDayValidator → FinancialHoliday
```

- **`AlertScheduler`** (`src/services/alert-scheduler/`) — creates two `CronJob`s per enabled market: market-open (`AlertType.MARKET_OPEN`) and market-close (`AlertType.MARKET_BRIEFING`). On each trigger it first calls `TradingDayValidator`, and only sends an alert if today is a trading day.
- **`TradingDayValidator`** (`src/services/trading-day-validator/`) — returns false on weekends (per the market's timezone via moment-timezone: `Asia/Bangkok` for SET, `America/New_York` for NASDAQ) or if the date is in the holiday list.
- **`FinancialHoliday`** (`src/services/financial-holiday/`) — fetches holidays per market: Thai holidays from the Bank of Thailand API (`gateway.api.bot.or.th`, requires `BOT_API_TOKEN`), US holidays from `date.nager.at`.
- **`MarketData`** (`src/services/market-data/`) — abstract base with two concrete implementations. `MarketDataApi` is the API-based source `DiscordBot` uses for both markets: NASDAQ from `api.nasdaq.com` via axios, and the SET index from `set.or.th`'s JSON API. The SET endpoint sits behind Imperva Incapsula bot protection that rejects plain HTTP clients (403 + JS challenge), so `getSETIndexMarketData` launches Puppeteer, loads the SET site to solve the challenge and obtain cookies, then calls the JSON API from inside the browser context. `MarketDataScraper` is a legacy fallback that scrapes SET from `settrade.com` via Puppeteer + XPath.
- **`DiscordBot`** (`src/services/discord-bot/`) — builds the Discord embeds (titles and footers are in Thai) and sends them to all configured webhooks. SET dates use Buddhist-era year formatting via `toBuddhistYear` from `#utils`.

### Conventions

- **Path aliases** use Node.js [subpath imports](https://nodejs.org/api/packages.html#subpath-imports) declared in `package.json` `"imports"`: `#configs`, `#constants`, `#enums`, `#interfaces`, `#services`, `#utils` (they must start with `#`, not `@`). Each maps to that directory's barrel `index.ts`. Import from the alias (e.g. `import { DiscordBot } from "#services"`), not the deep file path. This replaced the old `module-alias` + `tsconfig` `paths` setup, which did not work under native ESM.
- **Logging** uses `log4js`. Each service creates its own named logger (e.g. `getLogger("[DiscordBot]")`) and sets `logger.level` from `configuration.logLevel`. Logs go to console plus `logs/*.log` files.

## Deployment

`Dockerfile` runs on `node:24-alpine` with Chromium installed for Puppeteer (`PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`). There is no build stage — the image installs production deps, generates `src/version.ts`, and runs `node src/main.ts` directly (native TypeScript). CI is Jenkins (`ci/jenkinsfiles/`): SonarQube scan → Docker build → Trivy scan → push to Docker Hub → deploy via GitOps to Kubernetes. The `VERSION` in the Jenkinsfiles is kept in sync with `package.json`.
