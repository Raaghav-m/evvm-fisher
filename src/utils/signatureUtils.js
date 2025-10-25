const { ethers } = require("ethers");
const {
  createWallet,
  signTypedData,
  getNextCurrentSyncNonce,
} = require("./walletUtils");
const { createTypedData } = require("./constructMessage");
const { generateMersenneTwisterNonce } = require("./dataHashing");
const logger = require("./logger");

/**
 * Secure signature generation utilities matching the frontend implementation
 */

/**
 * Generate nonce based on priority
 * - Synchronous (High Priority): Use contract's getNextCurrentSyncNonce
 * - Asynchronous (Low Priority): Use random nonce generator
 */
const generateNonceByPriority = async (
  user,
  priority,
  network,
  contractAddress
) => {
  try {
    if (priority.toLowerCase() === "high") {
      // Synchronous - get nonce from contract
      logger.info(`Generating synchronous nonce for user: ${user}`);
      const syncNonce = await getNextCurrentSyncNonce(
        user,
        network,
        contractAddress
      );
      logger.info(`Sync nonce generated: ${syncNonce}`);

      if (!syncNonce || syncNonce === undefined || syncNonce === null) {
        throw new Error(`Contract returned invalid nonce: ${syncNonce}`);
      }

      return syncNonce;
    } else {
      // Asynchronous - use random nonce
      logger.info(`Generating asynchronous random nonce for user: ${user}`);
      const randomNonce = generateMersenneTwisterNonce();
      logger.info(
        `Random nonce generated: ${randomNonce} (type: ${typeof randomNonce})`
      );

      if (!randomNonce || randomNonce === undefined || randomNonce === null) {
        throw new Error(`Random nonce generation failed: ${randomNonce}`);
      }

      // Convert BigInt to string properly
      const nonceString = randomNonce.toString();
      logger.info(`Converted nonce to string: ${nonceString}`);
      return nonceString;
    }
  } catch (error) {
    logger.error("Error generating nonce by priority:", error);
    throw new Error("Failed to generate nonce based on priority");
  }
};

/**
 * Generate signature for single payment
 */
const generatePaymentSignature = async (
  privateKey,
  params,
  network = "sepolia"
) => {
  try {
    const wallet = createWallet(privateKey, network);

    // Generate nonce based on priority
    logger.info(
      `Starting nonce generation for wallet: ${wallet.address}, priority: ${params.priority}, network: ${network}, contract: ${params.evvmContractAddress}`
    );

    const nonce = await generateNonceByPriority(
      wallet.address,
      params.priority,
      network,
      params.evvmContractAddress
    );

    logger.info(
      `Generated nonce: ${nonce} (type: ${typeof nonce}) for priority: ${
        params.priority
      }`
    );

    // Validate nonce
    if (
      !nonce ||
      nonce === undefined ||
      nonce === null ||
      nonce === "undefined" ||
      nonce === "null"
    ) {
      throw new Error(
        `Failed to generate nonce. Received: ${nonce} (type: ${typeof nonce})`
      );
    }

    // Determine if using username or address
    const isUsingUsername =
      !params.recipient.startsWith("0x") || params.recipient.length !== 42;

    // Prepare data exactly like frontend signPay
    const formData = {
      evvmID: params.evvmContractAddress,
      nonce: nonce,
      tokenAddress: params.tokenAddress,
      to: params.recipient,
      executor: params.executor || "0x0000000000000000000000000000000000000000",
      amount: params.amount,
      priorityFee: params.priorityFee,
    };

    // Create signature data structure matching the exact example format
    const signatureData = {
      from: wallet.address,
      to_address: isUsingUsername
        ? "0x0000000000000000000000000000000000000000"
        : formData.to,
      to_identity: isUsingUsername ? formData.to : "",
      token: formData.tokenAddress,
      amount: parseInt(formData.amount), // Keep as integer, not BigInt
      priorityFee: parseInt(formData.priorityFee), // Keep as integer, not BigInt
      nonce: parseInt(nonce.toString()), // Convert nonce to string then parse as integer
      priority: params.priority === "high",
      executor: formData.executor,
    };

    logger.info(`Final signature data nonce: ${signatureData.nonce}`);

    // Build message using the signature data
    const { buildMessageSignedForPay } = require("./constructMessage");
    const message = buildMessageSignedForPay({ ...signatureData, network });

    // Create typed data
    const domain = {
      name: "EVVM Signature Constructor",
      version: "1",
      chainId: network === "ethereum" ? 11155111 : 421614, // Sepolia testnets
      verifyingContract:
        params.evvmContractAddress ||
        "0x0000000000000000000000000000000000000000",
    };

    const typedData = createTypedData(message, domain);

    // Sign the typed data
    const signature = await signTypedData(wallet, typedData);

    logger.info(
      `Payment signature generated for wallet: ${wallet.address} with ${params.priority} priority nonce: ${nonce}`
    );

    return {
      signature,
      message,
      typedData,
      walletAddress: wallet.address,
      nonce,
      signatureData, // Include the signature data structure
    };
  } catch (error) {
    logger.error("Error generating payment signature:", error);
    throw new Error("Failed to generate payment signature");
  }
};

/**
 * Generate signature for disperse payment
 */
const generateDispersePaymentSignature = async (
  privateKey,
  params,
  network = "sepolia"
) => {
  try {
    const wallet = createWallet(privateKey, network);

    // Generate nonce based on priority
    const nonce = await generateNonceByPriority(
      wallet.address,
      params.priority,
      network,
      params.evvmContractAddress
    );

    // Process recipients to match frontend format
    const toData = params.recipients.map((recipient) => {
      const isUsingUsername = !recipient.address || recipient.address === "";
      return {
        to_address: isUsingUsername
          ? "0x0000000000000000000000000000000000000000"
          : recipient.address,
        to_identity: isUsingUsername ? recipient.username : "",
        amount: BigInt(recipient.amount),
      };
    });

    // Create signature data structure matching the exact example format
    const signatureData = {
      from: wallet.address,
      toData: toData,
      token: params.tokenAddress,
      amount: parseInt(params.totalAmount), // Keep as integer, not BigInt
      priorityFee: parseInt(params.priorityFee), // Keep as integer, not BigInt
      nonce: parseInt(nonce), // Keep as integer, not BigInt
      priority: params.priority === "high",
      executor: params.executor || "0x0000000000000000000000000000000000000000",
    };

    // Build message using the signature data
    const { buildMessageSignedForDispersePay } = require("./constructMessage");
    const message = buildMessageSignedForDispersePay({
      ...signatureData,
      network,
    });

    // Create typed data
    const domain = {
      name: "EVVM Signature Constructor",
      version: "1",
      chainId: network === "ethereum" ? 11155111 : 421614, // Sepolia testnets
      verifyingContract:
        params.evvmContractAddress ||
        "0x0000000000000000000000000000000000000000",
    };

    const typedData = createTypedData(message, domain);

    // Sign the typed data
    const signature = await signTypedData(wallet, typedData);

    logger.info(
      `Disperse payment signature generated for wallet: ${wallet.address} with ${params.priority} priority nonce: ${nonce}`
    );

    return {
      signature,
      message,
      typedData,
      walletAddress: wallet.address,
      nonce,
      signatureData, // Include the signature data structure
    };
  } catch (error) {
    logger.error("Error generating disperse payment signature:", error);
    throw new Error("Failed to generate disperse payment signature");
  }
};

/**
 * Generate signature for public staking
 */
const generatePublicStakingSignature = async (
  privateKey,
  params,
  network = "sepolia"
) => {
  try {
    const wallet = createWallet(privateKey, network);

    // Build message
    const {
      buildMessageSignedForPublicStaking,
    } = require("./constructMessage");
    const message = buildMessageSignedForPublicStaking({ ...params, network });

    // Create typed data
    const domain = {
      name: "EVVM Signature Constructor",
      version: "1",
      chainId: network === "ethereum" ? 11155111 : 421614, // Sepolia testnets
      verifyingContract:
        params.evvmContractAddress ||
        "0x0000000000000000000000000000000000000000",
    };

    const typedData = createTypedData(message, domain);

    // Sign the typed data
    const signature = await signTypedData(wallet, typedData);

    logger.info(
      `Public staking signature generated for wallet: ${wallet.address}`
    );

    return {
      signature,
      message,
      typedData,
      walletAddress: wallet.address,
    };
  } catch (error) {
    logger.error("Error generating public staking signature:", error);
    throw new Error("Failed to generate public staking signature");
  }
};

/**
 * Generate signature for presale staking
 */
const generatePresaleStakingSignature = async (
  privateKey,
  params,
  network = "sepolia"
) => {
  try {
    const wallet = createWallet(privateKey, network);

    // Build message
    const {
      buildMessageSignedForPresaleStaking,
    } = require("./constructMessage");
    const message = buildMessageSignedForPresaleStaking({ ...params, network });

    // Create typed data
    const domain = {
      name: "EVVM Signature Constructor",
      version: "1",
      chainId: network === "ethereum" ? 11155111 : 421614, // Sepolia testnets
      verifyingContract:
        params.evvmContractAddress ||
        "0x0000000000000000000000000000000000000000",
    };

    const typedData = createTypedData(message, domain);

    // Sign the typed data
    const signature = await signTypedData(wallet, typedData);

    logger.info(
      `Presale staking signature generated for wallet: ${wallet.address}`
    );

    return {
      signature,
      message,
      typedData,
      walletAddress: wallet.address,
    };
  } catch (error) {
    logger.error("Error generating presale staking signature:", error);
    throw new Error("Failed to generate presale staking signature");
  }
};

/**
 * Generate dual signatures for presale staking (EVVM + Staking)
 */
const generateDualPresaleStakingSignatures = async (
  privateKey,
  params,
  network = "sepolia"
) => {
  try {
    const wallet = createWallet(privateKey, network);

    // Generate EVVM signature
    const evvmSignature = await generatePresaleStakingSignature(
      privateKey,
      params,
      network
    );

    // Generate staking signature (same parameters but different nonce)
    const stakingParams = {
      ...params,
      nonce: params.stakingNonce,
    };
    const stakingSignature = await generatePresaleStakingSignature(
      privateKey,
      stakingParams,
      network
    );

    logger.info(
      `Dual presale staking signatures generated for wallet: ${wallet.address}`
    );

    return {
      evvmSignature,
      stakingSignature,
      walletAddress: wallet.address,
    };
  } catch (error) {
    logger.error("Error generating dual presale staking signatures:", error);
    throw new Error("Failed to generate dual presale staking signatures");
  }
};

/**
 * Verify a signature
 */
const verifySignature = (message, signature, expectedAddress) => {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    logger.error("Error verifying signature:", error);
    return false;
  }
};

/**
 * Verify typed data signature
 */
const verifyTypedDataSignature = (typedData, signature, expectedAddress) => {
  try {
    const recoveredAddress = ethers.verifyTypedData(
      typedData.domain,
      typedData.types,
      typedData.message,
      signature
    );
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    logger.error("Error verifying typed data signature:", error);
    return false;
  }
};

/**
 * Format signature for display
 */
const formatSignature = (signature) => {
  return {
    r: signature.slice(0, 66),
    s: signature.slice(66, 130),
    v: signature.slice(130, 132),
    full: signature,
  };
};

/**
 * Create signature summary for user display
 */
const createSignatureSummary = (signatureData, type) => {
  const { signature, message, walletAddress, nonce } = signatureData;
  const formatted = formatSignature(signature);

  return {
    type,
    walletAddress,
    nonce,
    signature: {
      r: formatted.r,
      s: formatted.s,
      v: formatted.v,
      full: formatted.full,
    },
    message,
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  generatePaymentSignature,
  generateDispersePaymentSignature,
  generatePublicStakingSignature,
  generatePresaleStakingSignature,
  generateDualPresaleStakingSignatures,
  generateNonceByPriority,
  verifySignature,
  verifyTypedDataSignature,
  formatSignature,
  createSignatureSummary,
};
