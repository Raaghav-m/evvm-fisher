const { ethers } = require("ethers");
const {
  hashPreregisteredUsername,
  generateMersenneTwisterNonce,
} = require("./dataHashing");

/**
 * Build message for single payment signature
 * Matches the frontend implementation exactly
 */
const buildMessageSignedForPay = (params) => {
  const {
    from,
    to_address,
    to_identity,
    token,
    amount,
    priorityFee,
    nonce,
    priority,
    executor,
    network = "sepolia",
  } = params;

  // Validate required parameters
  if (
    !from ||
    !token ||
    !amount ||
    !nonce ||
    !priorityFee ||
    priority === undefined
  ) {
    throw new Error("Missing required parameters for payment signature");
  }

  // Build the message in the exact format: 0,pay,to_address,token,amount,priorityFee,nonce,priority,executor
  const message = [
    0, // Operation type
    "pay", // Operation name
    to_address || "0x0000000000000000000000000000000000000000", // to_address
    token, // token address
    amount, // amount (as integer)
    priorityFee, // priorityFee (as integer)
    nonce, // nonce (as integer)
    priority, // priority (boolean)
    executor || "0x0000000000000000000000000000000000000000", // executor
  ];

  return message;
};

/**
 * Build message for disperse payment signature
 * Matches the frontend implementation exactly
 */
const buildMessageSignedForDispersePay = (params) => {
  const {
    recipients,
    tokenAddress,
    totalAmount,
    priorityFee,
    nonce,
    priority,
    executorAddress,
    network = "sepolia",
  } = params;

  // Validate required parameters
  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("Recipients array is required for disperse payment");
  }

  if (!tokenAddress || !totalAmount || !priorityFee || !nonce || !priority) {
    throw new Error(
      "Missing required parameters for disperse payment signature"
    );
  }

  // Validate recipients
  recipients.forEach((recipient, index) => {
    if (!recipient.address && !recipient.username) {
      throw new Error(
        `Recipient ${index + 1} must have either address or username`
      );
    }
    if (!recipient.amount) {
      throw new Error(`Recipient ${index + 1} must have an amount`);
    }
  });

  // Process recipients - hash usernames if needed
  const processedRecipients = recipients.map((recipient) => {
    let processedRecipient = { ...recipient };

    if (recipient.username && !recipient.address) {
      // Hash the username
      const hashedUsername = hashPreregisteredUsername(recipient.username);
      processedRecipient.username = hashedUsername.toString();
    }

    return processedRecipient;
  });

  // Build the message structure matching frontend
  const message = {
    type: "disperse_payment",
    network,
    recipients: processedRecipients.map((recipient) => ({
      address: recipient.address || null,
      username: recipient.username || null,
      amount: ethers.parseEther(recipient.amount.toString()),
    })),
    tokenAddress,
    totalAmount: ethers.parseEther(totalAmount.toString()),
    priorityFee: ethers.parseEther(priorityFee.toString()),
    nonce: BigInt(nonce),
    priority: priority.toLowerCase(),
    executorAddress: executorAddress || null,
    timestamp: Math.floor(Date.now() / 1000),
  };

  return message;
};

/**
 * Build message for presale staking signature
 * Matches the frontend implementation exactly
 */
const buildMessageSignedForPresaleStaking = (params) => {
  const {
    action, // 'stake' or 'unstake'
    stakingAddress,
    amount,
    evvmNonce,
    stakingNonce,
    priorityFee,
    priority,
    network = "sepolia",
  } = params;

  // Validate required parameters
  if (
    !action ||
    !stakingAddress ||
    !amount ||
    !evvmNonce ||
    !stakingNonce ||
    !priorityFee ||
    !priority
  ) {
    throw new Error(
      "Missing required parameters for presale staking signature"
    );
  }

  if (!["stake", "unstake"].includes(action.toLowerCase())) {
    throw new Error('Action must be either "stake" or "unstake"');
  }

  // Build the message structure matching frontend
  const message = {
    type: "presale_staking",
    network,
    action: action.toLowerCase(),
    stakingAddress,
    amount: ethers.parseEther(amount.toString()),
    evvmNonce: BigInt(evvmNonce),
    stakingNonce: BigInt(stakingNonce),
    priorityFee: ethers.parseEther(priorityFee.toString()),
    priority: priority.toLowerCase(),
    timestamp: Math.floor(Date.now() / 1000),
  };

  return message;
};

/**
 * Build message for public staking signature
 * Matches the frontend implementation exactly
 */
const buildMessageSignedForPublicStaking = (params) => {
  const {
    action, // 'stake' or 'unstake'
    stakingAddress,
    amount,
    nonce,
    priorityFee,
    priority,
    network = "sepolia",
  } = params;

  // Validate required parameters
  if (
    !action ||
    !stakingAddress ||
    !amount ||
    !nonce ||
    !priorityFee ||
    !priority
  ) {
    throw new Error("Missing required parameters for public staking signature");
  }

  if (!["stake", "unstake"].includes(action.toLowerCase())) {
    throw new Error('Action must be either "stake" or "unstake"');
  }

  // Build the message structure matching frontend
  const message = {
    type: "public_staking",
    network,
    action: action.toLowerCase(),
    stakingAddress,
    amount: ethers.parseEther(amount.toString()),
    nonce: BigInt(nonce),
    priorityFee: ethers.parseEther(priorityFee.toString()),
    priority: priority.toLowerCase(),
    timestamp: Math.floor(Date.now() / 1000),
  };

  return message;
};

/**
 * Create a typed data structure for EIP-712 signing
 * Matches the frontend implementation exactly
 */
const createTypedData = (message, domain) => {
  const types = {
    Message: [],
  };

  // Define types based on message type
  switch (message.type) {
    case "payment":
      types.Message = [
        { name: "type", type: "string" },
        { name: "network", type: "string" },
        { name: "recipient", type: "address" },
        { name: "tokenAddress", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "priorityFee", type: "uint256" },
        { name: "priority", type: "string" },
        { name: "timestamp", type: "uint256" },
      ];
      break;
    case "disperse_payment":
      types.Message = [
        { name: "type", type: "string" },
        { name: "network", type: "string" },
        { name: "recipients", type: "Recipient[]" },
        { name: "tokenAddress", type: "address" },
        { name: "totalAmount", type: "uint256" },
        { name: "priorityFee", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "priority", type: "string" },
        { name: "executorAddress", type: "address" },
        { name: "timestamp", type: "uint256" },
      ];
      types.Recipient = [
        { name: "address", type: "address" },
        { name: "username", type: "string" },
        { name: "amount", type: "uint256" },
      ];
      break;
    case "presale_staking":
    case "public_staking":
      types.Message = [
        { name: "type", type: "string" },
        { name: "network", type: "string" },
        { name: "action", type: "string" },
        { name: "stakingAddress", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "priorityFee", type: "uint256" },
        { name: "priority", type: "string" },
        { name: "timestamp", type: "uint256" },
      ];
      if (message.type === "presale_staking") {
        types.Message.push({ name: "stakingNonce", type: "uint256" });
      }
      break;
    default:
      throw new Error(`Unsupported message type: ${message.type}`);
  }

  return {
    domain: {
      name: domain.name,
      version: domain.version,
      chainId: domain.chainId,
      verifyingContract: domain.verifyingContract,
    },
    types,
    primaryType: "Message",
    message,
  };
};

/**
 * Generate random nonce using Mersenne Twister
 * Matches frontend implementation
 */
const generateRandomNonce = () => {
  return generateMersenneTwisterNonce();
};

/**
 * Generate multiple nonces for presale staking
 */
const generateDualNonces = () => {
  return {
    evvmNonce: generateMersenneTwisterNonce(),
    stakingNonce: generateMersenneTwisterNonce(),
  };
};

module.exports = {
  buildMessageSignedForPay,
  buildMessageSignedForDispersePay,
  buildMessageSignedForPresaleStaking,
  buildMessageSignedForPublicStaking,
  createTypedData,
  generateRandomNonce,
  generateDualNonces,
};
