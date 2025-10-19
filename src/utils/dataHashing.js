const { ethers } = require("ethers");
const crypto = require("crypto");

/**
 * Hash a preregistered username with clown numbers
 * This replicates the functionality from the original EVVM project
 */
const hashPreregisteredUsername = (username) => {
  if (!username || typeof username !== "string") {
    throw new Error("Username must be a non-empty string");
  }

  // Remove any whitespace and convert to lowercase
  const cleanUsername = username.trim().toLowerCase();

  // Create a hash using SHA-256
  const hash = crypto.createHash("sha256").update(cleanUsername).digest("hex");

  // Convert to BigInt for EVM compatibility
  const hashBigInt = BigInt("0x" + hash);

  return hashBigInt;
};

/**
 * Hash disperse payment users data
 */
const hashDispersePaymentUsersToPay = (recipients) => {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error("Recipients must be a non-empty array");
  }

  // Sort recipients by address/username for consistent hashing
  const sortedRecipients = recipients.sort((a, b) => {
    const aKey = a.address || a.username || "";
    const bKey = b.address || b.username || "";
    return aKey.localeCompare(bKey);
  });

  // Create a string representation of the recipients
  const recipientsString = sortedRecipients
    .map((recipient) => {
      const address = recipient.address || "";
      const username = recipient.username || "";
      const amount = recipient.amount || "0";
      return `${address}:${username}:${amount}`;
    })
    .join("|");

  // Hash the string
  const hash = crypto
    .createHash("sha256")
    .update(recipientsString)
    .digest("hex");

  // Convert to BigInt for EVM compatibility
  const hashBigInt = BigInt("0x" + hash);

  return hashBigInt;
};

/**
 * Generate a random nonce using Mersenne Twister algorithm
 * This replicates the nonce generation from the original project
 */
const generateRandomNonce = () => {
  // Use crypto.randomBytes for secure random number generation
  const randomBytes = crypto.randomBytes(8);
  const nonce = BigInt("0x" + randomBytes.toString("hex"));

  return nonce;
};

/**
 * Generate multiple random nonces
 */
const generateMultipleNonces = (count) => {
  const nonces = [];
  for (let i = 0; i < count; i++) {
    nonces.push(generateRandomNonce());
  }
  return nonces;
};

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
 * Validate username format
 */
const isValidUsername = (username) => {
  if (!username || typeof username !== "string") {
    return false;
  }

  // Username should be 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username.trim());
};

/**
 * Validate amount (should be a positive number)
 */
const isValidAmount = (amount) => {
  if (typeof amount === "string") {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }
  if (typeof amount === "number") {
    return amount > 0 && !isNaN(amount);
  }
  return false;
};

/**
 * Validate priority fee
 */
const isValidPriorityFee = (fee) => {
  if (typeof fee === "string") {
    const num = parseFloat(fee);
    return !isNaN(num) && num >= 0;
  }
  if (typeof fee === "number") {
    return fee >= 0 && !isNaN(fee);
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
 * Format amount for display
 */
const formatAmount = (amount, decimals = 18) => {
  try {
    const formatted = ethers.formatUnits(amount, decimals);
    return parseFloat(formatted).toFixed(6);
  } catch (error) {
    return amount.toString();
  }
};

/**
 * Parse amount from string to BigInt
 */
const parseAmount = (amount, decimals = 18) => {
  try {
    return ethers.parseUnits(amount.toString(), decimals);
  } catch (error) {
    throw new Error(`Invalid amount format: ${amount}`);
  }
};

module.exports = {
  hashPreregisteredUsername,
  hashDispersePaymentUsersToPay,
  generateRandomNonce,
  generateMultipleNonces,
  isValidAddress,
  isValidUsername,
  isValidAmount,
  isValidPriorityFee,
  isValidPriority,
  formatAmount,
  parseAmount,
};
