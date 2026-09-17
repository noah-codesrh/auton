import OpenAI from "openai";
import type { Request, Response } from "express";
import { assertNoError, getSupabase } from "../db/supabase.js";
import { toBigInt } from "../db/types.js";
import { OPENROUTER_HEADERS, resolveModelTier } from "../config/models.js";
import { env } from "../config/env.js";
import { hashApiKey } from "../utils/apiKeys.js";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: env.OPENROUTER_API_KEY,
  defaultHeaders: OPENROUTER_HEADERS,
});

export type GatewayContext = {
  userId: string;
  apiKeyId: string;
  modelTier: string;
  balanceId: string;
  currentBalance: bigint;
};

export async function authenticateApiKey(
  bearerToken: string,
): Promise<{ apiKeyId: string; userId: string } | null> {
  const supabase = getSupabase();
  const hash = hashApiKey(bearerToken);

  const { data: apiKey, error } = await supabase
    .from("api_keys")
    .select("id, user_id")
    .eq("api_key_hash", hash)
    .eq("active", true)
    .maybeSingle();

  assertNoError(error);

  if (!apiKey) return null;
  return { apiKeyId: apiKey.id, userId: apiKey.user_id };
}

export async function resolveComputeBalance(
  userId: string,
  model: string,
): Promise<GatewayContext | { error: string; status: number }> {
  const modelTier = resolveModelTier(model);

  if (!modelTier) {
    return {
      error: `Model "${model}" is not mapped to an active compute forward contract tier`,
      status: 400,
    };
  }

  const supabase = getSupabase();

  const { data: balance, error } = await supabase
    .from("compute_balances")
    .select("*")
    .eq("user_id", userId)
    .eq("model_tier", modelTier)
    .maybeSingle();

  assertNoError(error);

  if (!balance) {
    return {
      error: `No forward compute contract found for tier ${modelTier}`,
      status: 402,
    };
  }

  const expiryDate = new Date(balance.expiry_date);
  const tokenBalance = toBigInt(balance.token_balance_remaining);

  if (expiryDate < new Date()) {
    return {
      error: `Forward compute contract ${modelTier} has expired`,
      status: 402,
    };
  }

  if (tokenBalance <= 0n) {
    return {
      error: "Insufficient compute token balance",
      status: 402,
    };
  }

  return {
    userId,
    apiKeyId: "",
    modelTier,
    balanceId: balance.id,
    currentBalance: tokenBalance,
  };
}

export async function proxyToOpenRouter(
  req: Request,
  res: Response,
  context: GatewayContext & { apiKeyId: string },
) {
  const body = req.body as Record<string, unknown>;
  const model = String(body.model ?? "");
  const stream = Boolean(body.stream);

  if (stream) {
    await handleStreamingRequest(req, res, context, model);
    return;
  }

  const completion = await openrouter.chat.completions.create(
    body as unknown as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  );

  const totalTokens = BigInt(completion.usage?.total_tokens ?? 0);

  if (totalTokens > 0n) {
    await deductBalanceAndLog({
      balanceId: context.balanceId,
      userId: context.userId,
      apiKeyId: context.apiKeyId,
      modelUsed: model,
      tokensConsumed: totalTokens,
      currentBalance: context.currentBalance,
    });
  }

  res.json(completion);
}

async function handleStreamingRequest(
  req: Request,
  res: Response,
  context: GatewayContext & { apiKeyId: string },
  model: string,
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

  let totalTokens = 0n;

  for await (const chunk of stream) {
    const serialized = `data: ${JSON.stringify(chunk)}\n\n`;
    res.write(serialized);

    const usage = (chunk as { usage?: { total_tokens?: number } }).usage;
    if (usage?.total_tokens) {
      totalTokens = BigInt(usage.total_tokens);
    }
  }

  res.write("data: [DONE]\n\n");
  res.end();

  if (totalTokens > 0n) {
    await deductBalanceAndLog({
      balanceId: context.balanceId,
      userId: context.userId,
      apiKeyId: context.apiKeyId,
      modelUsed: model,
      tokensConsumed: totalTokens,
      currentBalance: context.currentBalance,
    });
  }
}

async function deductBalanceAndLog(params: {
  balanceId: string;
  userId: string;
  apiKeyId: string;
  modelUsed: string;
  tokensConsumed: bigint;
  currentBalance: bigint;
}) {
  const { balanceId, userId, apiKeyId, modelUsed, tokensConsumed, currentBalance } =
    params;

  if (tokensConsumed > currentBalance) {
    console.warn(
      `User ${userId} consumed ${tokensConsumed} tokens but only had ${currentBalance}`,
    );
  }

  const newBalance =
    currentBalance > tokensConsumed ? currentBalance - tokensConsumed : 0n;

  const supabase = getSupabase();

  const { error: balanceError } = await supabase
    .from("compute_balances")
    .update({ token_balance_remaining: newBalance.toString() })
    .eq("id", balanceId);

  assertNoError(balanceError);

  const { error: logError } = await supabase.from("usage_logs").insert({
    user_id: userId,
    api_key_id: apiKeyId,
    model_used: modelUsed,
    tokens_consumed: tokensConsumed.toString(),
  });

  assertNoError(logError);
}

export function paymentRequired(res: Response, message: string) {
  return res.status(402).json({
    error: {
      message,
      type: "insufficient_compute_balance",
      code: "payment_required",
    },
  });
}
