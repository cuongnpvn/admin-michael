import {
  MAX_TUTOR_HISTORY_MESSAGES,
  MAX_TUTOR_MESSAGE_LENGTH,
  MAX_TUTOR_QA_ROUNDS,
  type TutorChatMessage,
} from "@/lib/lectures/tutor/types";

export function clipTutorHistory<T>(items: T[]): T[] {
  if (items.length <= MAX_TUTOR_HISTORY_MESSAGES) return items;
  return items.slice(-MAX_TUTOR_HISTORY_MESSAGES);
}

export function sanitizeTutorHistory(raw: unknown): TutorChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const messages: TutorChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { role?: unknown; text?: unknown };
    const role = row.role === "user" || row.role === "assistant" ? row.role : null;
    const text = typeof row.text === "string" ? row.text.trim() : "";
    if (!role || !text) continue;
    messages.push({
      role,
      text: text.slice(0, MAX_TUTOR_MESSAGE_LENGTH),
    });
  }
  return messages;
}

export function tutorTurnsToHistory(
  turns: Array<
    | { role: "user"; text: string }
    | { role: "assistant"; result: { answerMarkdown: string } }
  >,
): TutorChatMessage[] {
  return turns.map((turn) =>
    turn.role === "user"
      ? { role: "user", text: turn.text }
      : { role: "assistant", text: turn.result.answerMarkdown },
  );
}

export function countSanitizedTutorUserMessages(history: unknown): number {
  return sanitizeTutorHistory(history).filter(
    (message) => message.role === "user",
  ).length;
}

export function isTutorQaRoundCapReached(history: unknown): boolean {
  return countSanitizedTutorUserMessages(history) >= MAX_TUTOR_QA_ROUNDS;
}

export function isTutorAssistantRoundCapReached(
  turns: Array<{ role: "user" | "assistant" }>,
): boolean {
  return (
    turns.filter((turn) => turn.role === "assistant").length >=
    MAX_TUTOR_QA_ROUNDS
  );
}

export function tutorConversationWindow(
  history: unknown,
  message: string,
): { prior: TutorChatMessage[]; question: string } {
  const current: TutorChatMessage = { role: "user", text: message };
  const conversation = clipTutorHistory<TutorChatMessage>([
    ...sanitizeTutorHistory(history),
    current,
  ]);
  const last = conversation.at(-1);
  return {
    prior: conversation.slice(0, -1),
    question: last?.role === "user" ? last.text : message,
  };
}
