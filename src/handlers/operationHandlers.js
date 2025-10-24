const logger = require("../utils/logger");
const {
  getUserSession,
  updateOperationData,
  clearCurrentOperation,
} = require("../utils/sessionUtils");
const {
  createMainMenu,
  createConfirmationMenu,
  createCancelMenu,
} = require("../utils/menuUtils");
const {
  buildMessageSignedForPay,
  buildMessageSignedForDispersePay,
  buildMessageSignedForPresaleStaking,
  buildMessageSignedForPublicStaking,
  createTypedData,
  generateRandomNonce,
  generateDualNonces,
} = require("../utils/constructMessage");
const { createWallet, signTypedData } = require("../utils/walletUtils");
const {
  generatePaymentSignature,
  generateDispersePaymentSignature,
  generatePublicStakingSignature,
  generatePresaleStakingSignature,
  generateDualPresaleStakingSignatures,
  createSignatureSummary,
} = require("../utils/signatureUtils");

// Payment Handlers
const setupPaymentHandlers = {
  async handlePrioritySelected(bot, chatId, userId, priority) {
    const userSession = getUserSession(userId);
    const operationData = userSession.operationData;

    operationData.priority = priority;
    updateOperationData(userId, operationData);

    if (userSession.currentOperation === "single_payment") {
      await this.createSinglePaymentSignature(bot, chatId, userId);
    } else if (userSession.currentOperation === "disperse_payment") {
      await this.createDispersePaymentSignature(bot, chatId, userId);
    }
  },

  async createSinglePaymentSignature(bot, chatId, userId) {
    try {
      const userSession = getUserSession(userId);
      const operationData = userSession.operationData;

      // Show confirmation first
      const confirmationMessage =
        `📝 *Single Payment Signature Ready*\n\n` +
        `Recipient: ${operationData.recipient}\n` +
        `Token: ${operationData.tokenAddress}\n` +
        `Amount: ${operationData.amount}\n` +
        `Priority Fee: ${operationData.priorityFee} ETH\n` +
        `Priority: ${operationData.priority}\n` +
        `Nonce: ${operationData.nonce}\n` +
        `Network: ${userSession.network}\n\n` +
        `Do you want to sign this transaction?`;

      await bot.sendMessage(chatId, confirmationMessage, {
        parse_mode: "Markdown",
        reply_markup: createConfirmationMenu(
          "confirm_single_payment",
          "cancel_operation"
        ).reply_markup,
      });
    } catch (error) {
      logger.error("Error creating single payment signature:", error);
      await bot.sendMessage(
        chatId,
        "❌ Error creating payment signature. Please try again.",
        { reply_markup: createMainMenu().reply_markup }
      );
      clearCurrentOperation(userId);
    }
  },

  async signSinglePayment(bot, chatId, userId) {
    try {
      const userSession = getUserSession(userId);
      const operationData = userSession.operationData;

      if (!userSession.wallet || !userSession.wallet.privateKey) {
        await bot.sendMessage(
          chatId,
          "❌ No wallet connected or private key not available. Please connect your wallet first.",
          { reply_markup: createMainMenu().reply_markup }
        );
        return;
      }

      // Generate signature using the new signature utilities
      const signatureData = await generatePaymentSignature(
        userSession.wallet.privateKey,
        {
          recipient: operationData.recipient,
          tokenAddress: operationData.tokenAddress,
          amount: operationData.amount,
          nonce: operationData.nonce,
          priorityFee: operationData.priorityFee,
          priority: operationData.priority,
          evvmContractAddress: userSession.evvmContractAddress,
        },
        userSession.network
      );

      const summary = createSignatureSummary(signatureData, "single_payment");

      // Display the signature
      const signatureMessage =
        `✅ <b>Single Payment Signature Generated</b>\n\n` +
        `Wallet: <code>${summary.walletAddress}</code>\n` +
        `Type: ${summary.type}\n\n` +
        `<b>Signature Details:</b>\n` +
        `R: <code>${summary.signature.r}</code>\n` +
        `S: <code>${summary.signature.s}</code>\n` +
        `V: <code>${summary.signature.v}</code>\n\n` +
        `<b>Full Signature:</b>\n` +
        `<code>${summary.signature.full}</code>\n\n` +
        `<b>Message Hash:</b>\n` +
        `<pre>${JSON.stringify(
          summary.message,
          (key, value) =>
            typeof value === "bigint" ? value.toString() : value,
          2
        )}</pre>\n\n` +
        `Signature generated at: ${summary.timestamp}`;

      await bot.sendMessage(chatId, signatureMessage, {
        parse_mode: "HTML",
        reply_markup: createMainMenu().reply_markup,
      });

      clearCurrentOperation(userId);
      logger.info(`Single payment signature generated for user ${userId}`);
    } catch (error) {
      logger.error("Error signing single payment:", error);
      await bot.sendMessage(
        chatId,
        "❌ Error generating signature. Please try again.",
        { reply_markup: createMainMenu().reply_markup }
      );
      clearCurrentOperation(userId);
    }
  },

  async createDispersePaymentSignature(bot, chatId, userId) {
    try {
      const userSession = getUserSession(userId);
      const operationData = userSession.operationData;

      // Build the message
      const message = buildMessageSignedForDispersePay({
        recipients: operationData.recipients,
        tokenAddress: operationData.tokenAddress,
        totalAmount: operationData.totalAmount,
        priorityFee: operationData.priorityFee,
        nonce: operationData.nonce,
        priority: operationData.priority,
        executorAddress: operationData.executorAddress,
        network: userSession.network,
      });

      // Create typed data for signing
      const domain = {
        name: "EVVM Signature Constructor",
        version: "1",
        chainId: userSession.network === "ethereum" ? 11155111 : 421614, // Sepolia testnets
        verifyingContract: "0x0000000000000000000000000000000000000000",
      };

      const typedData = createTypedData(message, domain);

      // Show confirmation
      let confirmationMessage = `📝 *Disperse Payment Signature Ready*\n\n`;
      confirmationMessage += `Recipients: ${operationData.recipients.length}\n`;
      operationData.recipients.forEach((recipient, index) => {
        confirmationMessage += `${index + 1}. ${
          recipient.address || recipient.username
        }: ${recipient.amount}\n`;
      });
      confirmationMessage += `\nToken: ${operationData.tokenAddress}\n`;
      confirmationMessage += `Total Amount: ${operationData.totalAmount}\n`;
      confirmationMessage += `Priority Fee: ${operationData.priorityFee} ETH\n`;
      confirmationMessage += `Priority: ${operationData.priority}\n`;
      confirmationMessage += `Nonce: ${operationData.nonce}\n`;
      confirmationMessage += `Network: ${userSession.network}\n\n`;
      confirmationMessage += `Do you want to sign this transaction?`;

      await bot.sendMessage(chatId, confirmationMessage, {
        parse_mode: "Markdown",
        reply_markup: createConfirmationMenu(
          "confirm_disperse_payment",
          "cancel_operation"
        ).reply_markup,
      });
    } catch (error) {
      logger.error("Error creating disperse payment signature:", error);
      await bot.sendMessage(
        chatId,
        "❌ Error creating disperse payment signature. Please try again.",
        { reply_markup: createMainMenu().reply_markup }
      );
      clearCurrentOperation(userId);
    }
  },
};

// Staking Handlers
const setupStakingHandlers = {
  async handleActionSelected(bot, chatId, userId, action, stakingType) {
    const userSession = getUserSession(userId);
    const operationData = userSession.operationData;

    operationData.action = action;
    operationData.stakingType = stakingType;
    updateOperationData(userId, operationData);

    await bot.sendMessage(
      chatId,
      `✅ *Action Selected*\n\n` +
        `Action: ${action}\n` +
        `Type: ${stakingType} staking\n\n` +
        `Please enter the staking contract address:`,
      {
        parse_mode: "Markdown",
        reply_markup: createCancelMenu().reply_markup,
      }
    );

    operationData.step = "staking_address";
    updateOperationData(userId, operationData);
  },

  async createStakingSignature(bot, chatId, userId) {
    try {
      const userSession = getUserSession(userId);
      const operationData = userSession.operationData;

      let message;

      if (operationData.stakingType === "presale") {
        message = buildMessageSignedForPresaleStaking({
          action: operationData.action,
          stakingAddress: operationData.stakingAddress,
          amount: operationData.amount,
          evvmNonce: operationData.evvmNonce,
          stakingNonce: operationData.stakingNonce,
          priorityFee: operationData.priorityFee,
          priority: operationData.priority,
          network: userSession.network,
        });
      } else {
        message = buildMessageSignedForPublicStaking({
          action: operationData.action,
          stakingAddress: operationData.stakingAddress,
          amount: operationData.amount,
          nonce: operationData.nonce,
          priorityFee: operationData.priorityFee,
          priority: operationData.priority,
          network: userSession.network,
        });
      }

      // Create typed data for signing
      const domain = {
        name: "EVVM Signature Constructor",
        version: "1",
        chainId: userSession.network === "ethereum" ? 11155111 : 421614, // Sepolia testnets
        verifyingContract: "0x0000000000000000000000000000000000000000",
      };

      const typedData = createTypedData(message, domain);

      // Show confirmation
      let confirmationMessage = `📝 *${
        operationData.stakingType.charAt(0).toUpperCase() +
        operationData.stakingType.slice(1)
      } Staking Signature Ready*\n\n`;
      confirmationMessage += `Action: ${operationData.action}\n`;
      confirmationMessage += `Staking Address: ${operationData.stakingAddress}\n`;
      confirmationMessage += `Amount: ${operationData.amount}\n`;
      confirmationMessage += `Priority Fee: ${operationData.priorityFee} ETH\n`;
      confirmationMessage += `Priority: ${operationData.priority}\n`;
      confirmationMessage += `Network: ${userSession.network}\n`;

      if (operationData.stakingType === "presale") {
        confirmationMessage += `EVVM Nonce: ${operationData.evvmNonce}\n`;
        confirmationMessage += `Staking Nonce: ${operationData.stakingNonce}\n`;
      } else {
        confirmationMessage += `Nonce: ${operationData.nonce}\n`;
      }

      confirmationMessage += `\nDo you want to sign this transaction?`;

      await bot.sendMessage(chatId, confirmationMessage, {
        parse_mode: "Markdown",
        reply_markup: createConfirmationMenu(
          "confirm_staking",
          "cancel_operation"
        ).reply_markup,
      });
    } catch (error) {
      logger.error("Error creating staking signature:", error);
      await bot.sendMessage(
        chatId,
        "❌ Error creating staking signature. Please try again.",
        { reply_markup: createMainMenu().reply_markup }
      );
      clearCurrentOperation(userId);
    }
  },
};

// Wallet Handlers
const setupWalletHandlers = {
  async handleWalletConnection(bot, chatId, userId, privateKey) {
    try {
      const { createWallet } = require("../utils/walletUtils");
      const { setWallet } = require("../utils/sessionUtils");

      // Create wallet and get address
      const wallet = createWallet(privateKey, "ethereum");
      const walletData = {
        address: wallet.address,
      };

      // Set wallet in session
      setWallet(userId, walletData);
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
  },

  async signTransaction(bot, chatId, userId, typedData) {
    try {
      const userSession = getUserSession(userId);

      if (!userSession.wallet) {
        await bot.sendMessage(
          chatId,
          "❌ No wallet connected. Please connect your wallet first.",
          { reply_markup: createMainMenu().reply_markup }
        );
        return;
      }

      // Note: In a real implementation, you would need to get the private key from the user
      // For security reasons, we don't store private keys
      await bot.sendMessage(
        chatId,
        "⚠️ *Signing Not Available*\n\n" +
          "For security reasons, private keys are not stored. " +
          "Please use a wallet application to sign the transaction manually.\n\n" +
          "The signature data has been prepared and can be used with your wallet.",
        {
          parse_mode: "Markdown",
          reply_markup: createMainMenu().reply_markup,
        }
      );

      clearCurrentOperation(userId);
    } catch (error) {
      logger.error("Error signing transaction:", error);
      await bot.sendMessage(
        chatId,
        "❌ Error signing transaction. Please try again.",
        { reply_markup: createMainMenu().reply_markup }
      );
      clearCurrentOperation(userId);
    }
  },
};

module.exports = {
  setupPaymentHandlers,
  setupStakingHandlers,
  setupWalletHandlers,
};
