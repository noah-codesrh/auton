import { getBackendUrl, getToken } from "./client";

export type ChatRole = "system" | "user" | "assistant";

export type ChatTextPart = { type: "text"; text: string };
export type ChatImagePart = {
  type: "image_url";
  image_url: { url: string };
};
export type ChatContentPart = ChatTextPart | ChatImagePart;

export type ChatMessage = {
  role: ChatRole;
  content: string | ChatContentPart[];
};

/** Builds OpenRouter-style content: a plain string, or text + image parts. */
export function buildMessageContent(
  text: string,
  imageUrls: string[],
): string | ChatContentPart[] {
  if (imageUrls.length === 0) return text;

  const parts: ChatContentPart[] = [];
  if (text) parts.push({ type: "text", text });
  for (const url of imageUrls) {
    parts.push({ type: "image_url", image_url: { url } });
  }
  return parts;
}

export type ChatUsage = {
  usdChargedMicro: string;
  balanceUsdMicro: string;
};

export type ChatStreamHandlers = {
  onToken: (delta: string) => void;
  onUsage?: (usage: ChatUsage) => void;
  signal?: AbortSignal;
};

type StreamChunk = {
  error?: { message?: string };
  auton?: ChatUsage;
  choices?: { delta?: { content?: string } }[];
};

export async function streamChat(
  model: string,
  messages: ChatMessage[],
  handlers: ChatStreamHandlers,
): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Sign in to chat.");

  const response = await fetch(`${getBackendUrl()}/api/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
    signal: handlers.signal,
  });

  if (!response.ok || !response.body) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(data?.error?.message || `Chat failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.slice("data:".length).trim();
      if (!payload || payload === "[DONE]") {
        if (payload === "[DONE]") return;
        continue;
      }

      let chunk: StreamChunk;
      try {
        chunk = JSON.parse(payload) as StreamChunk;
      } catch {
        continue;
      }

      if (chunk.error?.message) {
        throw new Error(chunk.error.message);
      }
      if (chunk.auton) {
        handlers.onUsage?.(chunk.auton);
        continue;
      }

      const delta = chunk.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta) {
        handlers.onToken(delta);
      }
    }
  }
}
