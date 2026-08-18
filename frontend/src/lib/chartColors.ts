// Central palette for every chart in the app — validated for categorical use
// (chroma floor, CVD ΔE, normal-vision floor) via the dataviz skill's
// validate_palette.js. Reuse these tokens everywhere instead of picking new
// hex values per chart, so status colors mean the same thing across every
// dashboard.

export const TASK_STATUS_COLORS = {
  TODO: "#8b8b96", // neutral — "nothing happening yet", intentionally outside the hued set
  IN_PROGRESS: "#4f46e5",
  REVIEW: "#f59e0b",
  DONE: "#7c3aed",
} as const;

// Fixed status semantics — reserved, never reused as a categorical series color.
export const STATUS_CRITICAL = "#d03b3b";

export const CHART_TEXT = {
  primary: "#15151a",
  secondary: "#3f3f46",
  muted: "#8b8b96",
} as const;
