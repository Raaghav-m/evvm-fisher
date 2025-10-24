require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const logger = require("./utils/logger");
const { validateConfig } = require("./utils/config");
const { setupBotHandlers } = require("./handlers/botHandlers");
const { setupWebhook } = require("./utils/webhook");

// Validate configuration
validateConfig();

// Initialize Express app for webhook
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize Telegram Bot
const bot = new TelegramBot(
  process.env.TELEGRAM_BOT_TOKEN ||
    "8375332170:AAGfFHJBphJA-wsSf9azpkoFSPos7hqXZ28",
  {
    polling: {
      interval: 300,
      autoStart: !process.env.WEBHOOK_URL,
      params: {
        timeout: 10
      }
    },
    request: {
      agentOptions: {
        keepAlive: true,
        family: 4
      }
    }
  }
);

// Setup bot handlers
setupBotHandlers(bot);

// Add error handling for polling
bot.on('polling_error', (error) => {
  logger.error('Polling error:', error);
  // Don't exit on polling errors, just log them
});

bot.on('error', (error) => {
  logger.error('Bot error:', error);
});

// Setup webhook if configured
if (process.env.WEBHOOK_URL) {
  setupWebhook(app, bot);
}

// Start server if using webhook
if (process.env.WEBHOOK_URL) {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Webhook URL: ${process.env.WEBHOOK_URL}`);
  });
} else {
  logger.info("Bot started with polling mode");
}

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

module.exports = { bot, app };
