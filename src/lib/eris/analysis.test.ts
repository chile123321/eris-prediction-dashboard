import { describe, expect, it } from "vitest";
import {
  additivityCheck,
  formatPercent,
  formatSignedPoints,
  getPredictionRisk,
  PREDICTION_RISK_CONFIG,
  sortedContributions,
  topFactors,
} from "./analysis";

describe("prediction display rules", () => {
  it("shows score as 100 × score with two decimals", () => {
    expect(formatPercent(0.159961)).toBe("16.00%");
  });
  it("shows a raw +0.025 contribution as +2.50 percentage points", () => {
    expect(formatSignedPoints(0.025)).toBe("+2.50");
    expect(formatSignedPoints(-0.0001)).toBe("−0.01");
    expect(formatSignedPoints(0.00001)).toBe("+<0.01");
    expect(formatSignedPoints(0)).toBe("0.00");
  });
  it("sorts by absolute contribution and keeps zero contributions", () => {
    const rows = sortedContributions({ A: 0.01, B: -0.03, C: 0 });
    expect(rows.map((r) => r.key)).toEqual(["B", "A", "C"]);
    expect(rows[2]?.direction).toBe("neutral");
  });
  it("returns at most three factors per direction", () => {
    const f = topFactors({ a: 0.1, b: 0.2, c: 0.3, d: 0.4, e: -0.1 });
    expect(f.increase.map((x) => x.key)).toEqual(["d", "c", "b"]);
    expect(f.decrease.map((x) => x.key)).toEqual(["e"]);
  });
  it("flags results where base + Σ SHAP does not equal score", () => {
    expect(
      additivityCheck({ score: 0.3, base_value: 0.2, contributions: { a: 0.1 } }),
    ).toMatchObject({ ok: true });
    expect(
      additivityCheck({ score: 0.3, base_value: 0.2, contributions: { a: 0.2 } }),
    ).toMatchObject({ ok: false });
  });
  it("uses the configured probability thresholds only when backend risk is absent", () => {
    expect(getPredictionRisk({ score: PREDICTION_RISK_CONFIG.mediumMin - 0.01 }).level).toBe("low");
    expect(getPredictionRisk({ score: PREDICTION_RISK_CONFIG.mediumMin }).level).toBe("medium");
    expect(getPredictionRisk({ score: PREDICTION_RISK_CONFIG.highMin }).level).toBe("high");
  });
  it("uses backend risk directly even when it differs from the probability fallback", () => {
    expect(getPredictionRisk({ score: 0.1, riskLevel: "HIGH" })).toMatchObject({
      level: "high",
      label: "Cao",
      source: "backend",
    });
    expect(getPredictionRisk({ score: 0.9, risk_level: "LOW" })).toMatchObject({
      level: "low",
      label: "Thấp",
      source: "backend",
    });
  });
  it("preserves an unrecognized backend risk label instead of reclassifying it", () => {
    expect(getPredictionRisk({ score: 0.9, riskLevel: "REVIEW_REQUIRED" })).toMatchObject({
      level: "unknown",
      label: "REVIEW_REQUIRED",
      source: "backend",
    });
  });
});
