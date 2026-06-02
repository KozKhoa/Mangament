import { describe, it, expect } from "vitest";
import { randomInt } from "../../src/utils/Number.js";

describe("Number Utilities", () => {
  describe("randomInt", () => {
    it("should return a number within the specified range", () => {
      const min = 1;
      const max = 10;
      for (let i = 0; i < 100; i++) {
        const result = randomInt(min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
      }
    });

    it("should handle min equal to max", () => {
      const result = randomInt(5, 5);
      expect(result).toBe(5);
    });
  });
});
