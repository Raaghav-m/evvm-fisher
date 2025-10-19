const logger = require("../utils/logger");
const { createMainMenu } = require("../utils/menuUtils");

const setupErrorHandlers = (bot) => {
  // Handle polling errors
  bot.on("polling_error", (error) => {
    logger.error("Polling error:", error);
  });

  // Handle webhook errors
  bot.on("webhook_error", (error) => {
    logger.error("Webhook error:", error);
  });

  // Handle general errors
  bot.on("error", (error) => {
    logger.error("Bot error:", error);
  });

  // Global error handler for unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  });

  // Global error handler for uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    process.exit(1);
  });

  logger.info("Error handlers setup completed");
};

/**
 * Send error message to user
 */
const sendErrorMessage = async (bot, chatId, error, context = "") => {
  try {
    const errorMessage =
      `❌ *Error Occurred*\n\n` +
      `Something went wrong${context ? ` while ${context}` : ""}.\n\n` +
      `Please try again or contact support if the problem persists.`;

    await bot.sendMessage(chatId, errorMessage, {
      parse_mode: "Markdown",
      reply_markup: createMainMenu().reply_markup,
    });

    logger.error(`Error sent to user ${chatId}:`, error);
  } catch (sendError) {
    logger.error("Failed to send error message to user:", sendError);
  }
};

/**
 * Validate user input
 */
const validateInput = (input, type, options = {}) => {
  const errors = [];

  if (!input || input.trim() === "") {
    errors.push("Input cannot be empty");
    return { isValid: false, errors };
  }

  const trimmedInput = input.trim();

  switch (type) {
    case "address":
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedInput)) {
        errors.push("Invalid Ethereum address format");
      }
      break;

    case "private_key":
      const cleanKey = trimmedInput.startsWith("0x")
        ? trimmedInput.slice(2)
        : trimmedInput;
      if (!/^[a-fA-F0-9]{64}$/.test(cleanKey)) {
        errors.push("Invalid private key format");
      }
      break;

    case "username":
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmedInput)) {
        errors.push(
          "Username must be 3-20 characters, alphanumeric and underscores only"
        );
      }
      break;

    case "amount":
      const amount = parseFloat(trimmedInput);
      if (isNaN(amount) || amount <= 0) {
        errors.push("Amount must be a positive number");
      }
      if (options.max && amount > options.max) {
        errors.push(`Amount cannot exceed ${options.max}`);
      }
      if (options.min && amount < options.min) {
        errors.push(`Amount must be at least ${options.min}`);
      }
      break;

    case "nonce":
      const nonce = parseInt(trimmedInput);
      if (isNaN(nonce) || nonce < 0) {
        errors.push("Nonce must be a non-negative integer");
      }
      break;

    case "priority_fee":
      const fee = parseFloat(trimmedInput);
      if (isNaN(fee) || fee < 0) {
        errors.push("Priority fee must be a non-negative number");
      }
      break;

    default:
      errors.push("Unknown validation type");
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: trimmedInput,
  };
};

/**
 * Handle validation errors
 */
const handleValidationError = async (bot, chatId, validation, fieldName) => {
  const errorMessage =
    `❌ *Invalid ${fieldName}*\n\n` +
    validation.errors.join("\n") +
    `\n\nPlease try again:`;

  await bot.sendMessage(chatId, errorMessage, {
    parse_mode: "Markdown",
  });
};

/**
 * Safe async operation wrapper
 */
const safeAsync = async (operation, errorContext = "") => {
  try {
    return await operation();
  } catch (error) {
    logger.error(`Error in ${errorContext}:`, error);
    throw error;
  }
};

/**
 * Retry operation with exponential backoff
 */
const retryOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(
        `Operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Rate limiting helper
 */
const rateLimiter = new Map();

const checkRateLimit = (userId, operation, limit = 10, windowMs = 60000) => {
  const key = `${userId}_${operation}`;
  const now = Date.now();

  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, []);
  }

  const requests = rateLimiter.get(key);

  // Remove old requests outside the window
  const validRequests = requests.filter(
    (timestamp) => now - timestamp < windowMs
  );
  rateLimiter.set(key, validRequests);

  if (validRequests.length >= limit) {
    return false;
  }

  validRequests.push(now);
  return true;
};

/**
 * Clean up rate limiter periodically
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes

  for (const [key, requests] of rateLimiter.entries()) {
    const validRequests = requests.filter(
      (timestamp) => now - timestamp < maxAge
    );
    if (validRequests.length === 0) {
      rateLimiter.delete(key);
    } else {
      rateLimiter.set(key, validRequests);
    }
  }
}, 60000); // Clean up every minute

module.exports = {
  setupErrorHandlers,
  sendErrorMessage,
  validateInput,
  handleValidationError,
  safeAsync,
  retryOperation,
  checkRateLimit,
};
