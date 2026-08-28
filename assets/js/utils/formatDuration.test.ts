import { describe, expect, it } from "vitest";
import { formatDuration } from "./formatDuration";

describe("formatDuration", () => {
  it("pads single-digit minutes and seconds with a leading zero", () => {
    expect(formatDuration(65)).toBe("01:05");
  });

  it("formats zero seconds as 00:00", () => {
    expect(formatDuration(0)).toBe("00:00");
  });

  it("formats exact minutes with 00 seconds", () => {
    expect(formatDuration(120)).toBe("02:00");
  });

  it("does not pad minutes beyond two digits", () => {
    expect(formatDuration(6005)).toBe("100:05");
  });

  it("formats durations under a minute using only seconds", () => {
    expect(formatDuration(45)).toBe("00:45");
  });
});
