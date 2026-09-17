import OpenAI from "openai";
import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { OPENROUTER_HEADERS } from "../config/models.js";
import { fetchOpenRouterModels } from "./openrouter.js";
import { chargeChatUsage, getCreditBalance } from "./credits.js";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: env.OPENROUTER_API_KEY,
  defaultHeaders: OPENROUTER_HEADERS,
});

export class ChatError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ChatError";
    this.statusCode = statusCode;
  }
}

type ModelPrice = { prompt: number; completion: number };

/** OpenRouter spot USD-per-token for a model, or throw if it can't be charged. */
async function resolveModelPrice(model: string): Promise<ModelPrice> {
  const map = await fetchOpenRouterModels();
  const live = map.get(model) ?? map.get(model.toLowerCase());

  if (!live) {
    throw new ChatError(`Model "${model}" is not available on Auton.`, 400);
  }

  if (live.pricing?.prompt === "-1" || live.pricing?.completion === "-1") {
    throw new ChatError(
      `Model "${model}" uses variable pricing and can't be paid for with credits.`,
      400,
    );
  }

  const prompt = Number(live.pricing?.prompt ?? "");
  const completion = Number(live.pricing?.completion ?? "");

  if (!Number.isFinite(prompt) || !Number.isFinite(completion)) {
    throw new ChatError(`Model "${model}" has no usable price.`, 400);
  }

  return { prompt, completion };
}

/** Throws 402 if the user has no spendable credit balance. */
export async function assertChatAllowed(userId: string) {
  const balance = await getCreditBalance(userId);
  if (BigInt(balance.balanceUsdMicro) <= 0n) {
    throw new ChatError(
      "No chat credits remaining. Top up with $AUTO or USDC to continue.",
      402,
    );
  }
  return balance;
}

export async function handleChatCompletion(
  req: Request,
  res: Response,
  ctx: { userId: string },
) {
  const body = req.body as Record<string, unknown>;
  const model = String(body.model ?? "");

  if (!model) {
    throw new ChatError("Missing required field: model", 400);
  }

  await assertChatAllowed(ctx.userId);
  const price = await resolveModelPrice(model);

  const stream = Boolean(body.stream);

  if (stream) {
    return handleStreaming(req, res, { ...ctx, model, price });
  }

  const completion = await openrouter.chat.completions.create(
    body as unknown as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  );

  const promptTokens = completion.usage?.prompt_tokens ?? 0;
  const completionTokens = completion.usage?.completion_tokens ?? 0;

  const charge = await chargeChatUsage({
    userId: ctx.userId,
    model,
    promptTokens,
    completionTokens,
    promptPrice: price.prompt,
    completionPrice: price.completion,
  });

  res.json({ ...completion, auton: charge });
}

async function handleStreaming(
  req: Request,
  res: Response,
  ctx: { userId: string; model: string; price: ModelPrice },
) {
  const stream = await openrouter.chat.completions.create({
    ...(req.body as OpenAI.Chat.ChatCompletionCreateParams),
    stream: true,
    stream_options: { include_usage: true },
  });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let promptTokens = 0;
  let completionTokens = 0;

  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);

    const usage = (
      chunk as {
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      }
    ).usage;
    if (usage) {
      promptTokens = usage.prompt_tokens ?? promptTokens;
      completionTokens = usage.completion_tokens ?? completionTokens;
    }
  }

  const charge = await chargeChatUsage({
    userId: ctx.userId,
    model: ctx.model,
    promptTokens,
    completionTokens,
    promptPrice: ctx.price.prompt,
    completionPrice: ctx.price.completion,
  });

  // Custom trailer so the client can update the balance without a refetch.
  res.write(`data: ${JSON.stringify({ auton: charge })}\n\n`);
  res.write("data: [DONE]\n\n");
  res.end();
}
