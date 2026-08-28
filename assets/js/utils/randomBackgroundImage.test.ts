import { afterEach, describe, expect, it, vi } from "vitest";
import { getRandomBackgroundImageNumber } from "./randomBackgroundImage";

describe("getRandomBackgroundImageNumber", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a number between 1 and 5 inclusive", () => {
    for (let i = 0; i < 50; i++) {
      const value = getRandomBackgroundImageNumber();
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(5);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it("returns 1 when Math.random resolves to 0", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(getRandomBackgroundImageNumber()).toBe(1);
  });

  it("returns 5 when Math.random resolves just below 1", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    expect(getRandomBackgroundImageNumber()).toBe(5);
  });
});
