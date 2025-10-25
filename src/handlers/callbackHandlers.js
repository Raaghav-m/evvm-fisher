const logger = require("../utils/logger");
const {
  createMainMenu,
  createPaymentMenu,
  createStakingMenu,
  createNetworkMenu,
  createPriorityMenu,
  createActionMenu,
  createRecipientTypeMenu,
  createRecipientCountMenu,
  createConfirmationMenu,
  createBackMenu,
  createCancelMenu,
  removeKeyboard,
} = require("../utils/menuUtils");
const {
  getUserSession,
  setCurrentOperation,
  updateOperationData,
  setNetwork,
  clearCurrentOperation,
} = require("../utils/sessionUtils");
const {
  setupPaymentHandlers,
  setupStakingHandlers,
  setupWalletHandlers,
} = require("./operationHandlers");

const setupCallbackHandlers = (bot) => {
  // Main menu callbacks
  bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    try {
      // Answer the callback query to remove loading state
      await bot.answerCallbackQuery(callbackQuery.id);

      // Get user session
      let userSession = getUserSession(userId);
      if (!userSession) {
        userSession = require("../utils/sessionUtils").createUserSession(
          userId
        );
      }

      // Handle different callback data
      switch (data) {
        case "main_menu":
          await handleMainMenu(bot, chatId);
          break;

        case "connect_wallet":
          await handleConnectWallet(bot, chatId, userId);
          break;

        case "settings":
          await handleSettings(bot, chatId, userId);
          break;

        case "payment_menu":
          await handlePaymentMenu(bot, chatId, userId);
          break;

        case "staking_menu":
          await handleStakingMenu(bot, chatId, userId);
          break;

        case "wallet_info":
          await handleWalletInfo(bot, chatId, userId);
          break;

        case "help":
          await handleHelp(bot, chatId);
          break;

        // Name Service
        case "name_service":
          await handleNameService(bot, chatId, userId);
          break;

        case "register_username":
          await handleRegisterUsername(bot, chatId, userId);
          break;

        case "check_username":
          await handleCheckUsername(bot, chatId, userId);
          break;

        case "my_usernames":
          await handleMyUsernames(bot, chatId, userId);
          break;

        case "update_username":
          await handleUpdateUsername(bot, chatId, userId);
          break;

        // Balance and Faucet
        case "balance":
          await handleBalance(bot, chatId, userId);
          break;

        case "faucet":
          await handleFaucet(bot, chatId, userId);
          break;

        // Network selection
        case "network_ethereum":
          await handleNetworkSelection(bot, chatId, userId, "ethereum");
          break;

        case "network_arbitrum":
          await handleNetworkSelection(bot, chatId, userId, "arbitrum");
          break;

        // Payment operations
        case "single_payment":
          await handleSinglePayment(bot, chatId, userId);
          break;

        case "disperse_payment":
          await handleDispersePayment(bot, chatId, userId);
          break;

        // Staking operations
        case "golden_staking":
          await handleGoldenStaking(bot, chatId, userId);
          break;

        case "presale_staking":
          await handlePresaleStaking(bot, chatId, userId);
          break;

        // Priority selection
        case "priority_low":
          await handlePrioritySelection(bot, chatId, userId, "low");
          break;

        case "priority_high":
          await handlePrioritySelection(bot, chatId, userId, "high");
          break;

        // Action selection
        case "action_stake":
          await handleActionSelection(bot, chatId, userId, "stake");
          break;

        case "action_unstake":
          await handleActionSelection(bot, chatId, userId, "unstake");
          break;

        // Recipient type selection
        case "recipient_username":
          await handleRecipientTypeSelection(bot, chatId, userId, "username");
          break;

        case "recipient_address":
          await handleRecipientTypeSelection(bot, chatId, userId, "address");
          break;

        // Recipient count selection
        case "recipients_2":
        case "recipients_3":
        case "recipients_4":
        case "recipients_5":
          const count = parseInt(data.split("_")[1]);
          await handleRecipientCountSelection(bot, chatId, userId, count);
          break;

        // Signature confirmation callbacks
        case "confirm_single_payment":
          await handleConfirmSinglePayment(bot, chatId, userId);
          break;

        case "confirm_disperse_payment":
          await handleConfirmDispersePayment(bot, chatId, userId);
          break;

        case "confirm_staking":
          await handleConfirmStaking(bot, chatId, userId);
          break;

        case "confirm_presale_staking":
          await handleConfirmPresaleStaking(bot, chatId, userId);
          break;

        case "confirm_new_wallet":
          await handleConfirmNewWallet(bot, chatId, userId);
          break;

        case "cancel_operation":
          await handleCancelOperation(bot, chatId, userId);
          break;

        default:
          // Handle execute payment callbacks
          if (data.startsWith("execute_single_payment_")) {
            const targetUserId = data.replace("execute_single_payment_", "");
            if (targetUserId === userId.toString()) {
              await handleExecuteSinglePayment(bot, chatId, userId);
            } else {
              await bot.sendMessage(
                chatId,
                "❌ This action is not authorized for your account."
              );
            }
            break;
          }

          // Handle operation-specific callbacks
          await handleOperationCallbacks(bot, chatId, userId, data);
          break;
      }
    } catch (error) {
      logger.error("Error handling callback query:", error);
      await bot.sendMessage(chatId, "❌ An error occurred. Please try again.");
    }
  });

  logger.info("Callback handlers setup completed");
};

// Main menu handlers
const handleMainMenu = async (bot, chatId) => {
  await bot.sendMessage(chatId, "🏠 *Main Menu*", {
    parse_mode: "Markdown",
    reply_markup: createMainMenu().reply_markup,
  });
};

const handleConnectWallet = async (bot, chatId, userId) => {
  const userSession = getUserSession(userId);

  if (userSession && userSession.wallet) {
    await bot.sendMessage(
      chatId,
      `✅ *Wallet Already Connected*\n\n` +
        `Address: \`${userSession.wallet.address}\`\n` +
        `Connected: ${new Date(
          userSession.wallet.connectedAt
        ).toLocaleString()}\n\n` +
        `Would you like to connect a different wallet?`,
      {
        parse_mode: "Markdown",
        reply_markup: createConfirmationMenu("confirm_new_wallet", "main_menu")
          .reply_markup,
      }
    );
  } else {
    await bot.sendMessage(
      chatId,
      `🔗 *Connect Your Wallet*\n\n` +
        `To use the EVVM Signature Constructor Bot, you need to connect your wallet.\n\n` +
        `*Please provide your wallet information:*\n\n` +
        `**Step 1:** Send your Ethereum private key\n` +
        `• Must start with \`0x\`\n` +
        `• Must be 64 characters long\n` +
        `• Example: \`0x1234567890abcdef...\`\n\n` +
        `*Security Notice:*\n` +
        `• Your private key is only used temporarily for signing\n` +
        `• It's never stored permanently\n` +
        `• It's cleared after each session\n` +
        `• All operations are encrypted\n\n` +
        `Please send your private key:`,
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );

    setCurrentOperation(userId, "connect_wallet");
  }
};

const handleSettings = async (bot, chatId, userId) => {
  const userSession = getUserSession(userId);

  await bot.sendMessage(
    chatId,
    `⚙️ *Settings*\n\n` +
      `Current Network: ${userSession.network}\n` +
      `Wallet Connected: ${userSession.wallet ? "✅" : "❌"}\n\n` +
      `Choose your preferred network:`,
    {
      parse_mode: "Markdown",
      reply_markup: createNetworkMenu().reply_markup,
    }
  );
};

const handlePaymentMenu = async (bot, chatId, userId) => {
  const userSession = getUserSession(userId);

  if (!userSession.wallet) {
    await bot.sendMessage(
      chatId,
      `❌ *Wallet Not Connected*\n\n` +
        `Please connect your wallet first to create payment signatures.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );
    return;
  }

  await bot.sendMessage(
    chatId,
    `💸 *Payment Signatures*\n\n` +
      `Choose the type of payment signature you want to create:`,
    {
      parse_mode: "Markdown",
      reply_markup: createPaymentMenu().reply_markup,
    }
  );
};

const handleStakingMenu = async (bot, chatId, userId) => {
  const userSession = getUserSession(userId);

  if (!userSession.wallet) {
    await bot.sendMessage(
      chatId,
      `❌ *Wallet Not Connected*\n\n` +
        `Please connect your wallet first to create staking signatures.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );
    return;
  }

  await bot.sendMessage(
    chatId,
    `🏦 *Staking Signatures*\n\n` +
      `Choose the type of staking signature you want to create:`,
    {
      parse_mode: "Markdown",
      reply_markup: createStakingMenu().reply_markup,
    }
  );
};

const handleWalletInfo = async (bot, chatId, userId) => {
  const userSession = getUserSession(userId);

  if (!userSession.wallet) {
    await bot.sendMessage(
      chatId,
      `❌ *No Wallet Connected*\n\n` +
        `Please connect your wallet first to view wallet information.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );
    return;
  }

  try {
    const {
      getBalance,
      getTokenBalance,
      executePay,
    } = require("../utils/walletUtils");
    const balance = await getBalance(
      userSession.wallet.address,
      userSession.network
    );
    const formattedBalance = require("../utils/dataHashing").formatAmount(
      balance
    );

    await bot.sendMessage(
      chatId,
      `📊 *Wallet Information*\n\n` +
        `Address: \`${userSession.wallet.address}\`\n` +
        `Network: ${userSession.network}\n` +
        `ETH Balance: ${formattedBalance} ETH\n` +
        `Connected: ${new Date(
          userSession.wallet.connectedAt
        ).toLocaleString()}\n\n` +
        `*Session Info:*\n` +
        `Current Operation: ${userSession.currentOperation || "None"}\n` +
        `Last Activity: ${new Date(userSession.lastActivity).toLocaleString()}`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );
  } catch (error) {
    logger.error("Error getting wallet info:", error);
    await bot.sendMessage(
      chatId,
      `❌ *Error Getting Wallet Info*\n\n` +
        `Could not retrieve wallet balance. Please check your network connection.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );
  }
};

const handleHelp = async (bot, chatId) => {
  await bot.sendMessage(
    chatId,
    `❓ *Help & Support*\n\n` +
      `*Available Commands:*\n` +
      `/start - Start the bot\n` +
      `/help - Show this help\n` +
      `/status - Check bot status\n` +
      `/clear - Clear session data\n` +
      `/cancel - Cancel current operation\n\n` +
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
    {
      parse_mode: "Markdown",
      reply_markup: createMainMenu().reply_markup,
    }
  );
};

// Network selection handler
const handleNetworkSelection = async (bot, chatId, userId, network) => {
  setNetwork(userId, network);

  await bot.sendMessage(
    chatId,
    `✅ *Network Updated*\n\n` +
      `Selected network: ${network}\n\n` +
      `All operations will now use the ${network} network.`,
    {
      parse_mode: "Markdown",
      reply_markup: createMainMenu().reply_markup,
    }
  );
};

// Payment operation handlers
const handleSinglePayment = async (bot, chatId, userId) => {
  setCurrentOperation(userId, "single_payment", {
    step: "recipient_type",
    data: {},
  });

  await bot.sendMessage(
    chatId,
    `💸 *Single Payment Signature*\n\n` +
      `Choose how you want to specify the recipient:`,
    {
      parse_mode: "Markdown",
      reply_markup: createRecipientTypeMenu().reply_markup,
    }
  );
};

const handleDispersePayment = async (bot, chatId, userId) => {
  setCurrentOperation(userId, "disperse_payment", {
    step: "recipient_count",
    data: {},
  });

  await bot.sendMessage(
    chatId,
    `📦 *Disperse Payment Signature*\n\n` +
      `How many recipients do you want to send to?`,
    {
      parse_mode: "Markdown",
      reply_markup: createRecipientCountMenu().reply_markup,
    }
  );
};

// Staking operation handlers
const handleGoldenStaking = async (bot, chatId, userId) => {
  setCurrentOperation(userId, "golden_staking", {
    step: "action",
    data: {},
  });

  await bot.sendMessage(
    chatId,
    `🥇 *Golden Staking Signature*\n\n` +
      `Choose the action you want to perform:`,
    {
      parse_mode: "Markdown",
      reply_markup: createActionMenu().reply_markup,
    }
  );
};

const handlePresaleStaking = async (bot, chatId, userId) => {
  setCurrentOperation(userId, "presale_staking", {
    step: "action",
    data: {},
  });

  await bot.sendMessage(
    chatId,
    `🎯 *Presale Staking Signature*\n\n` +
      `Choose the action you want to perform:`,
    {
      parse_mode: "Markdown",
      reply_markup: createActionMenu().reply_markup,
    }
  );
};

// Priority selection handler
const handlePrioritySelection = async (bot, chatId, userId, priority) => {
  const userSession = getUserSession(userId);
  const operationData = userSession.operationData;

  operationData.priority = priority;
  updateOperationData(userId, operationData);

  // Continue with the next step based on current operation
  await setupPaymentHandlers.handlePrioritySelected(
    bot,
    chatId,
    userId,
    priority
  );
};

// Action selection handler
const handleActionSelection = async (bot, chatId, userId, action) => {
  const userSession = getUserSession(userId);
  const operationData = userSession.operationData;

  operationData.action = action;
  updateOperationData(userId, operationData);

  // Continue with the next step based on current operation
  if (userSession.currentOperation === "golden_staking") {
    await setupStakingHandlers.handleActionSelected(
      bot,
      chatId,
      userId,
      action,
      "golden"
    );
  } else if (userSession.currentOperation === "presale_staking") {
    await setupStakingHandlers.handleActionSelected(
      bot,
      chatId,
      userId,
      action,
      "presale"
    );
  }
};

// Recipient type selection handler
const handleRecipientTypeSelection = async (bot, chatId, userId, type) => {
  const userSession = getUserSession(userId);
  const operationData = userSession.operationData;

  operationData.recipientType = type;

  // Set the next step based on operation type
  if (userSession.currentOperation === "single_payment") {
    operationData.step = "recipient";
  } else if (userSession.currentOperation === "disperse_payment") {
    operationData.step = "recipient_info";
  }

  updateOperationData(userId, operationData);

  if (type === "username") {
    await bot.sendMessage(
      chatId,
      `👤 *Username Recipient*\n\n` +
        `Please enter the username of the recipient:`,
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
  } else {
    await bot.sendMessage(
      chatId,
      `📍 *Address Recipient*\n\n` +
        `Please enter the Ethereum address of the recipient:`,
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );
  }
};

// Recipient count selection handler
const handleRecipientCountSelection = async (bot, chatId, userId, count) => {
  const userSession = getUserSession(userId);
  const operationData = userSession.operationData;

  operationData.recipientCount = count;
  operationData.recipients = [];
  operationData.currentRecipient = 0;
  updateOperationData(userId, operationData);

  await bot.sendMessage(
    chatId,
    `📦 *Disperse Payment - Recipient ${
      operationData.currentRecipient + 1
    } of ${count}*\n\n` +
      `Choose how you want to specify recipient ${
        operationData.currentRecipient + 1
      }:`,
    {
      parse_mode: "Markdown",
      reply_markup: createRecipientTypeMenu().reply_markup,
    }
  );
};

// Signature confirmation handlers
const handleConfirmSinglePayment = async (bot, chatId, userId) => {
  try {
    const { setupPaymentHandlers } = require("./operationHandlers");
    await setupPaymentHandlers.signSinglePayment(bot, chatId, userId);
  } catch (error) {
    logger.error("Error confirming single payment:", error);
    await bot.sendMessage(
      chatId,
      "❌ Error processing payment. Please try again."
    );
  }
};

const handleConfirmDispersePayment = async (bot, chatId, userId) => {
  try {
    const { setupPaymentHandlers } = require("./operationHandlers");
    await setupPaymentHandlers.signDispersePayment(bot, chatId, userId);
  } catch (error) {
    logger.error("Error confirming disperse payment:", error);
    await bot.sendMessage(
      chatId,
      "❌ Error processing payment. Please try again."
    );
  }
};

const handleConfirmStaking = async (bot, chatId, userId) => {
  try {
    const { setupStakingHandlers } = require("./operationHandlers");
    await setupStakingHandlers.signStaking(bot, chatId, userId);
  } catch (error) {
    logger.error("Error confirming staking:", error);
    await bot.sendMessage(
      chatId,
      "❌ Error processing staking. Please try again."
    );
  }
};

const handleConfirmPresaleStaking = async (bot, chatId, userId) => {
  try {
    const { setupStakingHandlers } = require("./operationHandlers");
    await setupStakingHandlers.signPresaleStaking(bot, chatId, userId);
  } catch (error) {
    logger.error("Error confirming presale staking:", error);
    await bot.sendMessage(
      chatId,
      "❌ Error processing presale staking. Please try again."
    );
  }
};

const handleConfirmNewWallet = async (bot, chatId, userId) => {
  await bot.sendMessage(
    chatId,
    `🔗 *Connect New Wallet*\n\n` +
      `Please send your new private key (starting with 0x):`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );

  setCurrentOperation(userId, "connect_wallet");
};

const handleCancelOperation = async (bot, chatId, userId) => {
  const { clearCurrentOperation } = require("../utils/sessionUtils");
  clearCurrentOperation(userId);

  await bot.sendMessage(
    chatId,
    "❌ Operation cancelled. Returning to main menu.",
    {
      reply_markup: createMainMenu().reply_markup,
    }
  );
};

// Handle operation-specific callbacks
const handleOperationCallbacks = async (bot, chatId, userId, data) => {
  // This will be handled by the specific operation handlers
  // For now, just log and return to main menu
  logger.info(`Unhandled callback data: ${data} for user ${userId}`);
  await handleMainMenu(bot, chatId);
};

// Name Service Handlers
const handleNameService = async (bot, chatId, userId) => {
  const { createNameServiceMenu } = require("../utils/menuUtils");

  await bot.sendMessage(
    chatId,
    `🏷️ *Name Service*\n\n` +
      `Manage your EVVM usernames and identity.\n\n` +
      `Choose an option below:`,
    {
      parse_mode: "Markdown",
      reply_markup: createNameServiceMenu().reply_markup,
    }
  );
};

const handleRegisterUsername = async (bot, chatId, userId) => {
  const { setCurrentOperation } = require("../utils/sessionUtils");

  setCurrentOperation(userId, "register_username");

  await bot.sendMessage(
    chatId,
    `📝 *Register Username*\n\n` +
      `Enter the username you want to register:\n\n` +
      `*Requirements:*\n` +
      `• 3-20 characters\n` +
      `• Alphanumeric and underscores only\n` +
      `• Must be unique\n\n` +
      `Please enter your desired username:`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );
};

const handleCheckUsername = async (bot, chatId, userId) => {
  const { setCurrentOperation } = require("../utils/sessionUtils");

  setCurrentOperation(userId, "check_username");

  await bot.sendMessage(
    chatId,
    `🔍 *Check Username*\n\n` +
      `Enter the username you want to check:\n\n` +
      `This will show you if the username is available and its current status.`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );
};

const handleMyUsernames = async (bot, chatId, userId) => {
  const { getUserSession } = require("../utils/sessionUtils");

  const userSession = getUserSession(userId);

  if (!userSession || !userSession.wallet) {
    await bot.sendMessage(
      chatId,
      `❌ *No Wallet Connected*\n\n` +
        `Please connect your wallet first to view your usernames.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );
    return;
  }

  // TODO: Implement username storage and retrieval
  await bot.sendMessage(
    chatId,
    `📋 *My Usernames*\n\n` +
      `Wallet: \`${userSession.wallet.address}\`\n\n` +
      `*Registered Usernames:*\n` +
      `• No usernames registered yet\n\n` +
      `*Note:* Username registration will be implemented in future updates.`,
    {
      parse_mode: "Markdown",
      reply_markup: createMainMenu().reply_markup,
    }
  );
};

const handleUpdateUsername = async (bot, chatId, userId) => {
  const { setCurrentOperation } = require("../utils/sessionUtils");

  setCurrentOperation(userId, "update_username");

  await bot.sendMessage(
    chatId,
    `🔄 *Update Username*\n\n` +
      `Enter the new username you want to set:\n\n` +
      `*Note:* This will replace your current username.`,
    {
      parse_mode: "Markdown",
      reply_markup: createCancelMenu().reply_markup,
    }
  );
};

// Balance Handler
const handleBalance = async (bot, chatId, userId) => {
  const { getUserSession } = require("../utils/sessionUtils");
  const { getBalance } = require("../utils/walletUtils");

  const userSession = getUserSession(userId);

  if (!userSession || !userSession.wallet) {
    await bot.sendMessage(
      chatId,
      `❌ *No Wallet Connected*\n\n` +
        `Please connect your wallet first to check your balance.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );
    return;
  }

  try {
    await bot.sendMessage(chatId, `⏳ Checking balance...`);

    const balance = await getBalance(
      userSession.wallet.address,
      process.env.DEFAULT_TOKEN_ADDRESS ||
        "0x0000000000000000000000000000000000000000",
      userSession.network,
      process.env.EVVM_CONTRACT_ADDRESS
    );

    await bot.sendMessage(
      chatId,
      `💰 *Wallet Balance*\n\n` +
        `Wallet: \`${userSession.wallet.address}\`\n` +
        `Network: ${userSession.network}\n` +
        `Balance: ${balance} ETH\n\n` +
        `*Note:* This is your ETH balance on the testnet.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );
  } catch (error) {
    logger.error("Error getting balance:", error);
    await bot.sendMessage(
      chatId,
      `❌ *Error Getting Balance*\n\n` +
        `Unable to fetch your wallet balance. Please try again later.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );
  }
};

// Faucet Handler
const handleFaucet = async (bot, chatId, userId) => {
  const {
    getUserSession,
    setCurrentOperation,
    updateOperationData,
  } = require("../utils/sessionUtils");

  const userSession = getUserSession(userId);

  if (!userSession || !userSession.wallet) {
    await bot.sendMessage(
      chatId,
      `❌ *No Wallet Connected*\n\n` +
        `Please connect your wallet first to use the faucet.`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );
    return;
  }

  // Set operation to get token address
  setCurrentOperation(userId, "faucet_token", {
    wallet: userSession.wallet.address,
    network: userSession.network,
  });

  await bot.sendMessage(
    chatId,
    `🚰 *EVVM Faucet*\n\n` +
      `Wallet: \`${userSession.wallet.address}\`\n` +
      `Network: ${userSession.network}\n\n` +
      `Please enter the token address you want to receive:\n\n` +
      `*Example:*\n` +
      `\`0x1234567890123456789012345678901234567890\`\n\n` +
      `*Note:* This will add 1000 tokens to your balance.`,
    {
      parse_mode: "Markdown",
      reply_markup: { remove_keyboard: true },
    }
  );
};

// Execute Payment Handler
const handleExecuteSinglePayment = async (bot, chatId, userId) => {
  try {
    const userSession = getUserSession(userId);

    if (!userSession || !userSession.signatureData) {
      await bot.sendMessage(
        chatId,
        "❌ *No Signature Data Found*\n\n" +
          "Please generate a signature first before executing the payment.",
        {
          parse_mode: "Markdown",
          reply_markup: createMainMenu().reply_markup,
        }
      );
      return;
    }

    if (!userSession.wallet || !userSession.wallet.privateKey) {
      await bot.sendMessage(
        chatId,
        "❌ *Wallet Not Connected*\n\n" +
          "Please connect your wallet first to execute the payment.",
        {
          parse_mode: "Markdown",
          reply_markup: createMainMenu().reply_markup,
        }
      );
      return;
    }

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
      return;
    }

    await bot.sendMessage(chatId, "⏳ Executing payment on the blockchain...");

    // Prepare the input data for the contract call
    const inputData = {
      from: userSession.signatureData.signatureData.from,
      to_address: userSession.signatureData.signatureData.to_address,
      to_identity: userSession.signatureData.signatureData.to_identity,
      token: userSession.signatureData.signatureData.token,
      amount: userSession.signatureData.signatureData.amount,
      priorityFee: userSession.signatureData.signatureData.priorityFee,
      nonce: userSession.signatureData.signatureData.nonce,
      priority: userSession.signatureData.signatureData.priority,
      executor: userSession.signatureData.signatureData.executor,
      signature: userSession.signatureData.signature, // The signature from the signing process
    };

    // Execute the payment
    const result = await executePay(
      inputData,
      userSession.network,
      userSession.evvmContractAddress,
      userSession.wallet.privateKey
    );

    await bot.sendMessage(
      chatId,
      `✅ *Payment Executed Successfully!*\n\n` +
        `*Transaction Details:*\n` +
        `Hash: \`${result.transactionHash}\`\n` +
        `Block: ${result.blockNumber}\n` +
        `Gas Used: ${result.gasUsed}\n` +
        `Status: ${result.status === 1 ? "Success" : "Failed"}\n\n` +
        `Your payment has been processed on the blockchain!`,
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );

    // Clear the signature data after execution
    delete userSession.signatureData;
    delete userSession.summary;
  } catch (error) {
    logger.error("Error executing single payment:", error);

    await bot.sendMessage(
      chatId,
      "❌ *Error Executing Payment*\n\n" +
        "There was an error executing the payment on the blockchain. Please try again.",
      {
        parse_mode: "Markdown",
        reply_markup: createMainMenu().reply_markup,
      }
    );
  }
};

module.exports = { setupCallbackHandlers, handleExecuteSinglePayment };
