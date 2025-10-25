const logger = require("../utils/logger");
const { ethers } = require("ethers");
const {
  getUserSession,
  updateOperationData,
  clearCurrentOperation,
} = require("../utils/sessionUtils");
const {
  createMainMenu,
  createCancelMenu,
  createPriorityMenu,
} = require("../utils/menuUtils");
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

    case "register_username":
      await handleRegisterUsernameMessage(bot, chatId, userId, text);
      break;

    case "check_username":
      await handleCheckUsernameMessage(bot, chatId, userId, text);
      break;

    case "update_username":
      await handleUpdateUsernameMessage(bot, chatId, userId, text);
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

    case "faucet_token":
      await handleFaucetTokenMessage(bot, chatId, userId, text, operationData);
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

    // Validate private key format
    if (!isValidPrivateKey(text)) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid Private Key Format*\n\n" +
          "Your private key must be:\n" +
          "• 64 hexadecimal characters\n" +
          "• Start with `0x` (optional)\n" +
          "• Example: `0x1234567890abcdef...`\n\n" +
          "Please check your private key and try again:",
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
        `**Wallet Details:**\n` +
        `• Address: \`${wallet.address}\`\n` +
        `• Network: Ethereum Sepolia Testnet\n` +
        `• Status: Ready for signing\n\n` +
        `**Available Features:**\n` +
        `• 🏷️ Name Service - Manage usernames\n` +
        `• 💸 Payment Signatures - Create payment signatures\n` +
        `• 🏦 Staking Signatures - Create staking signatures\n` +
        `• 💰 Balance - Check your wallet balance\n` +
        `• 🚰 Faucet - Get testnet tokens\n\n` +
        `You can now use all bot features!`,
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
        "There was an error connecting your wallet. This could be due to:\n" +
        "• Invalid private key format\n" +
        "• Network connectivity issues\n" +
        "• Invalid private key\n\n" +
        "Please check your private key and try again:",
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
  operationData.step = "priority";
  updateOperationData(userId, operationData);

  await bot.sendMessage(
    chatId,
    `✅ *Priority Fee Set*\n\n` +
      `Priority Fee: ${priorityFee} ETH\n\n` +
      `⚡ *Priority Level*\n\n` +
      `Choose the priority level for this transaction:\n\n` +
      `• *High Priority (Synchronous)*: Uses contract nonce for transaction ordering\n` +
      `• *Low Priority (Asynchronous)*: Uses random nonce`,
    {
      parse_mode: "Markdown",
      reply_markup: createPriorityMenu().reply_markup,
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

// Disperse Payment Message Handlers
const handleDispersePaymentMessage = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const step = operationData.step;

  switch (step) {
    case "recipient_count":
      // This step is handled by callback, not message
      await bot.sendMessage(
        chatId,
        "Please use the buttons to select recipient count."
      );
      break;

    case "recipient_info":
      await handleDispersePaymentRecipientInfo(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "recipient_amount":
      await handleDispersePaymentRecipientAmount(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "token_address":
      await handleDispersePaymentTokenAddress(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "total_amount":
      await handleDispersePaymentTotalAmount(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "priority_fee":
      await handleDispersePaymentPriorityFee(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "executor_address":
      await handleDispersePaymentExecutorAddress(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    case "nonce":
      await handleDispersePaymentNonce(
        bot,
        chatId,
        userId,
        text,
        operationData
      );
      break;

    default:
      await bot.sendMessage(
        chatId,
        "❌ Invalid step in disperse payment flow.",
        {
          reply_markup: createMainMenu().reply_markup,
        }
      );
      clearCurrentOperation(userId);
      break;
  }
};

// Disperse Payment Message Handler Functions
const handleDispersePaymentRecipientInfo = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const { isValidAddress } = require("../utils/validation");
  const { updateOperationData } = require("../utils/sessionUtils");

  const currentRecipient = operationData.currentRecipient;
  const recipientType = operationData.recipientType;

  if (recipientType === "username") {
    // Store username
    if (!operationData.recipients) operationData.recipients = [];
    if (!operationData.recipients[currentRecipient]) {
      operationData.recipients[currentRecipient] = {};
    }
    operationData.recipients[currentRecipient].username = text.trim();
    operationData.recipients[currentRecipient].address = null;
  } else {
    // Validate and store address
    if (!isValidAddress(text.trim())) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid Address*\n\n" +
          "Please enter a valid Ethereum address (42 characters starting with 0x).",
        {
          parse_mode: "Markdown",
          reply_markup: createCancelMenu().reply_markup,
        }
      );
      return;
    }

    if (!operationData.recipients) operationData.recipients = [];
    if (!operationData.recipients[currentRecipient]) {
      operationData.recipients[currentRecipient] = {};
    }
    operationData.recipients[currentRecipient].address = text.trim();
    operationData.recipients[currentRecipient].username = null;
  }

  // Ask for amount for this recipient
  operationData.step = "recipient_amount";
  updateOperationData(userId, operationData);

  await bot.sendMessage(
    chatId,
    `💰 *Amount for Recipient ${currentRecipient + 1}*\n\n` +
      `Enter the amount to send to this recipient:`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );
};

const handleDispersePaymentRecipientAmount = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const amount = parseFloat(text.trim());
  if (isNaN(amount) || amount <= 0) {
    await bot.sendMessage(
      chatId,
      "❌ *Invalid Amount*\n\n" +
        "Please enter a valid positive number for the amount.",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
    return;
  }

  const currentRecipient = operationData.currentRecipient;
  operationData.recipients[currentRecipient].amount = amount;

  // Check if we need more recipients
  if (currentRecipient + 1 < operationData.recipientCount) {
    // Move to next recipient
    operationData.currentRecipient = currentRecipient + 1;
    operationData.step = "recipient_info";
    updateOperationData(userId, operationData);

    await bot.sendMessage(
      chatId,
      `📦 *Disperse Payment - Recipient ${
        operationData.currentRecipient + 1
      } of ${operationData.recipientCount}*\n\n` +
        `Choose how you want to specify recipient ${
          operationData.currentRecipient + 1
        }:`,
      {
        parse_mode: "Markdown",
        reply_markup: createRecipientTypeMenu().reply_markup,
      }
    );
  } else {
    // All recipients done, ask for token address
    operationData.step = "token_address";
    updateOperationData(userId, operationData);

    await bot.sendMessage(
      chatId,
      `🪙 *Token Address*\n\n` + `Enter the token contract address:`,
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
  }
};

const handleDispersePaymentTokenAddress = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const { isValidAddress } = require("../utils/validation");
  const { updateOperationData } = require("../utils/sessionUtils");

  if (!isValidAddress(text.trim())) {
    await bot.sendMessage(
      chatId,
      "❌ *Invalid Token Address*\n\n" +
        "Please enter a valid Ethereum address (42 characters starting with 0x).",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
    return;
  }

  operationData.tokenAddress = text.trim();
  operationData.step = "total_amount";
  updateOperationData(userId, operationData);

  await bot.sendMessage(
    chatId,
    `💰 *Total Amount*\n\n` + `Enter the total amount to be distributed:`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );
};

const handleDispersePaymentTotalAmount = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const { updateOperationData } = require("../utils/sessionUtils");

  const amount = parseFloat(text.trim());
  if (isNaN(amount) || amount <= 0) {
    await bot.sendMessage(
      chatId,
      "❌ *Invalid Amount*\n\n" +
        "Please enter a valid positive number for the total amount.",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
    return;
  }

  operationData.totalAmount = amount;
  operationData.step = "priority_fee";
  updateOperationData(userId, operationData);

  await bot.sendMessage(
    chatId,
    `⛽ *Priority Fee*\n\n` + `Enter the priority fee in ETH:`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );
};

const handleDispersePaymentPriorityFee = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const { updateOperationData } = require("../utils/sessionUtils");

  const fee = parseFloat(text.trim());
  if (isNaN(fee) || fee < 0) {
    await bot.sendMessage(
      chatId,
      "❌ *Invalid Priority Fee*\n\n" +
        "Please enter a valid non-negative number for the priority fee.",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
    return;
  }

  operationData.priorityFee = fee;
  operationData.step = "executor_address";
  updateOperationData(userId, operationData);

  await bot.sendMessage(
    chatId,
    `👤 *Executor Address*\n\n` +
      `Enter the executor address (optional, leave empty for default):`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );
};

const handleDispersePaymentExecutorAddress = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const { isValidAddress } = require("../utils/validation");
  const { updateOperationData } = require("../utils/sessionUtils");

  const executorAddress = text.trim();

  if (executorAddress && !isValidAddress(executorAddress)) {
    await bot.sendMessage(
      chatId,
      "❌ *Invalid Executor Address*\n\n" +
        "Please enter a valid Ethereum address or leave empty for default.",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
    return;
  }

  operationData.executorAddress = executorAddress || null;
  operationData.step = "priority";
  updateOperationData(userId, operationData);

  await bot.sendMessage(
    chatId,
    `✅ *Executor Address Set*\n\n` +
      `Executor: ${executorAddress || "Default"}\n\n` +
      `⚡ *Priority Level*\n\n` +
      `Choose the priority level for this transaction:\n\n` +
      `• *High Priority (Synchronous)*: Uses contract nonce for transaction ordering\n` +
      `• *Low Priority (Asynchronous)*: Uses random nonce`,
    {
      parse_mode: "Markdown",
      reply_markup: createPriorityMenu().reply_markup,
    }
  );
};

const handleDispersePaymentNonce = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  const { updateOperationData } = require("../utils/sessionUtils");
  const { generateMersenneTwisterNonce } = require("../utils/dataHashing");

  let nonce;
  if (text.trim() === "") {
    // Generate random nonce
    nonce = generateMersenneTwisterNonce();
  } else {
    const parsedNonce = parseInt(text.trim());
    if (isNaN(parsedNonce) || parsedNonce < 0) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid Nonce*\n\n" +
          "Please enter a valid non-negative integer or leave empty for random generation.",
        {
          parse_mode: "Markdown",
          reply_markup: createCancelMenu().reply_markup,
        }
      );
      return;
    }
    nonce = parsedNonce;
  }

  operationData.nonce = nonce;
  operationData.step = "priority";
  updateOperationData(userId, operationData);

  await bot.sendMessage(
    chatId,
    `⚡ *Priority Level*\n\n` +
      `Choose the priority level for this transaction:`,
    {
      parse_mode: "Markdown",
      reply_markup: createPriorityMenu().reply_markup,
    }
  );
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

// Name Service Message Handlers
const handleRegisterUsernameMessage = async (bot, chatId, userId, text) => {
  try {
    const { isValidUsername } = require("../utils/validation");
    const { clearCurrentOperation } = require("../utils/sessionUtils");

    const username = text.trim();

    if (!isValidUsername(username)) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid Username*\n\n" +
          "Username must be:\n" +
          "• 3-20 characters long\n" +
          "• Alphanumeric and underscores only\n" +
          "• No spaces or special characters\n\n" +
          "Please enter a valid username:",
        {
          parse_mode: "Markdown",
          reply_markup: createCancelMenu().reply_markup,
        }
      );
      return;
    }

    // TODO: Implement actual username registration
    await bot.sendMessage(
      chatId,
      `✅ *Username Registration*\n\n` +
        `Username: \`${username}\`\n\n` +
        `*Status:* Username registration is not yet implemented.\n` +
        `This feature will be available in future updates.\n\n` +
        `*Note:* Username registration requires interaction with the EVVM contract.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );

    clearCurrentOperation(userId);
    logger.info(`User ${userId} attempted to register username: ${username}`);
  } catch (error) {
    logger.error("Error handling username registration:", error);
    await bot.sendMessage(
      chatId,
      "❌ *Error Registering Username*\n\n" +
        "There was an error processing your username registration. Please try again.",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
  }
};

const handleCheckUsernameMessage = async (bot, chatId, userId, text) => {
  try {
    const { isValidUsername } = require("../utils/validation");
    const { clearCurrentOperation } = require("../utils/sessionUtils");

    const username = text.trim();

    if (!isValidUsername(username)) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid Username Format*\n\n" +
          "Username must be:\n" +
          "• 3-20 characters long\n" +
          "• Alphanumeric and underscores only\n\n" +
          "Please enter a valid username to check:",
        {
          parse_mode: "Markdown",
          reply_markup: createCancelMenu().reply_markup,
        }
      );
      return;
    }

    // TODO: Implement actual username checking
    await bot.sendMessage(
      chatId,
      `🔍 *Username Check*\n\n` +
        `Username: \`${username}\`\n\n` +
        `*Status:* Username checking is not yet implemented.\n` +
        `This feature will be available in future updates.\n\n` +
        `*Note:* Username checking requires interaction with the EVVM contract.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );

    clearCurrentOperation(userId);
    logger.info(`User ${userId} checked username: ${username}`);
  } catch (error) {
    logger.error("Error checking username:", error);
    await bot.sendMessage(
      chatId,
      "❌ *Error Checking Username*\n\n" +
        "There was an error checking the username. Please try again.",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
  }
};

const handleUpdateUsernameMessage = async (bot, chatId, userId, text) => {
  try {
    const { isValidUsername } = require("../utils/validation");
    const { clearCurrentOperation } = require("../utils/sessionUtils");

    const username = text.trim();

    if (!isValidUsername(username)) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid Username*\n\n" +
          "Username must be:\n" +
          "• 3-20 characters long\n" +
          "• Alphanumeric and underscores only\n\n" +
          "Please enter a valid new username:",
        {
          parse_mode: "Markdown",
          reply_markup: createCancelMenu().reply_markup,
        }
      );
      return;
    }

    // TODO: Implement actual username updating
    await bot.sendMessage(
      chatId,
      `🔄 *Username Update*\n\n` +
        `New Username: \`${username}\`\n\n` +
        `*Status:* Username updating is not yet implemented.\n` +
        `This feature will be available in future updates.\n\n` +
        `*Note:* Username updating requires interaction with the EVVM contract.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );

    clearCurrentOperation(userId);
    logger.info(`User ${userId} attempted to update username to: ${username}`);
  } catch (error) {
    logger.error("Error handling username update:", error);
    await bot.sendMessage(
      chatId,
      "❌ *Error Updating Username*\n\n" +
        "There was an error processing your username update. Please try again.",
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
  }
};

const handleFaucetTokenMessage = async (
  bot,
  chatId,
  userId,
  text,
  operationData
) => {
  try {
    const { isValidAddress } = require("../utils/validation");
    const { clearCurrentOperation } = require("../utils/sessionUtils");
    const { addBalance } = require("../utils/walletUtils");
    const { createMainMenu } = require("../utils/menuUtils");

    const tokenAddress = text.trim();

    if (!isValidAddress(tokenAddress)) {
      await bot.sendMessage(
        chatId,
        "❌ *Invalid Token Address*\n\n" +
          "Please enter a valid Ethereum address for the token.\n\n" +
          "*Example:*\n" +
          "`0x1234567890123456789012345678901234567890`",
        {
          parse_mode: "Markdown",
          reply_markup: { remove_keyboard: true },
        }
      );
      return;
    }

    await bot.sendMessage(chatId, "⏳ Adding balance to your account...");

    // Add 1000 tokens (assuming 18 decimals)
    const quantity = ethers.parseUnits("1000", 18);

    // Get user's private key from session
    const userSession = getUserSession(userId);
    if (!userSession || !userSession.wallet || !userSession.wallet.privateKey) {
      await bot.sendMessage(
        chatId,
        "❌ *Wallet Not Connected*\n\n" +
          "Please connect your wallet first to use the faucet.",
        {
          parse_mode: "Markdown",
          reply_markup: createMainMenu().reply_markup,
        }
      );
      clearCurrentOperation(userId);
      return;
    }

    // Check if user has contract address set
    if (!userSession.evvmContractAddress) {
      await bot.sendMessage(
        chatId,
        "❌ *Contract Address Not Set*\n\n" +
          "Please set your EVVM contract address first using the 'Setup Contract' option.",
        {
          parse_mode: "Markdown",
          reply_markup: createMainMenu().reply_markup,
        }
      );
      clearCurrentOperation(userId);
      return;
    }

    const result = await addBalance(
      operationData.wallet,
      tokenAddress,
      quantity,
      operationData.network,
      userSession.evvmContractAddress, // use user's contract address
      userSession.wallet.privateKey // user's private key
    );

    await bot.sendMessage(
      chatId,
      `✅ *Balance Added Successfully!*\n\n` +
        `Wallet: \`${operationData.wallet}\`\n` +
        `Token: \`${tokenAddress}\`\n` +
        `Amount: 1000 tokens\n` +
        `Network: ${operationData.network}\n\n` +
        `*Transaction Details:*\n` +
        `Hash: \`${result.transactionHash}\`\n` +
        `Block: ${result.blockNumber}\n` +
        `Gas Used: ${result.gasUsed}\n\n` +
        `Your balance has been updated!`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );

    clearCurrentOperation(userId);
  } catch (error) {
    logger.error("Error in faucet token handler:", error);

    await bot.sendMessage(
      chatId,
      "❌ *Error Adding Balance*\n\n" +
        "There was an error adding balance to your account. Please try again.",
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );

    clearCurrentOperation(userId);
  }
};

module.exports = { setupMessageHandlers };
