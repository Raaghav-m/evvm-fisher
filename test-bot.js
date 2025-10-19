// Minimal bot test to diagnose the issue
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

console.log("🔍 Testing bot connection...");

// Test the bot token first
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ No bot token found!");
  process.exit(1);
}

console.log("✅ Bot token found:", token.substring(0, 10) + "...");

// Test API connection using child_process to run curl
const { exec } = require("child_process");
const url = `https://api.telegram.org/bot${token}/getMe`;

console.log("🌐 Testing API connection using curl...");

exec(`curl -s "${url}"`, (error, stdout, stderr) => {
  if (error) {
    console.error("❌ Curl error:", error.message);
    process.exit(1);
  }

  if (stderr) {
    console.error("❌ Curl stderr:", stderr);
    process.exit(1);
  }

  try {
    const response = JSON.parse(stdout);
    if (response.ok) {
      console.log("✅ API connection successful!");
      console.log("🤖 Bot info:", response.result);

      // Now try to create the bot
      console.log("\n🚀 Creating bot instance...");
      const bot = new TelegramBot(token, { polling: false });

      console.log("✅ Bot instance created successfully!");
      console.log("📱 Bot username:", response.result.username);
      console.log("🆔 Bot ID:", response.result.id);

      // Test sending a message to yourself (if you know your chat ID)
      console.log("\n💡 To test the bot:");
      console.log("1. Open Telegram");
      console.log("2. Search for:", response.result.username);
      console.log("3. Send /start");
      console.log("4. The bot should respond!");

      process.exit(0);
    } else {
      console.error("❌ API error:", response);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ JSON parse error:", error);
    console.error("Raw response:", stdout);
    process.exit(1);
  }
});
