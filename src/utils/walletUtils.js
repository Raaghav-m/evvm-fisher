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
const createWallet = (privateKey, network = "sepolia") => {
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
 * Get wallet balance using EVVM contract
 */
const getBalance = async (
  user,
  token,
  network = "sepolia",
  contractAddress = "0xF817e9ad82B4a19F00dA7A248D9e556Ba96e6366"
) => {
  try {
    // Use provided contract address or fall back to environment variable
    const evvmContractAddress =
      contractAddress || process.env.EVVM_CONTRACT_ADDRESS;

    if (!evvmContractAddress) {
      throw new Error(
        "EVVM contract address not provided. Please set EVVM_CONTRACT_ADDRESS in your environment variables."
      );
    }

    // Define the EVVM ABI locally to avoid ES module issues
    const EvvmABI = [
      {
        inputs: [
          { internalType: "address", name: "user", type: "address" },
          { internalType: "address", name: "token", type: "address" },
        ],
        name: "getBalance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ];

    const provider = createProvider(network);
    const evvmContract = new ethers.Contract(
      evvmContractAddress,
      EvvmABI,
      provider
    );
    const result = await evvmContract.getBalance(user, token);
    return result ? result.toString() : "0";
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
const estimateGas = async (transaction, network = "sepolia") => {
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
const getGasPrice = async (network = "sepolia") => {
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
 * Get next synchronous nonce from EVVM contract
 */
const getNextCurrentSyncNonce = async (
  user,
  network = "sepolia",
  contractAddress = "0xF817e9ad82B4a19F00dA7A248D9e556Ba96e6366"
) => {
  try {
    // Use provided contract address or fall back to environment variable
    const evvmContractAddress =
      contractAddress || process.env.EVVM_CONTRACT_ADDRESS;

    if (!evvmContractAddress) {
      throw new Error(
        "EVVM contract address not provided. Please set EVVM_CONTRACT_ADDRESS in your environment variables."
      );
    }

    // Define the EVVM ABI for getNextCurrentSyncNonce function
    const EvvmABI = [
      {
        inputs: [{ internalType: "address", name: "user", type: "address" }],
        name: "getNextCurrentSyncNonce",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ];

    const provider = createProvider(network);
    const evvmContract = new ethers.Contract(
      evvmContractAddress,
      EvvmABI,
      provider
    );

    logger.info(`Calling contract getNextCurrentSyncNonce for user: ${user}`);
    const nonce = await evvmContract.getNextCurrentSyncNonce(user);
    logger.info(`Contract returned nonce: ${nonce} (type: ${typeof nonce})`);

    if (!nonce || nonce === undefined || nonce === null) {
      throw new Error(`Contract returned invalid nonce: ${nonce}`);
    }

    const nonceString = nonce.toString();
    logger.info(`Converted contract nonce to string: ${nonceString}`);
    return nonceString;
  } catch (error) {
    logger.error("Error getting sync nonce:", error);
    throw new Error("Failed to get synchronous nonce");
  }
};

/**
 * Execute payment using EVVM contract
 */
const executePay = async (
  inputData,
  network = "sepolia",
  contractAddress = "0xF817e9ad82B4a19F00dA7A248D9e556Ba96e6366",
  userPrivateKey = null
) => {
  try {
    // Use provided contract address or fall back to environment variable
    const evvmContractAddress =
      contractAddress || process.env.EVVM_CONTRACT_ADDRESS;

    if (!evvmContractAddress) {
      throw new Error(
        "EVVM contract address not provided. Please set EVVM_CONTRACT_ADDRESS in your environment variables."
      );
    }

    if (!userPrivateKey) {
      throw new Error("User private key is required to sign the transaction");
    }

    if (!inputData) {
      throw new Error("No data to execute payment");
    }

    // Define the EVVM ABI for pay function
    const EvvmABI = [
      {
        inputs: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to_address", type: "address" },
          { internalType: "string", name: "to_identity", type: "string" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "priorityFee", type: "uint256" },
          { internalType: "uint256", name: "nonce", type: "uint256" },
          { internalType: "bool", name: "priority", type: "bool" },
          { internalType: "address", name: "executor", type: "address" },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        name: "pay",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];

    const provider = createProvider(network);
    const userWallet = new ethers.Wallet(userPrivateKey, provider);

    const evvmContract = new ethers.Contract(
      evvmContractAddress,
      EvvmABI,
      userWallet
    );

    // Execute the pay function with all arguments
    const tx = await evvmContract.pay(
      inputData.from,
      inputData.to_address,
      inputData.to_identity,
      inputData.token,
      inputData.amount,
      inputData.priorityFee,
      inputData.nonce,
      inputData.priority,
      inputData.executor,
      inputData.signature
    );

    const receipt = await tx.wait();

    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
    };
  } catch (error) {
    logger.error("Error executing payment:", error);
    throw new Error("Failed to execute payment");
  }
};

/**
 * Add balance to user's account using EVVM contract
 */
const addBalance = async (
  user,
  token,
  quantity,
  network = "sepolia",
  contractAddress = "0xF817e9ad82B4a19F00dA7A248D9e556Ba96e6366",
  privateKey = null
) => {
  try {
    // Use provided contract address or fall back to environment variable
    const evvmContractAddress =
      contractAddress || process.env.EVVM_CONTRACT_ADDRESS;

    if (!evvmContractAddress) {
      throw new Error(
        "EVVM contract address not provided. Please set EVVM_CONTRACT_ADDRESS in your environment variables."
      );
    }

    // Define the EVVM ABI for addBalance function
    const EvvmABI = [
      {
        inputs: [
          { internalType: "address", name: "user", type: "address" },
          { internalType: "address", name: "token", type: "address" },
          { internalType: "uint256", name: "quantity", type: "uint256" },
        ],
        name: "addBalance",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ];

    const provider = createProvider(network);

    // Create a wallet from the user's private key
    if (!privateKey) {
      throw new Error("User private key is required to sign the transaction");
    }
    const userWallet = new ethers.Wallet(privateKey, provider);

    const evvmContract = new ethers.Contract(
      evvmContractAddress,
      EvvmABI,
      userWallet
    );

    // Call the addBalance function
    const tx = await evvmContract.addBalance(user, token, quantity);
    const receipt = await tx.wait();

    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    logger.error("Error adding balance:", error);
    throw new Error("Failed to add balance");
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

/**
 * Generate a random nonce using Mersenne Twister algorithm
 * This generates a random nonce for asynchronous operations
 */
const generateRandomNonce = () => {
  try {
    const MersenneTwister = require("mersenne-twister");
    const mt = new MersenneTwister();

    // Generate a random number and convert to BigInt
    const randomNumber = mt.random();
    const nonce = BigInt(Math.floor(randomNumber * Number.MAX_SAFE_INTEGER));

    logger.info(`Generated random nonce: ${nonce}`);
    return nonce;
  } catch (error) {
    logger.error("Error generating random nonce:", error);
    throw new Error("Failed to generate random nonce");
  }
};

/**
 * Get the next nonce from the EVVM contract
 * This calls the contract's getNextNonce function for synchronous operations
 */
const getNextNonce = async (
  userAddress,
  network = "sepolia",
  contractAddress = "0xF817e9ad82B4a19F00dA7A248D9e556Ba96e6366"
) => {
  try {
    // Use provided contract address or fall back to environment variable
    const evvmContractAddress =
      contractAddress || process.env.EVVM_CONTRACT_ADDRESS;

    if (!evvmContractAddress) {
      throw new Error(
        "EVVM contract address not provided. Please set EVVM_CONTRACT_ADDRESS in your environment variables."
      );
    }

    if (!userAddress || !ethers.isAddress(userAddress)) {
      throw new Error("Valid user address is required");
    }

    // Define the EVVM ABI for getNextCurrentSyncNonce function
    const EvvmABI = [
      {
        inputs: [{ internalType: "address", name: "user", type: "address" }],
        name: "getNextCurrentSyncNonce",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ];

    const provider = createProvider(network);
    const evvmContract = new ethers.Contract(
      evvmContractAddress,
      EvvmABI,
      provider
    );

    const result = await evvmContract.getNextCurrentSyncNonce(userAddress);
    const nonce = BigInt(result.toString());

    logger.info(
      `Retrieved next nonce from contract for ${userAddress}: ${nonce}`
    );
    return nonce;
  } catch (error) {
    logger.error("Error getting next nonce from contract:", error);
    throw new Error("Failed to get next nonce from contract");
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
  addBalance,
  getNextCurrentSyncNonce,
  executePay,
  estimateGas,
  getGasPrice,
  generateWallet,
  generateRandomNonce,
  getNextNonce,
};
