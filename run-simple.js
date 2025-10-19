// Simple script to run the bot without webhook
require("dotenv").config();

// Remove webhook URL to force polling mode
delete process.env.WEBHOOK_URL;

// Now start the bot
require("./src/index.js");
