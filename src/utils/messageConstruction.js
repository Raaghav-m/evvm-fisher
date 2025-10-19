const { ethers } = require("ethers");
const { hashPreregisteredUsername } = require("./dataHashing");

/**
 * Build message for single payment signature
 */
const buildMessageSignedForPay = (params) => {
  const {
    recipient,
    tokenAddress,
    amount,
    nonce,
    priorityFee,
    priority,
    network = "ethereum",
  } = params;

  // Validate required parameters
  if (
    !recipient ||
    !tokenAddress ||
    !amount ||
    !nonce ||
    !priorityFee ||
    !priority
  ) {
    throw new Error("Missing required parameters for payment signature");
  }

  // Build the message structure
  const message = {
    type: "payment",
    network,
    recipient,
    tokenAddress,
    amount: ethers.parseEther(amount.toString()),
    nonce: BigInt(nonce),
    priorityFee: ethers.parseEther(priorityFee.toString()),
    priority: priority.toLowerCase(),
    timestamp: Math.floor(Date.now() / 1000),
  };

  return message;
};

/**
 * Build message for disperse payment signature
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
    network = "ethereum",
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

  // Build the message structure
  const message = {
    type: "disperse_payment",
    network,
    recipients: recipients.map((recipient) => ({
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
    network = "ethereum",
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

  // Build the message structure
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
 */
const buildMessageSignedForPublicStaking = (params) => {
  const {
    action, // 'stake' or 'unstake'
    stakingAddress,
    amount,
    nonce,
    priorityFee,
    priority,
    network = "ethereum",
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

  // Build the message structure
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
 */
const createTypedData = (message, domain) => {
  const types = {
    EIP712Domain: [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ],
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
    domain,
    types,
    primaryType: "Message",
    message,
  };
};

module.exports = {
  buildMessageSignedForPay,
  buildMessageSignedForDispersePay,
  buildMessageSignedForPresaleStaking,
  buildMessageSignedForPublicStaking,
  createTypedData,
};
