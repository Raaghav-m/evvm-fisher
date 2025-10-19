const { validateInput } = require("../src/handlers/errorHandlers");
const {
  hashPreregisteredUsername,
  isValidAddress,
  isValidUsername,
  isValidAmount,
} = require("../src/utils/dataHashing");

describe("EVVM Telegram Bot Tests", () => {
  describe("Input Validation", () => {
    test("should validate Ethereum addresses correctly", () => {
      const validAddress = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";
      const invalidAddress = "0xinvalid";

      expect(validateInput(validAddress, "address").isValid).toBe(true);
      expect(validateInput(invalidAddress, "address").isValid).toBe(false);
    });

    test("should validate usernames correctly", () => {
      const validUsername = "testuser123";
      const invalidUsername = "ab"; // too short

      expect(validateInput(validUsername, "username").isValid).toBe(true);
      expect(validateInput(invalidUsername, "username").isValid).toBe(false);
    });

    test("should validate amounts correctly", () => {
      const validAmount = "1.5";
      const invalidAmount = "-1";

      expect(validateInput(validAmount, "amount").isValid).toBe(true);
      expect(validateInput(invalidAmount, "amount").isValid).toBe(false);
    });
  });

  describe("Data Hashing", () => {
    test("should hash usernames correctly", () => {
      const username = "testuser";
      const hash = hashPreregisteredUsername(username);

      expect(typeof hash).toBe("bigint");
      expect(hash).toBeGreaterThan(0n);
    });

    test("should validate addresses correctly", () => {
      const validAddress = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6";
      const invalidAddress = "invalid";

      expect(isValidAddress(validAddress)).toBe(true);
      expect(isValidAddress(invalidAddress)).toBe(false);
    });

    test("should validate usernames correctly", () => {
      const validUsername = "testuser123";
      const invalidUsername = "ab";

      expect(isValidUsername(validUsername)).toBe(true);
      expect(isValidUsername(invalidUsername)).toBe(false);
    });

    test("should validate amounts correctly", () => {
      const validAmount = "1.5";
      const invalidAmount = "-1";

      expect(isValidAmount(validAmount)).toBe(true);
      expect(isValidAmount(invalidAmount)).toBe(false);
    });
  });
});
