// Simple polling-only bot runner
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const logger = require("./src/utils/logger");
const { validateConfig } = require("./src/utils/config");
const { setupBotHandlers } = require("./src/handlers/botHandlers");

// Validate configuration
validateConfig();

// Initialize Telegram Bot with polling only
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true, // Force polling mode
});

// Setup bot handlers
setupBotHandlers(bot);

logger.info("Bot started with polling mode - no web server needed!");

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("Shutting down bot...");
  bot.stopPolling();
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Shutting down bot...");
  bot.stopPolling();
  process.exit(0);
});
