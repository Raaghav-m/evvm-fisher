const { ethers } = require("ethers");

/**
 * Comprehensive validation utilities matching the frontend implementation
 */

/**
 * Validate Ethereum address
 */
const isValidAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
};

/**
 * Validate username format (3-20 characters, alphanumeric and underscores only)
 */
const isValidUsername = (username) => {
  if (!username || typeof username !== "string") {
    return false;
  }

  const cleanUsername = username.trim();
  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    return false;
  }

  // Username should be alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(cleanUsername);
};

/**
 * Validate amount (should be a positive number)
 */
const isValidAmount = (amount) => {
  if (typeof amount === "string") {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && isFinite(num);
  }
  if (typeof amount === "number") {
    return amount > 0 && !isNaN(amount) && isFinite(amount);
  }
  return false;
};

/**
 * Validate priority fee (should be non-negative)
 */
const isValidPriorityFee = (fee) => {
  if (typeof fee === "string") {
    const num = parseFloat(fee);
    return !isNaN(num) && num >= 0 && isFinite(num);
  }
  if (typeof fee === "number") {
    return fee >= 0 && !isNaN(fee) && isFinite(fee);
  }
  return false;
};

/**
 * Validate priority level
 */
const isValidPriority = (priority) => {
  const validPriorities = ["low", "high"];
  return validPriorities.includes(priority.toLowerCase());
};

/**
 * Validate private key format
 */
const isValidPrivateKey = (privateKey) => {
  try {
    // Remove 0x prefix if present
    const cleanKey = privateKey.startsWith("0x")
      ? privateKey.slice(2)
      : privateKey;

    // Check if it's a valid hex string of correct length
    if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
      return false;
    }

    // Try to create a wallet to validate
    new ethers.Wallet("0x" + cleanKey);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate token address (can be zero address for ETH)
 */
const isValidTokenAddress = (address) => {
  if (!address || typeof address !== "string") {
    return false;
  }

  // Allow zero address for ETH
  if (address === "0x0000000000000000000000000000000000000000") {
    return true;
  }

  return isValidAddress(address);
};

/**
 * Validate staking address
 */
const isValidStakingAddress = (address) => {
  return isValidAddress(address);
};

/**
 * Validate network
 */
const isValidNetwork = (network) => {
  const validNetworks = ["ethereum", "arbitrum"];
  return validNetworks.includes(network.toLowerCase());
};

/**
 * Validate action (stake/unstake)
 */
const isValidAction = (action) => {
  const validActions = ["stake", "unstake"];
  return validActions.includes(action.toLowerCase());
};

/**
 * Validate nonce (should be a positive integer)
 */
const isValidNonce = (nonce) => {
  if (typeof nonce === "string") {
    const num = parseInt(nonce);
    return !isNaN(num) && num > 0 && Number.isInteger(parseFloat(nonce));
  }
  if (typeof nonce === "number") {
    return Number.isInteger(nonce) && nonce > 0;
  }
  if (typeof nonce === "bigint") {
    return nonce > 0n;
  }
  return false;
};

/**
 * Validate recipient data for disperse payments
 */
const isValidRecipient = (recipient) => {
  if (!recipient || typeof recipient !== "object") {
    return false;
  }

  // Must have either address or username
  const hasAddress = recipient.address && isValidAddress(recipient.address);
  const hasUsername = recipient.username && isValidUsername(recipient.username);

  if (!hasAddress && !hasUsername) {
    return false;
  }

  // Must have valid amount
  if (!isValidAmount(recipient.amount)) {
    return false;
  }

  return true;
};

/**
 * Validate recipients array for disperse payments
 */
const isValidRecipients = (recipients) => {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return false;
  }

  // Check each recipient
  for (const recipient of recipients) {
    if (!isValidRecipient(recipient)) {
      return false;
    }
  }

  return true;
};

/**
 * Validate total amount matches sum of individual amounts
 */
const validateTotalAmount = (recipients, totalAmount) => {
  try {
    const sum = recipients.reduce((acc, recipient) => {
      return acc + parseFloat(recipient.amount);
    }, 0);

    return Math.abs(sum - parseFloat(totalAmount)) < 0.000001; // Allow for floating point precision
  } catch (error) {
    return false;
  }
};

/**
 * Validate message parameters for payment signature
 */
const validatePaymentParams = (params) => {
  const {
    recipient,
    tokenAddress,
    amount,
    nonce,
    priorityFee,
    priority,
    network,
  } = params;

  if (!recipient) {
    return { valid: false, error: "Recipient is required" };
  }

  if (!tokenAddress || !isValidTokenAddress(tokenAddress)) {
    return { valid: false, error: "Invalid token address" };
  }

  if (!amount || !isValidAmount(amount)) {
    return { valid: false, error: "Invalid amount" };
  }

  if (!nonce || !isValidNonce(nonce)) {
    return { valid: false, error: "Invalid nonce" };
  }

  if (!priorityFee || !isValidPriorityFee(priorityFee)) {
    return { valid: false, error: "Invalid priority fee" };
  }

  if (!priority || !isValidPriority(priority)) {
    return { valid: false, error: "Invalid priority" };
  }

  if (network && !isValidNetwork(network)) {
    return { valid: false, error: "Invalid network" };
  }

  return { valid: true };
};

/**
 * Validate message parameters for disperse payment signature
 */
const validateDispersePaymentParams = (params) => {
  const {
    recipients,
    tokenAddress,
    totalAmount,
    priorityFee,
    nonce,
    priority,
    network,
  } = params;

  if (!recipients || !isValidRecipients(recipients)) {
    return { valid: false, error: "Invalid recipients" };
  }

  if (!tokenAddress || !isValidTokenAddress(tokenAddress)) {
    return { valid: false, error: "Invalid token address" };
  }

  if (!totalAmount || !isValidAmount(totalAmount)) {
    return { valid: false, error: "Invalid total amount" };
  }

  if (!validateTotalAmount(recipients, totalAmount)) {
    return {
      valid: false,
      error: "Total amount doesn't match sum of individual amounts",
    };
  }

  if (!priorityFee || !isValidPriorityFee(priorityFee)) {
    return { valid: false, error: "Invalid priority fee" };
  }

  if (!nonce || !isValidNonce(nonce)) {
    return { valid: false, error: "Invalid nonce" };
  }

  if (!priority || !isValidPriority(priority)) {
    return { valid: false, error: "Invalid priority" };
  }

  if (network && !isValidNetwork(network)) {
    return { valid: false, error: "Invalid network" };
  }

  return { valid: true };
};

/**
 * Validate message parameters for staking signature
 */
const validateStakingParams = (params) => {
  const {
    action,
    stakingAddress,
    amount,
    nonce,
    priorityFee,
    priority,
    network,
  } = params;

  if (!action || !isValidAction(action)) {
    return { valid: false, error: "Invalid action" };
  }

  if (!stakingAddress || !isValidStakingAddress(stakingAddress)) {
    return { valid: false, error: "Invalid staking address" };
  }

  if (!amount || !isValidAmount(amount)) {
    return { valid: false, error: "Invalid amount" };
  }

  if (!nonce || !isValidNonce(nonce)) {
    return { valid: false, error: "Invalid nonce" };
  }

  if (!priorityFee || !isValidPriorityFee(priorityFee)) {
    return { valid: false, error: "Invalid priority fee" };
  }

  if (!priority || !isValidPriority(priority)) {
    return { valid: false, error: "Invalid priority" };
  }

  if (network && !isValidNetwork(network)) {
    return { valid: false, error: "Invalid network" };
  }

  return { valid: true };
};

/**
 * Validate message parameters for presale staking signature
 */
const validatePresaleStakingParams = (params) => {
  const {
    action,
    stakingAddress,
    amount,
    evvmNonce,
    stakingNonce,
    priorityFee,
    priority,
    network,
  } = params;

  if (!action || !isValidAction(action)) {
    return { valid: false, error: "Invalid action" };
  }

  if (!stakingAddress || !isValidStakingAddress(stakingAddress)) {
    return { valid: false, error: "Invalid staking address" };
  }

  if (!amount || !isValidAmount(amount)) {
    return { valid: false, error: "Invalid amount" };
  }

  if (!evvmNonce || !isValidNonce(evvmNonce)) {
    return { valid: false, error: "Invalid EVVM nonce" };
  }

  if (!stakingNonce || !isValidNonce(stakingNonce)) {
    return { valid: false, error: "Invalid staking nonce" };
  }

  if (!priorityFee || !isValidPriorityFee(priorityFee)) {
    return { valid: false, error: "Invalid priority fee" };
  }

  if (!priority || !isValidPriority(priority)) {
    return { valid: false, error: "Invalid priority" };
  }

  if (network && !isValidNetwork(network)) {
    return { valid: false, error: "Invalid network" };
  }

  return { valid: true };
};

module.exports = {
  isValidAddress,
  isValidUsername,
  isValidAmount,
  isValidPriorityFee,
  isValidPriority,
  isValidPrivateKey,
  isValidTokenAddress,
  isValidStakingAddress,
  isValidNetwork,
  isValidAction,
  isValidNonce,
  isValidRecipient,
  isValidRecipients,
  validateTotalAmount,
  validatePaymentParams,
  validateDispersePaymentParams,
  validateStakingParams,
  validatePresaleStakingParams,
};
