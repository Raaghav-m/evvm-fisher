const logger = require("./logger");

// In-memory storage for user sessions
// In production, this should be replaced with a database
const userSessions = new Map();

/**
 * Create a new user session
 */
const createUserSession = (userId) => {
  const session = {
    userId,
    wallet: null,
    network: "ethereum",
    currentOperation: null,
    operationData: {},
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  userSessions.set(userId, session);
  logger.info(`Created session for user ${userId}`);
  return session;
};

/**
 * Get user session
 */
const getUserSession = (userId) => {
  const session = userSessions.get(userId);
  if (session) {
    session.lastActivity = Date.now();
  }
  return session;
};

/**
 * Update user session
 */
const updateUserSession = (userId, updates) => {
  const session = getUserSession(userId);
  if (session) {
    Object.assign(session, updates);
    session.lastActivity = Date.now();
    userSessions.set(userId, session);
    return session;
  }
  return null;
};

/**
 * Clear user session
 */
const clearUserSession = (userId) => {
  userSessions.delete(userId);
  logger.info(`Cleared session for user ${userId}`);
};

/**
 * Set wallet in session
 * Enhanced to handle private key storage securely
 */
const setWallet = (userId, walletData) => {
  const session = getUserSession(userId);
  if (session) {
    session.wallet = {
      address: walletData.address,
      privateKey: walletData.privateKey, // Store temporarily for signing
      connected: true,
      connectedAt: Date.now(),
    };
    session.lastActivity = Date.now();
    userSessions.set(userId, session);
    return session;
  }
  return null;
};

/**
 * Set wallet with private key (for signing operations)
 */
const setWalletWithPrivateKey = (userId, walletData) => {
  const session = getUserSession(userId);
  if (session) {
    session.wallet = {
      address: walletData.address,
      privateKey: walletData.privateKey,
      connected: true,
      connectedAt: Date.now(),
    };
    session.lastActivity = Date.now();
    userSessions.set(userId, session);
    return session;
  }
  return null;
};

/**
 * Clear private key from session (security measure)
 */
const clearPrivateKey = (userId) => {
  const session = getUserSession(userId);
  if (session && session.wallet) {
    session.wallet.privateKey = null;
    session.lastActivity = Date.now();
    userSessions.set(userId, session);
    return session;
  }
  return null;
};

/**
 * Clear wallet from session
 */
const clearWallet = (userId) => {
  const session = getUserSession(userId);
  if (session) {
    session.wallet = null;
    session.lastActivity = Date.now();
    userSessions.set(userId, session);
    return session;
  }
  return null;
};

/**
 * Set current operation
 */
const setCurrentOperation = (userId, operation, data = {}) => {
  const session = getUserSession(userId);
  if (session) {
    session.currentOperation = operation;
    session.operationData = data;
    session.lastActivity = Date.now();
    userSessions.set(userId, session);
    return session;
  }
  return null;
};

/**
 * Clear current operation
 */
const clearCurrentOperation = (userId) => {
  const session = getUserSession(userId);
  if (session) {
    session.currentOperation = null;
    session.operationData = {};
    session.lastActivity = Date.now();
    userSessions.set(userId, session);
    return session;
  }
  return null;
};

/**
 * Update operation data
 */
const updateOperationData = (userId, data) => {
  const session = getUserSession(userId);
  if (session && session.currentOperation) {
    session.operationData = { ...session.operationData, ...data };
    session.lastActivity = Date.now();
    userSessions.set(userId, session);
    return session;
  }
  return null;
};

/**
 * Get operation data
 */
const getOperationData = (userId) => {
  const session = getUserSession(userId);
  return session ? session.operationData : {};
};

/**
 * Set network
 */
const setNetwork = (userId, network) => {
  const session = getUserSession(userId);
  if (session) {
    session.network = network;
    session.lastActivity = Date.now();
    userSessions.set(userId, session);
    return session;
  }
  return null;
};

/**
 * Get all active sessions (for monitoring)
 */
const getAllSessions = () => {
  return Array.from(userSessions.values());
};

/**
 * Clean up old sessions (older than 24 hours)
 */
const cleanupOldSessions = () => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const [userId, session] of userSessions.entries()) {
    if (now - session.lastActivity > maxAge) {
      userSessions.delete(userId);
      logger.info(`Cleaned up old session for user ${userId}`);
    }
  }
};

/**
 * Get session statistics
 */
const getSessionStats = () => {
  const sessions = getAllSessions();
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  return {
    total: sessions.length,
    withWallet: sessions.filter((s) => s.wallet).length,
    activeLastHour: sessions.filter((s) => s.lastActivity > oneHourAgo).length,
    activeLastDay: sessions.filter((s) => s.lastActivity > oneDayAgo).length,
    currentOperations: sessions.filter((s) => s.currentOperation).length,
  };
};

// Clean up old sessions every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);

module.exports = {
  createUserSession,
  getUserSession,
  updateUserSession,
  clearUserSession,
  setWallet,
  setWalletWithPrivateKey,
  clearPrivateKey,
  clearWallet,
  setCurrentOperation,
  clearCurrentOperation,
  updateOperationData,
  getOperationData,
  setNetwork,
  getAllSessions,
  cleanupOldSessions,
  getSessionStats,
};
