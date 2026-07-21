export type ChatGoal = {
  title: string;
  priority: "low" | "medium" | "high";
  deadline: string | null;
  completed: boolean;
  tasks: Array<{ title: string; completed: boolean }>;
};

export type ChatScheduleBlock = {
  title: string;
  description: string;
  startMinutes: number;
  endMinutes: number;
  completed: boolean;
  kind: "task" | "routine" | "meal";
};

export type BrolifeChatContext = {
  userName: string;
  goals: ChatGoal[];
  today: {
    date: string;
    blocks: ChatScheduleBlock[];
  } | null;
};

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatReply = {
  answer: string;
  source: "openai" | "local";
  fallbackReason: string | null;
};

export function limitChatAnswer(answer: string, maxWords = 75) {
  const words = answer.trim().split(/\s+/);
  return words.length <= maxWords
    ? answer.trim()
    : `${words.slice(0, maxWords).join(" ")}…`;
}

function formatTime(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const displayMinutes = String(normalized % 60).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${displayMinutes} ${period}`;
}

function getActiveGoals(context: BrolifeChatContext) {
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return context.goals
    .filter((goal) => !goal.completed)
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
}

export function createLocalChatReply(
  message: string,
  context: BrolifeChatContext,
) {
  const question = message.toLowerCase();
  const activeGoals = getActiveGoals(context);
  const unfinishedTasks = activeGoals.flatMap((goal) =>
    goal.tasks
      .filter((task) => !task.completed)
      .map((task) => ({ ...task, goalTitle: goal.title })),
  );
  const remainingBlocks =
    context.today?.blocks.filter((block) => !block.completed) ?? [];
  const nextBlock = remainingBlocks[0];
  const name = context.userName.trim() || "friend";

  if (/\b(goal|priority|prioritize)\b/.test(question)) {
    const goal = activeGoals[0];
    if (!goal) {
      return `You’re clear on active goals, ${name}. Add one meaningful goal, then give it a small first task you can finish today.`;
    }
    const nextTask = goal.tasks.find((task) => !task.completed);
    return nextTask
      ? `Your strongest priority is “${goal.title}.” Start with “${nextTask.title}” and keep the first session small enough to finish.`
      : `Your strongest priority is “${goal.title}.” Add one concrete next task so you can turn that goal into action today.`;
  }

  if (/\b(schedule|today|next|plan|time)\b/.test(question)) {
    if (!nextBlock) {
      return `Your schedule is clear, ${name}. Use the space to recover or choose one small task from your highest-priority goal.`;
    }
    return `Next up is “${nextBlock.title}” at ${formatTime(nextBlock.startMinutes)}. Focus only on that block; you can reassess the rest afterward.`;
  }

  if (/\b(task|todo|to-do)\b/.test(question)) {
    const task = unfinishedTasks[0];
    if (!task) {
      return `You have no unfinished goal tasks right now, ${name}. Add one clear next action to the goal that matters most.`;
    }
    return `You have ${unfinishedTasks.length} unfinished ${unfinishedTasks.length === 1 ? "task" : "tasks"}. Start with “${task.title}” for “${task.goalTitle}.”`;
  }

  if (/\b(progress|done|completed|finish)\b/.test(question)) {
    const completedGoals = context.goals.filter((goal) => goal.completed).length;
    const completedBlocks = context.today?.blocks.filter(
      (block) => block.completed,
    ).length ?? 0;
    const totalBlocks = context.today?.blocks.length ?? 0;
    return `You’ve completed ${completedGoals} of ${context.goals.length} goals and ${completedBlocks} of ${totalBlocks} scheduled blocks today. Keep momentum with one small next action.`;
  }

  if (nextBlock) {
    return `I’m with you, ${name}. Your best next move is “${nextBlock.title}” at ${formatTime(nextBlock.startMinutes)}. Finish that block before deciding what comes after.`;
  }

  const goal = activeGoals[0];
  return goal
    ? `I’m with you, ${name}. Make one small, concrete move on “${goal.title}” next.`
    : `I’m with you, ${name}. Pick one useful thing you can finish in the next 25 minutes and start there.`;
}
