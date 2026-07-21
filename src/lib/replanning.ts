export type ReplanInstructions = {
  delayMinutes: number;
  availableMinutes: number | null;
  energyLevel: "normal" | "low";
  missedTaskQuery: string | null;
  disruptionKind:
    | "delay"
    | "missed_task"
    | "limited_time"
    | "low_energy"
    | "multiple"
    | "other";
};

export type ReplanInterpretation = {
  instructions: ReplanInstructions;
  source: "openai" | "local";
  fallbackReason: string | null;
};

export const REPLAN_INSTRUCTIONS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    delayMinutes: {
      type: "integer",
      minimum: 0,
      maximum: 1440,
      description:
        "How many minutes late or behind the user is. Use 0 when not stated.",
    },
    availableMinutes: {
      anyOf: [
        { type: "integer", minimum: 0, maximum: 1440 },
        { type: "null" },
      ],
      description:
        "Minutes the user says remain available, or null when no limit is stated.",
    },
    energyLevel: {
      type: "string",
      enum: ["normal", "low"],
      description: "Use low when the user reports fatigue or low energy.",
    },
    missedTaskQuery: {
      anyOf: [{ type: "string", maxLength: 120 }, { type: "null" }],
      description:
        "A concise task or activity phrase the user missed, or null when none is stated.",
    },
    disruptionKind: {
      type: "string",
      enum: [
        "delay",
        "missed_task",
        "limited_time",
        "low_energy",
        "multiple",
        "other",
      ],
      description: "The best overall classification of the disruption.",
    },
  },
  required: [
    "delayMinutes",
    "availableMinutes",
    "energyLevel",
    "missedTaskQuery",
    "disruptionKind",
  ],
} as const;

function extractDuration(report: string) {
  const numericMatch = report.match(
    /(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|minutes?|mins?|min)\b/i,
  );
  if (numericMatch) {
    const amount = Number(numericMatch[1]);
    const unit = numericMatch[2].toLowerCase();
    return Math.round(amount * (unit.startsWith("h") ? 60 : 1));
  }
  if (/\b(?:an|one) hour\b/i.test(report)) return 60;
  if (/\bhalf (?:an )?hour\b/i.test(report)) return 30;
  return null;
}

function extractMissedTask(report: string) {
  const match = report.match(
    /\bmissed\s+(?:my\s+|the\s+)?(.+?)(?:[.!?,]|$)/i,
  );
  return match?.[1]?.trim().slice(0, 120) || null;
}

export function isReplanInstructions(
  value: unknown,
): value is ReplanInstructions {
  if (!value || typeof value !== "object") return false;
  const instructions = value as Partial<ReplanInstructions>;
  const validKinds = [
    "delay",
    "missed_task",
    "limited_time",
    "low_energy",
    "multiple",
    "other",
  ];

  return (
    Number.isInteger(instructions.delayMinutes) &&
    (instructions.delayMinutes ?? -1) >= 0 &&
    (instructions.delayMinutes ?? 1441) <= 1440 &&
    (instructions.availableMinutes === null ||
      (Number.isInteger(instructions.availableMinutes) &&
        (instructions.availableMinutes ?? -1) >= 0 &&
        (instructions.availableMinutes ?? 1441) <= 1440)) &&
    (instructions.energyLevel === "normal" ||
      instructions.energyLevel === "low") &&
    (instructions.missedTaskQuery === null ||
      (typeof instructions.missedTaskQuery === "string" &&
        instructions.missedTaskQuery.length <= 120)) &&
    typeof instructions.disruptionKind === "string" &&
    validKinds.includes(instructions.disruptionKind)
  );
}

export function interpretDisruptionLocally(report: string): ReplanInstructions {
  const normalizedReport = report.trim();
  const duration = extractDuration(normalizedReport);
  const runningLate = /\b(late|behind|delayed|running behind)\b/i.test(
    normalizedReport,
  );
  const limitedTime = /\b(only|just)\b.*\b(left|available|remaining)\b/i.test(
    normalizedReport,
  );
  const lowEnergy = /\b(tired|exhausted|drained|low energy|no energy)\b/i.test(
    normalizedReport,
  );
  const missedTaskQuery = extractMissedTask(normalizedReport);
  const signals = [runningLate, limitedTime, lowEnergy, Boolean(missedTaskQuery)].filter(
    Boolean,
  ).length;

  let disruptionKind: ReplanInstructions["disruptionKind"] = "other";
  if (signals > 1) disruptionKind = "multiple";
  else if (runningLate) disruptionKind = "delay";
  else if (limitedTime) disruptionKind = "limited_time";
  else if (lowEnergy) disruptionKind = "low_energy";
  else if (missedTaskQuery) disruptionKind = "missed_task";

  return {
    delayMinutes: runningLate ? duration ?? 60 : disruptionKind === "other" ? 30 : 0,
    availableMinutes: limitedTime ? duration : null,
    energyLevel: lowEnergy ? "low" : "normal",
    missedTaskQuery,
    disruptionKind,
  };
}
