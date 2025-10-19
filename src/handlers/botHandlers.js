const logger = require("../utils/logger");
const { setupCommandHandlers } = require("./commandHandlers");
const { setupCallbackHandlers } = require("./callbackHandlers");
const { setupMessageHandlers } = require("./messageHandlers");
const { setupErrorHandlers } = require("./errorHandlers");

const setupBotHandlers = (bot) => {
  // Setup command handlers
  setupCommandHandlers(bot);

  // Setup callback query handlers
  setupCallbackHandlers(bot);

  // Setup message handlers
  setupMessageHandlers(bot);

  // Setup error handlers
  setupErrorHandlers(bot);

  logger.info("Bot handlers setup completed");
};

module.exports = { setupBotHandlers };
