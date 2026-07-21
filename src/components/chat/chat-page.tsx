"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  MessageCircleHeart,
  Send,
  Sparkles,
  Target,
  UserRound,
  WifiOff,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useDailyPlan } from "@/hooks/use-daily-plan";
import { useGoals } from "@/hooks/use-goals";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { BrolifeChatContext, ChatHistoryMessage } from "@/lib/chat";
import { askBrolife } from "@/lib/chat-client";
import { getLocalDateKey } from "@/lib/daily-planner";
import { cn } from "@/lib/utils";

type DisplayMessage = ChatHistoryMessage & {
  id: string;
  source?: "openai" | "local";
  fallbackReason?: string | null;
};

const starterPrompts = [
  "What should I focus on next?",
  "How am I doing today?",
  "Which goal needs attention?",
  "What tasks are still unfinished?",
];

function makeMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatPage() {
  const profile = useOnboardingProfile();
  const { goals, hasStoredGoals } = useGoals();
  const plan = useDailyPlan();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey, I’m here with your goals and today’s plan. Ask me what matters next, what’s unfinished, or how to regain momentum.",
    },
  ]);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const context = useMemo<BrolifeChatContext>(() => {
    const contextGoals = hasStoredGoals
      ? goals
      : (profile?.goals ?? []).map((title) => ({
          title,
          deadline: null,
          priority: "medium" as const,
          completed: false,
          tasks: [],
        }));

    return {
      userName: profile?.name ?? "",
      goals: contextGoals.slice(0, 20).map((goal) => ({
        title: goal.title.slice(0, 160),
        priority: goal.priority,
        deadline: goal.deadline,
        completed: goal.completed,
        tasks: goal.tasks.slice(0, 30).map((task) => ({
          title: task.title.slice(0, 160),
          completed: task.completed,
        })),
      })),
      today: plan?.date === getLocalDateKey()
        ? {
            date: plan.date,
            blocks: plan.blocks.slice(0, 50).map((block) => ({
              title: block.title.slice(0, 160),
              description: block.description.slice(0, 240),
              startMinutes: block.startMinutes,
              endMinutes: block.endMinutes,
              completed: block.completed,
              kind: block.kind,
            })),
          }
        : null,
    };
  }, [goals, hasStoredGoals, plan, profile]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isSending, messages]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const question = message.trim();
    if (question.length < 2 || isSending) {
      if (question.length < 2) setError("Ask Brolife a quick question first.");
      return;
    }

    const history = messages
      .filter((item) => item.id !== "welcome")
      .map(({ role, content }) => ({ role, content }));
    setMessages((current) => [
      ...current,
      { id: makeMessageId(), role: "user", content: question },
    ]);
    setMessage("");
    setError("");
    setIsSending(true);

    const reply = await askBrolife({
      message: question,
      context,
      history,
    });
    setMessages((current) => [
      ...current,
      {
        id: makeMessageId(),
        role: "assistant",
        content: reply.answer,
        source: reply.source,
        fallbackReason: reply.fallbackReason,
      },
    ]);
    setIsSending(false);
  }

  const activeGoals = context.goals.filter((goal) => !goal.completed).length;
  const remainingTasks = context.goals.reduce(
    (count, goal) =>
      count + goal.tasks.filter((task) => !task.completed).length,
    0,
  );
  const remainingBlocks =
    context.today?.blocks.filter((block) => !block.completed).length ?? 0;

  return (
    <main className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto grid max-w-[1280px] gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="min-h-[calc(100vh-8.5rem)] gap-0 overflow-hidden border-0 py-0 shadow-none ring-1 ring-foreground/8">
          <div className="flex items-center gap-3 border-b bg-gradient-to-r from-emerald-50/80 via-background to-violet-50/60 px-4 py-4 sm:px-6">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-950 text-white shadow-sm">
              <MessageCircleHeart className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-semibold tracking-tight">Brolife assistant</h1>
                <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-800">
                  <span className="mr-1 size-1.5 rounded-full bg-emerald-500" />
                  Your context is ready
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                Short, supportive answers grounded in your real plan.
              </p>
            </div>
          </div>

          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div
              role="log"
              aria-live="polite"
              className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8"
            >
              {messages.map((item) => {
                const assistant = item.role === "assistant";
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3",
                      !assistant && "flex-row-reverse",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-xl",
                        assistant
                          ? "bg-emerald-950 text-white"
                          : "bg-violet-100 text-violet-700",
                      )}
                    >
                      {assistant ? (
                        <Bot className="size-4" />
                      ) : (
                        <UserRound className="size-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[72%]",
                        assistant
                          ? "rounded-tl-md bg-muted/70 text-foreground"
                          : "rounded-tr-md bg-emerald-700 text-white",
                      )}
                    >
                      <p className="whitespace-pre-wrap">{item.content}</p>
                      {assistant && item.source ? (
                        <div
                          title={item.fallbackReason ?? undefined}
                          className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {item.source === "openai" ? (
                            <Sparkles className="size-3 text-violet-600" />
                          ) : (
                            <WifiOff className="size-3 text-amber-600" />
                          )}
                          {item.source === "openai"
                            ? "AI response"
                            : "Local fallback"}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {isSending ? (
                <div className="flex items-start gap-3">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-950 text-white">
                    <Bot className="size-4" />
                  </div>
                  <div className="flex h-11 items-center gap-1 rounded-2xl rounded-tl-md bg-muted/70 px-4">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="size-1.5 animate-pulse rounded-full bg-emerald-700"
                        style={{ animationDelay: `${dot * 140}ms` }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
              <div ref={endOfMessagesRef} />
            </div>

            <div className="border-t bg-background px-4 py-4 sm:px-6">
              {messages.length === 1 ? (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        setMessage(prompt);
                        setError("");
                      }}
                      className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-emerald-50 hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) : null}
              <form onSubmit={sendMessage}>
                <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100">
                  <Textarea
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value.slice(0, 1_000));
                      setError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    disabled={isSending}
                    aria-label="Message Brolife"
                    placeholder="Ask about your goals, tasks, or today’s plan…"
                    className="max-h-32 min-h-10 resize-none border-0 bg-transparent px-2 py-2 shadow-none focus-visible:ring-0"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isSending || message.trim().length < 2}
                    aria-label="Send message"
                    className="size-10 shrink-0 rounded-xl shadow-sm shadow-primary/20"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
                <div className="mt-2 flex min-h-4 items-center justify-between gap-3 px-1 text-[11px] text-muted-foreground">
                  <span className={cn(error && "font-medium text-destructive")}>
                    {error || "Enter to send · Shift + Enter for a new line"}
                  </span>
                  <span>{message.length}/1000</span>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="border-0 bg-emerald-950 text-white shadow-lg shadow-emerald-950/10">
            <CardContent className="space-y-4 px-5">
              <div>
                <p className="text-xs font-medium text-emerald-200">
                  What Brolife can see
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  Your current plan
                </p>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-white/10 p-3">
                  <span className="flex items-center gap-2 text-emerald-100/75">
                    <Target className="size-3.5" /> Active goals
                  </span>
                  <strong>{activeGoals}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/10 p-3">
                  <span className="flex items-center gap-2 text-emerald-100/75">
                    <CheckCircle2 className="size-3.5" /> Open tasks
                  </span>
                  <strong>{remainingTasks}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/10 p-3">
                  <span className="flex items-center gap-2 text-emerald-100/75">
                    <CalendarClock className="size-3.5" /> Blocks left
                  </span>
                  <strong>{remainingBlocks}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none ring-1 ring-foreground/8">
            <CardContent className="px-5">
              <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Sparkles className="size-4" />
              </div>
              <p className="text-sm font-semibold">Built for action</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Ask for one next move, a quick progress check, or help choosing
                between competing tasks.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
