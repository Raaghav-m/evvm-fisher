const { ethers } = require("ethers");
const { getRpcUrl } = require("./config");
const logger = require("./logger");

/**
 * Create a provider for the specified network
 */
const createProvider = (network) => {
  const rpcUrl = getRpcUrl(network);
  if (!rpcUrl) {
    throw new Error(`No RPC URL configured for network: ${network}`);
  }

  return new ethers.JsonRpcProvider(rpcUrl);
};

/**
 * Create a wallet instance from private key
 * Enhanced with security measures matching frontend implementation
 */
const createWallet = (privateKey, network = "ethereum") => {
  try {
    const provider = createProvider(network);
    const wallet = new ethers.Wallet(privateKey, provider);

    // Log wallet creation (without exposing private key)
    logger.info(
      `Wallet created for address: ${wallet.address} on network: ${network}`
    );

    return wallet;
  } catch (error) {
    logger.error("Error creating wallet:", error);
    throw new Error("Failed to create wallet instance");
  }
};

/**
 * Sign a message with the wallet
 */
const signMessage = async (wallet, message) => {
  try {
    const signature = await wallet.signMessage(message);
    return signature;
  } catch (error) {
    logger.error("Error signing message:", error);
    throw new Error("Failed to sign message");
  }
};

/**
 * Sign typed data (EIP-712)
 */
const signTypedData = async (wallet, typedData) => {
  try {
    const signature = await wallet.signTypedData(
      typedData.domain,
      typedData.types,
      typedData.message
    );
    return signature;
  } catch (error) {
    logger.error("Error signing typed data:", error);
    throw new Error("Failed to sign typed data");
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
 * Get wallet balance
 */
const getBalance = async (address, network = "ethereum") => {
  try {
    const provider = createProvider(network);
    const balance = await provider.getBalance(address);
    return balance;
  } catch (error) {
    logger.error("Error getting balance:", error);
    throw new Error("Failed to get wallet balance");
  }
};

/**
 * Get token balance (ERC-20)
 */
const getTokenBalance = async (
  tokenAddress,
  walletAddress,
  network = "ethereum"
) => {
  try {
    const provider = createProvider(network);

    // ERC-20 ABI for balanceOf function
    const erc20Abi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
      "function name() view returns (string)",
    ];

    const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const balance = await contract.balanceOf(walletAddress);
    const decimals = await contract.decimals();

    return {
      balance,
      decimals,
      formatted: ethers.formatUnits(balance, decimals),
    };
  } catch (error) {
    logger.error("Error getting token balance:", error);
    throw new Error("Failed to get token balance");
  }
};

/**
 * Estimate gas for a transaction
 */
const estimateGas = async (transaction, network = "ethereum") => {
  try {
    const provider = createProvider(network);
    const gasEstimate = await provider.estimateGas(transaction);
    return gasEstimate;
  } catch (error) {
    logger.error("Error estimating gas:", error);
    throw new Error("Failed to estimate gas");
  }
};

/**
 * Get current gas price
 */
const getGasPrice = async (network = "ethereum") => {
  try {
    const provider = createProvider(network);
    const feeData = await provider.getFeeData();
    return {
      gasPrice: feeData.gasPrice,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
    };
  } catch (error) {
    logger.error("Error getting gas price:", error);
    throw new Error("Failed to get gas price");
  }
};

/**
 * Generate a new wallet
 */
const generateWallet = () => {
  try {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic.phrase,
    };
  } catch (error) {
    logger.error("Error generating wallet:", error);
    throw new Error("Failed to generate wallet");
  }
};

module.exports = {
  createProvider,
  createWallet,
  signMessage,
  signTypedData,
  verifySignature,
  verifyTypedDataSignature,
  getBalance,
  getTokenBalance,
  estimateGas,
  getGasPrice,
  generateWallet,
};
