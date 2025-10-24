const logger = require("../utils/logger");
const {
  getUserSession,
  updateOperationData,
  clearCurrentOperation,
} = require("../utils/sessionUtils");
const { createMainMenu, createCancelMenu } = require("../utils/menuUtils");
const {
  setupPaymentHandlers,
  setupStakingHandlers,
  setupWalletHandlers,
} = require("./operationHandlers");

const setupMessageHandlers = (bot) => {
  // Handle text messages
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    // Skip if it's a command (handled by command handlers)
    if (text && text.startsWith("/")) {
      return;
    }

    try {
      const userSession = getUserSession(userId);
      if (!userSession) {
        await bot.sendMessage(
          chatId,
          "❌ No active session found. Please use /start to begin.",
          { reply_markup: createMainMenu().reply_markup }
        );
        return;
      }

      // Handle based on current operation
      if (userSession.currentOperation) {
        await handleOperationMessage(bot, chatId, userId, text, userSession);
      } else {
        // No active operation, show main menu
        await bot.sendMessage(
          chatId,
          "Please use the menu below to get started:",
          { reply_markup: createMainMenu().reply_markup }
        );
      }
    } catch (error) {
      logger.error("Error handling message:", error);
      await bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  });

  logger.info("Message handlers setup completed");
};

const handleOperationMessage = async (
  bot,
  chatId,
  userId,
  text,
  userSession
) => {
  const operation = userSession.currentOperation;
  const operationData = userSession.operationData;

  switch (operation) {
    case "setup_contract":
      await handleContractSetup(bot, chatId, userId, text);
      break;

    case "connect_wallet":
      await handleWalletConnection(bot, chatId, userId, text);
      break;

    case "single_payment":
      await handleSinglePaymentMessage(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "disperse_payment":
      await handleDispersePaymentMessage(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "golden_staking":
      await handleGoldenStakingMessage(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "presale_staking":
      await handlePresaleStakingMessage(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    default:
      logger.warn(`Unknown operation: ${operation} for user ${userId}`);
      await bot.sendMessage(
        chatId,
        "❌ Unknown operation. Returning to main menu.",
        { reply_markup: createMainMenu().reply_markup }
      );
      clearCurrentOperation(userId);
      break;
  }
};

const handleContractSetup = async (bot, chatId, userId, text) => {
  try {
    const { isValidAddress } = require("../utils/validation");
    const { updateUserSession } = require("../utils/sessionUtils");

    const contractAddress = text.trim();

    if (!isValidAddress(contractAddress)) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid Contract Address*\n\n" +
          "Please enter a valid Ethereum contract address (42 characters starting with 0x).",
        {
          parse_mode: "Markdown",
          reply_markup: createCancelMenu().reply_markup,
        }
      );
      return;
    }

    // Save contract address to user session
    updateUserSession(userId, { evvmContractAddress: contractAddress });
    clearCurrentOperation(userId);

    await bot.sendMessage(
      chatId,
      `✅ *EVVM Contract Address Set*\n\n` +
        `Contract: \`${contractAddress}\`\n\n` +
        `You can now use the bot to create signatures!`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );

    logger.info(`User ${userId} set EVVM contract: ${contractAddress}`);
  } catch (error) {
    logger.error("Error setting contract address:", error);
    await bot.sendMessage(
      chatId,
      "❌ *Error Setting Contract*\n\n" +
        "There was an error setting the contract address. Please try again.",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
  }
};

const handleWalletConnection = async (bot, chatId, userId, text) => {
  try {
    const { createWallet } = require("../utils/walletUtils");
    const { isValidPrivateKey } = require("../utils/validation");
    const { setWallet } = require("../utils/sessionUtils");

    // Validate private key
    if (!isValidPrivateKey(text)) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid Private Key*\n\n" +
          "Please enter a valid Ethereum private key (64 hex characters, optionally prefixed with 0x).\n\n" +
          "Example: `0x1234567890abcdef...`",
        {
          parse_mode: "Markdown",
          reply_markup: createCancelMenu().reply_markup,
        }
      );
      return;
    }

    // Create wallet and get address
    const wallet = createWallet(text, "ethereum"); // Default to ethereum for connection
    const walletData = {
      address: wallet.address,
    };

    // Set wallet in session with private key
    const { setWalletWithPrivateKey } = require("../utils/sessionUtils");
    setWalletWithPrivateKey(userId, {
      address: wallet.address,
      privateKey: text, // Store private key temporarily for signing
    });
    clearCurrentOperation(userId);

    await bot.sendMessage(
      chatId,
      `✅ *Wallet Connected Successfully!*\n\n` +
        `Address: \`${wallet.address}\`\n` +
        `Network: ethereum\n\n` +
        `You can now create payment and staking signatures.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );

    logger.info(`User ${userId} connected wallet: ${wallet.address}`);
  } catch (error) {
    logger.error("Error connecting wallet:", error);
    await bot.sendMessage(
      chatId,
      "❌ *Error Connecting Wallet*\n\n" +
        "There was an error connecting your wallet. Please check your private key and try again.",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
  }
};

const handleSinglePaymentMessage = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const step = operationData.step;

  switch (step) {
    case "recipient_type":
      // This step is handled by callback, not message
      await bot.sendMessage(
        chatId,
        "Please use the buttons to select recipient type."
      );
      break;

    case "recipient":
      await handleSinglePaymentRecipient(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "token_address":
      await handleSinglePaymentTokenAddress(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "amount":
      await handleSinglePaymentAmount(bot, chatId, userId, text, operationData);
      break;

    case "priority_fee":
      await handleSinglePaymentPriorityFee(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "nonce":
      await handleSinglePaymentNonce(bot, chatId, userId, text, operationData);
      break;

    default:
      await bot.sendMessage(chatId, "❌ Invalid step in single payment flow.", {
        reply_markup: createMainMenu().reply_markup,
      });
      clearCurrentOperation(userId);
      break;
  }
};

const handleSinglePaymentRecipient = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const { isValidAddress, isValidUsername } = require("../utils/dataHashing");

  let recipient = text.trim();
  let isValid = false;

  if (operationData.recipientType === "address") {
    isValid = isValidAddress(recipient);
    if (!isValid) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid Ethereum Address*\n\n" +
          "Please enter a valid Ethereum address (42 characters starting with 0x).",
        {
          parse_mode: "Markdown",
          reply_markup: createCancelMenu().reply_markup,
        }
      );
      return;
    }
  } else if (operationData.recipientType === "username") {
    isValid = isValidUsername(recipient);
    if (!isValid) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid Username*\n\n" +
          "Username must be 3-20 characters, alphanumeric and underscores only.",
        {
          parse_mode: "Markdown",
          reply_markup: createCancelMenu().reply_markup,
        }
      );
      return;
    }
  }

  operationData.recipient = recipient;
  operationData.step = "token_address";
  updateOperationData(userId, operationData);

  await bot.sendMessage(
    chatId,
    `✅ *Recipient Set*\n\n` +
      `Recipient: ${recipient}\n\n` +
      `Now enter the token contract address (use \`0x0000000000000000000000000000000000000000\` for ETH):`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );
};

const handleSinglePaymentTokenAddress = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const { isValidAddress } = require("../utils/dataHashing");

  const tokenAddress = text.trim();

  if (!isValidAddress(tokenAddress)) {
    await bot.sendMessage(
      chatId,
      "❌ *Invalid Token Address*\n\n" +
        "Please enter a valid Ethereum contract address (42 characters starting with 0x).",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
    return;
  }

  operationData.tokenAddress = tokenAddress;
  operationData.step = "amount";
  updateOperationData(userId, operationData);

  await bot.sendMessage(
    chatId,
    `✅ *Token Address Set*\n\n` +
      `Token: ${tokenAddress}\n\n` +
      `Now enter the amount to send:`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );
};

const handleSinglePaymentAmount = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const { isValidAmount } = require("../utils/dataHashing");

  const amount = text.trim();

  if (!isValidAmount(amount)) {
    await bot.sendMessage(
      chatId,
      "❌ *Invalid Amount*\n\n" + "Please enter a valid positive number.",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
    return;
  }

  operationData.amount = amount;
  operationData.step = "priority_fee";
  updateOperationData(userId, operationData);

  await bot.sendMessage(
    chatId,
    `✅ *Amount Set*\n\n` +
      `Amount: ${amount}\n\n` +
      `Now enter the priority fee (in ETH):`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );
};

const handleSinglePaymentPriorityFee = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const { isValidPriorityFee } = require("../utils/dataHashing");

  const priorityFee = text.trim();

  if (!isValidPriorityFee(priorityFee)) {
    await bot.sendMessage(
      chatId,
      "❌ *Invalid Priority Fee*\n\n" +
        "Please enter a valid non-negative number.",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
    return;
  }

  operationData.priorityFee = priorityFee;
  operationData.step = "nonce";
  updateOperationData(userId, operationData);

  const { generateRandomNonce } = require("../utils/constructMessage");
  const randomNonce = generateRandomNonce();

  await bot.sendMessage(
    chatId,
    `✅ *Priority Fee Set*\n\n` +
      `Priority Fee: ${priorityFee} ETH\n\n` +
      `Enter a nonce (or use the generated one: \`${randomNonce}\`):`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );
};

const handleSinglePaymentNonce = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  let nonce = text.trim();

  // If user entered a number, use it; otherwise use the generated one
  if (nonce && !isNaN(nonce)) {
    operationData.nonce = BigInt(nonce);
  } else {
    // Use the previously generated nonce
    const { generateRandomNonce } = require("../utils/constructMessage");
    operationData.nonce = generateRandomNonce();
  }

  operationData.step = "priority";
  updateOperationData(userId, operationData);

  const { createPriorityMenu } = require("../utils/menuUtils");

  await bot.sendMessage(
    chatId,
    `✅ *Nonce Set*\n\n` +
      `Nonce: ${operationData.nonce}\n\n` +
      `Choose the priority level:`,
    {
      parse_mode: "Markdown",
      reply_markup: createPriorityMenu().reply_markup,
    }
  );
};

// Placeholder handlers for other operations
const handleDispersePaymentMessage = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  // Implementation for disperse payment message handling
  await bot.sendMessage(
    chatId,
    "Disperse payment message handling not yet implemented.",
    { reply_markup: createMainMenu().reply_markup }
  );
  clearCurrentOperation(userId);
};

const handleGoldenStakingMessage = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  // Implementation for golden staking message handling
  await bot.sendMessage(
    chatId,
    "Golden staking message handling not yet implemented.",
    { reply_markup: createMainMenu().reply_markup }
  );
  clearCurrentOperation(userId);
};

const handlePresaleStakingMessage = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  // Implementation for presale staking message handling
  await bot.sendMessage(
    chatId,
    "Presale staking message handling not yet implemented.",
    { reply_markup: createMainMenu().reply_markup }
  );
  clearCurrentOperation(userId);
};

module.exports = { setupMessageHandlers };
