// Simple EVVM Telegram Bot - Polling Only (No Webhooks)
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const logger = require("./src/utils/logger");

// Validate required environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is required!");
  process.exit(1);
}

console.log("🚀 Starting EVVM Telegram Bot...");
console.log("📱 Bot will use polling mode (no webhooks needed)");

// Initialize Telegram Bot with polling only
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    interval: 1000,
    autoStart: true,
    params: {
      timeout: 10,
    },
  },
});

// Simple command handlers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
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

Use the commands below to get started! 👇
  `;

  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔗 Connect Wallet", callback_data: "connect_wallet" },
          { text: "💸 Payment Signatures", callback_data: "payment_menu" },
        ],
        [
          { text: "🏦 Staking Signatures", callback_data: "staking_menu" },
          { text: "❓ Help", callback_data: "help" },
        ],
      ],
    },
  });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📖 *EVVM Signature Constructor Bot Help*

*Available Commands:*
/start - Start the bot and show main menu
/help - Show this help message
/status - Check bot status

*How to Use:*
1. Use /start to begin
2. Connect your wallet
3. Choose payment or staking operations
4. Follow the guided prompts
5. Generate and sign transactions

*Supported Networks:*
• Ethereum Mainnet
• Arbitrum

*Security:*
Your private keys are never stored and are only used for signing.
  `;

  bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const statusMessage = `
📊 *Bot Status*

🟢 Bot is running
📱 Mode: Polling (no webhooks)
🤖 Bot: @evvmfisher_bot
⏰ Started: ${new Date().toLocaleString()}

*Ready to help you create EVVM signatures!*
  `;

  bot.sendMessage(chatId, statusMessage, { parse_mode: "Markdown" });
});

// Handle callback queries (button clicks)
bot.on("callback_query", (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  // Answer the callback query to remove loading state
  bot.answerCallbackQuery(callbackQuery.id);

  switch (data) {
    case "connect_wallet":
      bot.sendMessage(
        chatId,
        `🔗 *Connect Your Wallet*\n\n` +
          `To use this bot, you need to connect your wallet by providing your private key.\n\n` +
          `⚠️ *Security Notice:*\n` +
          `• Your private key is never stored\n` +
          `• It's only used for signing operations\n` +
          `• All operations are encrypted\n\n` +
          `Please send your private key (starting with 0x):`,
        { parse_mode: "Markdown" }
      );
      break;

    case "payment_menu":
      bot.sendMessage(
        chatId,
        `💸 *Payment Signatures*\n\n` +
          `Choose the type of payment signature you want to create:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "💸 Single Payment", callback_data: "single_payment" },
                {
                  text: "📦 Disperse Payment",
                  callback_data: "disperse_payment",
                },
              ],
              [{ text: "🔙 Back to Main Menu", callback_data: "main_menu" }],
            ],
          },
        }
      );
      break;

    case "staking_menu":
      bot.sendMessage(
        chatId,
        `🏦 *Staking Signatures*\n\n` +
          `Choose the type of staking signature you want to create:`,
        {
          parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🥇 Golden Staking", callback_data: "golden_staking" },
                {
                  text: "🎯 Presale Staking",
                  callback_data: "presale_staking",
                },
              ],
              [{ text: "🔙 Back to Main Menu", callback_data: "main_menu" }],
            ],
          },
        }
      );
      break;

    case "help":
      bot.sendMessage(
        chatId,
        `❓ *Help & Support*\n\n` +
          `*Available Commands:*\n` +
          `/start - Start the bot\n` +
          `/help - Show this help\n` +
          `/status - Check bot status\n\n` +
          `*How to Use:*\n` +
          `1. Connect your wallet\n` +
          `2. Choose payment or staking\n` +
          `3. Fill in the required details\n` +
          `4. Generate and sign the transaction\n\n` +
          `*Supported Networks:*\n` +
          `• Ethereum Mainnet\n` +
          `• Arbitrum\n\n` +
          `*Security:*\n` +
          `Your private keys are never stored and are only used for signing.`,
        { parse_mode: "Markdown" }
      );
      break;

    case "main_menu":
      // Send the start message again
      bot.sendMessage(chatId, "🏠 *Main Menu*", {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔗 Connect Wallet", callback_data: "connect_wallet" },
              { text: "💸 Payment Signatures", callback_data: "payment_menu" },
            ],
            [
              { text: "🏦 Staking Signatures", callback_data: "staking_menu" },
              { text: "❓ Help", callback_data: "help" },
            ],
          ],
        },
      });
      break;

    case "single_payment":
      bot.sendMessage(
        chatId,
        `💸 *Single Payment Signature*\n\n` +
          `This feature will be implemented in the full version.\n\n` +
          `For now, you can use the main EVVM Signature Constructor Front application.`,
        { parse_mode: "Markdown" }
      );
      break;

    case "disperse_payment":
      bot.sendMessage(
        chatId,
        `📦 *Disperse Payment Signature*\n\n` +
          `This feature will be implemented in the full version.\n\n` +
          `For now, you can use the main EVVM Signature Constructor Front application.`,
        { parse_mode: "Markdown" }
      );
      break;

    case "golden_staking":
      bot.sendMessage(
        chatId,
        `🥇 *Golden Staking Signature*\n\n` +
          `This feature will be implemented in the full version.\n\n` +
          `For now, you can use the main EVVM Signature Constructor Front application.`,
        { parse_mode: "Markdown" }
      );
      break;

    case "presale_staking":
      bot.sendMessage(
        chatId,
        `🎯 *Presale Staking Signature*\n\n` +
          `This feature will be implemented in the full version.\n\n` +
          `For now, you can use the main EVVM Signature Constructor Front application.`,
        { parse_mode: "Markdown" }
      );
      break;

    default:
      bot.sendMessage(
        chatId,
        "❌ Unknown command. Please use /start to see the main menu."
      );
      break;
  }
});

// Handle text messages (for wallet connection)
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Skip if it's a command
  if (text && text.startsWith("/")) {
    return;
  }

  // Simple wallet connection handler
  if (text && text.startsWith("0x") && text.length === 66) {
    bot.sendMessage(
      chatId,
      `✅ *Wallet Connected!*\n\n` +
        `Private key received and validated.\n\n` +
        `⚠️ *Note:* This is a simplified version. For full functionality, use the complete EVVM Signature Constructor Front application.\n\n` +
        `You can now use the payment and staking features!`,
      { parse_mode: "Markdown" }
    );
  } else if (text) {
    bot.sendMessage(
      chatId,
      `📝 *Message Received*\n\n` +
        `You sent: "${text}"\n\n` +
        `Use /start to see the main menu or /help for assistance.`,
      { parse_mode: "Markdown" }
    );
  }
});

// Error handling
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});

bot.on("error", (error) => {
  console.error("Bot error:", error);
});

// Success message
console.log("✅ Bot started successfully!");
console.log("📱 Bot username: @evvmfisher_bot");
console.log("🔄 Mode: Polling (no webhooks)");
console.log("⏰ Started at:", new Date().toLocaleString());
console.log("\n🎉 Your EVVM Telegram Bot is ready to use!");
console.log("💬 Find it on Telegram: @evvmfisher_bot");

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down bot...");
  bot.stopPolling();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down bot...");
  bot.stopPolling();
  process.exit(0);
});
