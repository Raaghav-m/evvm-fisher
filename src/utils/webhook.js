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

  // Set webhook URL only if WEBHOOK_URL is properly configured
  if (
    process.env.WEBHOOK_URL &&
    process.env.WEBHOOK_URL !== "https://yourdomain.com/webhook"
  ) {
    bot
      .setWebHook(process.env.WEBHOOK_URL + "/webhook")
      .then(() => {
        logger.info("Webhook set successfully");
      })
      .catch((error) => {
        logger.error("Failed to set webhook:", error);
      });
  } else {
    logger.warn("Webhook URL not properly configured, using polling mode");
  }
};

module.exports = { setupWebhook };
