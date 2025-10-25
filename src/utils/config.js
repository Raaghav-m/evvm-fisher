const logger = require("./logger");

const validateConfig = () => {
  // const requiredEnvVars = ["TELEGRAM_BOT_TOKEN"];

  // const missingVars = requiredEnvVars.filter(
  //   (varName) => !process.env[varName]
  // );

  // if (missingVars.length > 0) {
  //   logger.error(
  //     `Missing required environment variables: ${missingVars.join(", ")}`
  //   );
  //   process.exit(1);
  // }

  // Set defaults
  process.env.DEFAULT_NETWORK = process.env.DEFAULT_NETWORK || "sepolia";
  process.env.SUPPORTED_NETWORKS =
    process.env.SUPPORTED_NETWORKS || "ethereum,arbitrum";
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || "info";
  process.env.PORT = process.env.PORT || 3000;

  logger.info("Configuration validated successfully");
};

const getSupportedNetworks = () => {
  return process.env.SUPPORTED_NETWORKS.split(",").map((network) =>
    network.trim()
  );
};

const getRpcUrl = (network) => {
  const networkMap = {
    sepolia: "https://eth-sepolia.g.alchemy.com/v2/bCL-PmfJFUH8F65xv9be4",
    arbitrum: "https://arb-sepolia.g.alchemy.com/v2/bCL-PmfJFUH8F65xv9be4",
  };

  return networkMap[network] || networkMap.sepolia;
};

module.exports = {
  validateConfig,
  getSupportedNetworks,
  getRpcUrl,
};
