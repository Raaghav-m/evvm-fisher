const logger = require("../utils/logger");
const { createMainMenu } = require("../utils/menuUtils");
const { getUserSession, createUserSession } = require("../utils/sessionUtils");

const setupCommandHandlers = (bot) => {
  // Start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      // Create or get user session
      let userSession = getUserSession(userId);
      if (!userSession) {
        userSession = createUserSession(userId);
      }

      const welcomeMessage = `
🚀 *Welcome to EVVM Signature Constructor Bot!*

This bot helps you create and sign EVVM (Ethereum Virtual Virtual Machine) transactions for:
• Payment signatures (single & batch)
• Staking signatures (golden & presale)

*Features:*
✅ Connect your wallet securely
✅ Create payment signatures
✅ Create staking signatures
✅ Support for Ethereum & Arbitrum networks
✅ Secure signature generation

*Security Note:* Your private keys are never stored and are only used for signing operations.

Use the menu below to get started! 👇
      `;

      await bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: "Markdown",
        reply_markup: createMainMenu(),
      });

      logger.info(`User ${userId} started the bot`);
    } catch (error) {
      logger.error("Error in start command:", error);
      await bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  });

  // Help command
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;

    try {
      const helpMessage = `
📖 *EVVM Signature Constructor Bot Help*

*Available Commands:*
/start - Start the bot and show main menu
/help - Show this help message
/status - Check bot status and your session info
/clear - Clear your current session data
/cancel - Cancel current operation

*How to Use:*

1️⃣ *Connect Wallet*
   • Use the "Connect Wallet" button
   • Enter your private key securely
   • Your key is never stored

2️⃣ *Payment Signatures*
   • Single Payment: Send to one recipient
   • Disperse Payment: Send to multiple recipients
   • Choose between username or address

3️⃣ *Staking Signatures*
   • Golden Staking: Public staking operations
   • Presale Staking: Presale staking operations
   • Support for stake/unstake actions

*Supported Networks:*
• Ethereum Mainnet
• Arbitrum

*Security Features:*
• Private keys are never stored
• All operations are encrypted
• Secure signature generation
• Input validation

*Need Support?*
Contact the EVVM team for assistance.
      `;

      await bot.sendMessage(chatId, helpMessage, {
        parse_mode: "Markdown",
        reply_markup: createMainMenu(),
      });
    } catch (error) {
      logger.error("Error in help command:", error);
      await bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  });

  // Status command
  bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const userSession = getUserSession(userId);

      let statusMessage = `📊 *Bot Status*\n\n`;
      statusMessage += `🟢 Bot is running\n`;
      statusMessage += `👤 User ID: ${userId}\n`;
      statusMessage += `💬 Chat ID: ${chatId}\n\n`;

      if (userSession) {
        statusMessage += `📝 *Session Info:*\n`;
        statusMessage += `• Wallet Connected: ${
          userSession.wallet ? "✅" : "❌"
        }\n`;
        statusMessage += `• Current Network: ${
          userSession.network || "Not set"
        }\n`;
        statusMessage += `• Current Operation: ${
          userSession.currentOperation || "None"
        }\n`;
        statusMessage += `• Session Created: ${new Date(
          userSession.createdAt
        ).toLocaleString()}\n`;
      } else {
        statusMessage += `📝 *Session Info:*\n`;
        statusMessage += `• No active session\n`;
      }

      await bot.sendMessage(chatId, statusMessage, {
        parse_mode: "Markdown",
        reply_markup: createMainMenu(),
      });
    } catch (error) {
      logger.error("Error in status command:", error);
      await bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  });

  // Clear command
  bot.onText(/\/clear/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const { clearUserSession } = require("../utils/sessionUtils");
      clearUserSession(userId);

      await bot.sendMessage(chatId, "🧹 Session data cleared successfully!", {
        reply_markup: createMainMenu(),
      });

      logger.info(`User ${userId} cleared their session`);
    } catch (error) {
      logger.error("Error in clear command:", error);
      await bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  });

  // Cancel command
  bot.onText(/\/cancel/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const userSession = getUserSession(userId);
      if (userSession) {
        userSession.currentOperation = null;
        userSession.operationData = {};
      }

      await bot.sendMessage(
        chatId,
        "❌ Operation cancelled. Returning to main menu.",
        {
          reply_markup: createMainMenu(),
        }
      );

      logger.info(`User ${userId} cancelled their operation`);
    } catch (error) {
      logger.error("Error in cancel command:", error);
      await bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  });

  logger.info("Command handlers setup completed");
};

module.exports = { setupCommandHandlers };
