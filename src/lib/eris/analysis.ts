/** Pure presentation helpers for ERIS prediction results. No business rules; display-only rounding. */
import type { AiModelOutput, AiSnapshot } from "./api";

export const FEATURE_LABELS: Record<string, string> = {
  Department: "Phòng ban",
  Gender: "Giới tính",
  Age: "Tuổi",
  Hire_Date: "Ngày vào làm",
  Years_At_Company: "Số năm làm việc",
  Education_Level: "Trình độ học vấn",
  Monthly_Salary: "Lương tháng",
  Work_Hours_Per_Week: "Giờ làm việc mỗi tuần",
  Overtime_Hours: "Giờ tăng ca từ đầu năm",
  Sick_Days: "Số ngày nghỉ/vắng từ đầu năm",
  Promotions: "Số lần thăng chức",
  Employee_Satisfaction_Score: "Điểm hài lòng",
};
export const FEATURE_UNITS: Record<string, string> = {
  Age: "năm",
  Years_At_Company: "năm",
  Monthly_Salary: "USD/tháng",
  Work_Hours_Per_Week: "giờ/tuần",
  Overtime_Hours: "giờ",
  Sick_Days: "ngày",
  Promotions: "lần",
  Employee_Satisfaction_Score: "thang 1–5",
  Hire_Date: "ngày",
};
/** Enum choices accepted by the backend for supplemental inputs (ai.features.js). */
export const FEATURE_CHOICES: Record<string, string[]> = {
  Department: [
    "Customer Support",
    "Engineering",
    "Finance",
    "HR",
    "IT",
    "Legal",
    "Marketing",
    "Operations",
    "Sales",
  ],
  Gender: ["Male", "Female", "Other"],
  Education_Level: ["High School", "Bachelor", "Master", "PhD"],
};
/** Backend tolerance for base_value + Σ contributions = score (ai.client.js). */
export const ADDITIVITY_TOLERANCE = 1e-8;

export const featureLabel = (key: string) => FEATURE_LABELS[key] || key;

export function toPoints(probability: number) {
  return probability * 100;
}

export function formatPercent(probability: number) {
  return `${toPoints(probability).toFixed(2)}%`;
}

/** Signed percentage points; tiny non-zero values keep their sign as <0.01. */
export function formatSignedPoints(raw: number) {
  const pts = toPoints(raw);
  if (pts === 0) return "0.00";
  if (Math.abs(pts) < 0.005) return pts > 0 ? "+<0.01" : "−<0.01";
  return `${pts > 0 ? "+" : "−"}${Math.abs(pts).toFixed(2)}`;
}

export type Contribution = {
  key: string;
  raw: number;
  direction: "increase" | "decrease" | "neutral";
};

export function sortedContributions(contributions: Record<string, number>): Contribution[] {
  return Object.entries(contributions)
    .map(
      ([key, raw]) =>
        ({
          key,
          raw,
          direction: raw > 0 ? "increase" : raw < 0 ? "decrease" : "neutral",
        }) as Contribution,
    )
    .sort((a, b) => Math.abs(b.raw) - Math.abs(a.raw) || a.key.localeCompare(b.key));
}

export function topFactors(contributions: Record<string, number>, n = 3) {
  const all = sortedContributions(contributions);
  return {
    increase: all.filter((c) => c.raw > 0).slice(0, n),
    decrease: all.filter((c) => c.raw < 0).slice(0, n),
  };
}

export function additivityCheck(
  model: Pick<AiModelOutput, "score" | "base_value" | "contributions">,
) {
  if (typeof model.base_value !== "number") return { checked: false as const };
  const sum = Object.values(model.contributions).reduce((s, v) => s + v, 0);
  const error = Math.abs(model.base_value + sum - model.score);
  return { checked: true as const, ok: error <= ADDITIVITY_TOLERANCE, error };
}

export function isDemoModel(model: Pick<AiModelOutput, "demo_mode" | "validation_status">) {
  return model.demo_mode === true || model.validation_status === "NO_QUALIFIED_MEXWELL_MODEL";
}

/** Frontend fallback only. A backend risk level always takes precedence over these display thresholds. */
export const PREDICTION_RISK_CONFIG = {
  mediumMin: 0.3,
  highMin: 0.7,
} as const;

export type PredictionRiskLevel = "low" | "medium" | "high" | "unknown";

export function getPredictionRisk(
  model: Pick<AiModelOutput, "score" | "riskLevel" | "risk_level">,
): {
  level: PredictionRiskLevel;
  label: string;
  source: "backend" | "frontend-fallback";
  colorClass: string;
  surfaceClass: string;
} {
  const backendValue = model.riskLevel ?? model.risk_level;
  const normalized = backendValue
    ?.trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const backendLevels: Record<string, Exclude<PredictionRiskLevel, "unknown">> = {
    low: "low",
    low_risk: "low",
    thap: "low",
    thấp: "low",
    medium: "medium",
    medium_risk: "medium",
    trung_binh: "medium",
    trung_bình: "medium",
    high: "high",
    high_risk: "high",
    cao: "high",
  };
  const level =
    (normalized ? backendLevels[normalized] : undefined) ??
    (backendValue?.trim()
      ? "unknown"
      : model.score >= PREDICTION_RISK_CONFIG.highMin
        ? "high"
        : model.score >= PREDICTION_RISK_CONFIG.mediumMin
          ? "medium"
          : "low");
  const presentation = {
    low: { label: "Thấp", colorClass: "text-success", surfaceClass: "bg-mint text-success" },
    medium: {
      label: "Trung bình",
      colorClass: "text-warning",
      surfaceClass: "bg-warning-surface text-warning",
    },
    high: {
      label: "Cao",
      colorClass: "text-destructive",
      surfaceClass: "bg-error-surface text-destructive",
    },
    unknown: {
      label: backendValue?.trim() || "—",
      colorClass: "text-muted-foreground",
      surfaceClass: "bg-muted text-muted-foreground",
    },
  }[level];
  return { level, ...presentation, source: backendValue?.trim() ? "backend" : "frontend-fallback" };
}

export function provenanceLabel(source?: string) {
  if (!source) return "—";
  if (source.startsWith("MANUAL_DEMO")) return `Bổ sung thủ công (${source})`;
  return source;
}

export function formatFeatureValue(snapshot: AiSnapshot | undefined, key: string) {
  const value = snapshot?.features?.[key];
  if (value === undefined || value === null) return "—";
  return String(value);
}

/** Date-only strings are shown as-is to avoid timezone shifting. */
export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split("-").reverse().join("/");
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}
