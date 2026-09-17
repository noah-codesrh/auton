import { assertNoError, getSupabase } from "../db/supabase.js";
import { generateApiKey } from "../utils/apiKeys.js";
import { toBigInt } from "../db/types.js";

export async function getDashboardStats(userId: string) {
  const supabase = getSupabase();

  const [apiKeysResult, balancesResult, stakingResult] = await Promise.all([
    supabase
      .from("api_keys")
      .select("id, name, key_prefix, active, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("compute_balances")
      .select("*")
      .eq("user_id", userId)
      .order("expiry_date", { ascending: true }),
    supabase.from("staking_ledger").select("*").eq("user_id", userId),
  ]);

  assertNoError(apiKeysResult.error);
  assertNoError(balancesResult.error);
  assertNoError(stakingResult.error);

  const stakingTotals = stakingResult.data ?? [];

  const claimableUsdcYield = stakingTotals
    .reduce((sum, entry) => sum + Number(entry.claimable_usdc_yield), 0)
    .toFixed(6);

  const totalStakedAuto = stakingTotals
    .reduce((sum, entry) => sum + toBigInt(entry.amount_staked_auto), 0n)
    .toString();

  return {
    apiKeys: apiKeysResult.data ?? [],
    computeBalances: (balancesResult.data ?? []).map((balance) => ({
      id: balance.id,
      modelTier: balance.model_tier,
      tokenBalanceRemaining: toBigInt(balance.token_balance_remaining).toString(),
      expiryDate: balance.expiry_date,
      isExpired: new Date(balance.expiry_date) < new Date(),
    })),
    staking: {
      totalStakedAuto,
      claimableUsdcYield,
      stakeCount: stakingTotals.length,
    },
  };
}

export async function createApiKey(userId: string, name: string) {
  const supabase = getSupabase();
  const { plainKey, hash, prefix } = generateApiKey();

  const { data: apiKey, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: userId,
      name,
      api_key_hash: hash,
      key_prefix: prefix,
      active: true,
    })
    .select("id, name, key_prefix, active, created_at")
    .single();

  assertNoError(error);

  return {
    apiKey,
    plainKey,
  };
}
