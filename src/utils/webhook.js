const logger = require("./logger");

const setupWebhook = (app, bot) => {
  // Webhook endpoint
  app.post("/webhook", (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Set webhook URL
  bot
    .setWebHook(process.env.WEBHOOK_URL + "/webhook")
    .then(() => {
      logger.info("Webhook set successfully");
    })
    .catch((error) => {
      logger.error("Failed to set webhook:", error);
    });
};

module.exports = { setupWebhook };
