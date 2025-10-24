// Menu utilities for Telegram bot inline keyboards

/**
 * Create the main menu keyboard
 * Matches the frontend functionality exactly
 */
const createMainMenu = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔗 Connect Wallet", callback_data: "connect_wallet" },
          { text: "⚙️ Settings", callback_data: "settings" },
        ],
        [
          { text: "💸 Payment Signatures", callback_data: "payment_menu" },
          { text: "🏦 Staking Signatures", callback_data: "staking_menu" },
        ],
        [
          { text: "📊 My Wallet Info", callback_data: "wallet_info" },
          { text: "❓ Help", callback_data: "help" },
        ],
      ],
    },
  };
};

/**
 * Create payment menu keyboard
 */
const createPaymentMenu = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "💸 Single Payment", callback_data: "single_payment" },
          { text: "📦 Disperse Payment", callback_data: "disperse_payment" },
        ],
        [{ text: "🔙 Back to Main Menu", callback_data: "main_menu" }],
      ],
    },
  };
};

/**
 * Create staking menu keyboard
 */
const createStakingMenu = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🥇 Golden Staking", callback_data: "golden_staking" },
          { text: "🎯 Presale Staking", callback_data: "presale_staking" },
        ],
        [{ text: "🔙 Back to Main Menu", callback_data: "main_menu" }],
      ],
    },
  };
};

/**
 * Create network selection keyboard
 */
const createNetworkMenu = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔷 Ethereum", callback_data: "network_ethereum" },
          { text: "🔶 Arbitrum", callback_data: "network_arbitrum" },
        ],
        [{ text: "🔙 Back", callback_data: "settings" }],
      ],
    },
  };
};

/**
 * Create priority selection keyboard
 */
const createPriorityMenu = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🐌 Low (Synchronous)", callback_data: "priority_low" },
          { text: "⚡ High (Asynchronous)", callback_data: "priority_high" },
        ],
      ],
    },
  };
};

/**
 * Create action selection keyboard (for staking)
 */
const createActionMenu = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📈 Stake", callback_data: "action_stake" },
          { text: "📉 Unstake", callback_data: "action_unstake" },
        ],
      ],
    },
  };
};

/**
 * Create recipient type selection keyboard
 */
const createRecipientTypeMenu = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "👤 Username", callback_data: "recipient_username" },
          { text: "📍 Address", callback_data: "recipient_address" },
        ],
      ],
    },
  };
};

/**
 * Create confirmation keyboard
 */
const createConfirmationMenu = (confirmData, cancelData) => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "✅ Confirm", callback_data: confirmData },
          { text: "❌ Cancel", callback_data: cancelData },
        ],
      ],
    },
  };
};

/**
 * Create back button keyboard
 */
const createBackMenu = (backData) => {
  return {
    reply_markup: {
      inline_keyboard: [[{ text: "🔙 Back", callback_data: backData }]],
    },
  };
};

/**
 * Create cancel button keyboard
 */
const createCancelMenu = () => {
  return {
    reply_markup: {
      inline_keyboard: [[{ text: "❌ Cancel", callback_data: "main_menu" }]],
    },
  };
};

/**
 * Create numeric keyboard for amount input
 */
const createNumericKeyboard = () => {
  return {
    reply_markup: {
      keyboard: [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        [".", "0", "⌫"],
        ["✅ Done", "❌ Cancel"],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  };
};

/**
 * Create recipient count selection keyboard (for disperse payments)
 */
const createRecipientCountMenu = () => {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "2 Recipients", callback_data: "recipients_2" },
          { text: "3 Recipients", callback_data: "recipients_3" },
        ],
        [
          { text: "4 Recipients", callback_data: "recipients_4" },
          { text: "5 Recipients", callback_data: "recipients_5" },
        ],
        [{ text: "🔙 Back", callback_data: "payment_menu" }],
      ],
    },
  };
};

/**
 * Remove keyboard
 */
const removeKeyboard = () => {
  return {
    reply_markup: {
      remove_keyboard: true,
    },
  };
};

module.exports = {
  createMainMenu,
  createPaymentMenu,
  createStakingMenu,
  createNetworkMenu,
  createPriorityMenu,
  createActionMenu,
  createRecipientTypeMenu,
  createConfirmationMenu,
  createBackMenu,
  createCancelMenu,
  createNumericKeyboard,
  createRecipientCountMenu,
  removeKeyboard,
};
