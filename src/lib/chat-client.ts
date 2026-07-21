import {
  BrolifeChatContext,
  ChatHistoryMessage,
  ChatReply,
  createLocalChatReply,
} from "@/lib/chat";

const CHAT_TIMEOUT_MS = 15_000;

function localFallback(
  message: string,
  context: BrolifeChatContext,
): ChatReply {
  return {
    answer: createLocalChatReply(message, context),
    source: "local",
    fallbackReason:
      "OpenAI was unavailable, so Brolife answered from your local plan.",
  };
}

export async function askBrolife({
  message,
  context,
  history,
}: {
  message: string;
  context: BrolifeChatContext;
  history: ChatHistoryMessage[];
}): Promise<ChatReply> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context, history: history.slice(-6) }),
      signal: controller.signal,
    });
    const data: unknown = await response.json();
    if (!response.ok || !data || typeof data !== "object") {
      return localFallback(message, context);
    }

    const reply = data as Partial<ChatReply>;
    if (
      typeof reply.answer !== "string" ||
      !reply.answer.trim() ||
      (reply.source !== "openai" && reply.source !== "local") ||
      (reply.fallbackReason !== null &&
        typeof reply.fallbackReason !== "string")
    ) {
      return localFallback(message, context);
    }

    return {
      answer: reply.answer.trim(),
      source: reply.source,
      fallbackReason: reply.fallbackReason,
    };
  } catch {
    return localFallback(message, context);
  } finally {
    window.clearTimeout(timeout);
  }
}
