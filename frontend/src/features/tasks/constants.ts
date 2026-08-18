export const taskStatusValues = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export const taskPriorityValues = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export const taskStatusLabels: Record<(typeof taskStatusValues)[number], string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  DONE: "Done",
};
