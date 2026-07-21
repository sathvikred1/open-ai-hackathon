import {
  interpretDisruptionLocally,
  isReplanInstructions,
  ReplanInterpretation,
} from "@/lib/replanning";

const INTERPRETATION_TIMEOUT_MS = 12_000;

export async function interpretDisruption(
  message: string,
): Promise<ReplanInterpretation> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    INTERPRETATION_TIMEOUT_MS,
  );

  try {
    const response = await fetch("/api/replan/interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
    const data: unknown = await response.json();

    if (!response.ok || !data || typeof data !== "object") {
      throw new Error("Interpretation request failed");
    }

    const result = data as Partial<ReplanInterpretation>;
    if (
      !isReplanInstructions(result.instructions) ||
      (result.source !== "openai" && result.source !== "local") ||
      (result.fallbackReason !== null &&
        typeof result.fallbackReason !== "string")
    ) {
      throw new Error("Interpretation response was invalid");
    }

    return {
      instructions: result.instructions,
      source: result.source,
      fallbackReason: result.fallbackReason,
    };
  } catch {
    return {
      instructions: interpretDisruptionLocally(message),
      source: "local",
      fallbackReason:
        "OpenAI interpretation was unavailable, so Brolife used its local parser.",
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
