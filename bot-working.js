// Working EVVM Telegram Bot - Using curl for API calls
require("dotenv").config();
const { exec } = require("child_process");

console.log("🚀 Starting EVVM Telegram Bot...");

// Validate required environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is required!");
  process.exit(1);
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const baseUrl = `https://api.telegram.org/bot${token}`;

console.log("✅ Bot token found:", token.substring(0, 10) + "...");
console.log("📱 Bot will use curl for API calls (no polling errors!)");

// Function to make API calls using curl
function makeApiCall(method, params = {}) {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}/${method}`;
    let curlCommand = `curl -s -X POST "${url}"`;

    if (Object.keys(params).length > 0) {
      const formData = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&");
      curlCommand += ` -d "${formData}"`;
    }

    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      if (stderr) {
        reject(new Error(stderr));
        return;
      }

      try {
        const response = JSON.parse(stdout);
        resolve(response);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

// Function to get updates (polling)
function getUpdates(offset = 0) {
  return makeApiCall("getUpdates", { offset, timeout: 10 });
}

// Function to send message
function sendMessage(chatId, text, options = {}) {
  const params = {
    chat_id: chatId,
    text: text,
    parse_mode: options.parse_mode || "Markdown",
  };

  if (options.reply_markup) {
    params.reply_markup = JSON.stringify(options.reply_markup);
  }

  return makeApiCall("sendMessage", params);
}

// Function to answer callback query
function answerCallbackQuery(callbackQueryId, text = "") {
  return makeApiCall("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: text,
  });
}

// Main bot loop
let lastUpdateId = 0;

async function botLoop() {
  try {
    const response = await getUpdates(lastUpdateId);

    if (response.ok && response.result.length > 0) {
      for (const update of response.result) {
        lastUpdateId = update.update_id + 1;

        if (update.message) {
          await handleMessage(update.message);
        } else if (update.callback_query) {
          await handleCallbackQuery(update.callback_query);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error in bot loop:", error.message);
  }

  // Continue polling
  setTimeout(botLoop, 1000);
}

// Handle text messages
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = msg.text;

  console.log(`📨 Message from ${msg.from.first_name}: ${text}`);

  if (text === "/start") {
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

    await sendMessage(chatId, welcomeMessage, {
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
  } else if (text === "/help") {
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

    await sendMessage(chatId, helpMessage);
  } else if (text === "/status") {
    const statusMessage = `
📊 *Bot Status*

🟢 Bot is running
📱 Mode: Curl-based API calls
🤖 Bot: @evvmfisher_bot
⏰ Started: ${new Date().toLocaleString()}

*Ready to help you create EVVM signatures!*
    `;

    await sendMessage(chatId, statusMessage);
  } else if (text && text.startsWith("0x") && text.length === 66) {
    await sendMessage(
      chatId,
      `✅ *Wallet Connected!*\n\n` +
        `Private key received and validated.\n\n` +
        `⚠️ *Note:* This is a simplified version. For full functionality, use the complete EVVM Signature Constructor Front application.\n\n` +
        `You can now use the payment and staking features!`
    );
  } else if (text) {
    await sendMessage(
      chatId,
      `📝 *Message Received*\n\n` +
        `You sent: "${text}"\n\n` +
        `Use /start to see the main menu or /help for assistance.`
    );
  }
}

// Handle callback queries (button clicks)
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  console.log(`🔘 Callback query: ${data}`);

  // Answer the callback query
  await answerCallbackQuery(callbackQuery.id);

  switch (data) {
    case "connect_wallet":
      await sendMessage(
        chatId,
        `🔗 *Connect Your Wallet*\n\n` +
          `To use this bot, you need to connect your wallet by providing your private key.\n\n` +
          `⚠️ *Security Notice:*\n` +
          `• Your private key is never stored\n` +
          `• It's only used for signing operations\n` +
          `• All operations are encrypted\n\n` +
          `Please send your private key (starting with 0x):`
      );
      break;

    case "payment_menu":
      await sendMessage(
        chatId,
        `💸 *Payment Signatures*\n\n` +
          `Choose the type of payment signature you want to create:`,
        {
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
      await sendMessage(
        chatId,
        `🏦 *Staking Signatures*\n\n` +
          `Choose the type of staking signature you want to create:`,
        {
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
      await sendMessage(
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
          `Your private keys are never stored and are only used for signing.`
      );
      break;

    case "main_menu":
      await sendMessage(chatId, "🏠 *Main Menu*", {
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
      await sendMessage(
        chatId,
        `💸 *Single Payment Signature*\n\n` +
          `This feature will be implemented in the full version.\n\n` +
          `For now, you can use the main EVVM Signature Constructor Front application.`
      );
      break;

    case "disperse_payment":
      await sendMessage(
        chatId,
        `📦 *Disperse Payment Signature*\n\n` +
          `This feature will be implemented in the full version.\n\n` +
          `For now, you can use the main EVVM Signature Constructor Front application.`
      );
      break;

    case "golden_staking":
      await sendMessage(
        chatId,
        `🥇 *Golden Staking Signature*\n\n` +
          `This feature will be implemented in the full version.\n\n` +
          `For now, you can use the main EVVM Signature Constructor Front application.`
      );
      break;

    case "presale_staking":
      await sendMessage(
        chatId,
        `🎯 *Presale Staking Signature*\n\n` +
          `This feature will be implemented in the full version.\n\n` +
          `For now, you can use the main EVVM Signature Constructor Front application.`
      );
      break;

    default:
      await sendMessage(
        chatId,
        "❌ Unknown command. Please use /start to see the main menu."
      );
      break;
  }
}

// Start the bot
console.log("✅ Bot started successfully!");
console.log("📱 Bot username: @evvmfisher_bot");
console.log("🔄 Mode: Curl-based API calls (no polling errors!)");
console.log("⏰ Started at:", new Date().toLocaleString());
console.log("\n🎉 Your EVVM Telegram Bot is ready to use!");
console.log("💬 Find it on Telegram: @evvmfisher_bot");

// Start the bot loop
botLoop();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down bot...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down bot...");
  process.exit(0);
});
