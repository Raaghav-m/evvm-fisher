const { ethers } = require("ethers");
const { createWallet, signTypedData } = require("./walletUtils");
const { createTypedData } = require("./constructMessage");
const logger = require("./logger");

/**
 * Secure signature generation utilities matching the frontend implementation
 */

/**
 * Generate signature for single payment
 */
const generatePaymentSignature = async (
  privateKey,
  params,
  network = "ethereum"
) => {
  try {
    const wallet = createWallet(privateKey, network);

    // Build message
    const { buildMessageSignedForPay } = require("./constructMessage");
    const message = buildMessageSignedForPay({ ...params, network });

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

    logger.info(`Payment signature generated for wallet: ${wallet.address}`);

    return {
      signature,
      message,
      typedData,
      walletAddress: wallet.address,
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
  network = "ethereum"
) => {
  try {
    const wallet = createWallet(privateKey, network);

    // Build message
    const { buildMessageSignedForDispersePay } = require("./constructMessage");
    const message = buildMessageSignedForDispersePay({ ...params, network });

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
      `Disperse payment signature generated for wallet: ${wallet.address}`
    );

    return {
      signature,
      message,
      typedData,
      walletAddress: wallet.address,
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
  network = "ethereum"
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
  network = "ethereum"
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
  network = "ethereum"
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
  const { signature, message, walletAddress } = signatureData;
  const formatted = formatSignature(signature);

  return {
    type,
    walletAddress,
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
  verifySignature,
  verifyTypedDataSignature,
  formatSignature,
  createSignatureSummary,
};
