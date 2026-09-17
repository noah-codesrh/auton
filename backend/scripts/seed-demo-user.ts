/**
 * Seed Supabase with real dashboard data for a wallet address.
 *
 * Usage:
 *   pnpm seed -- <SOLANA_WALLET_ADDRESS>
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { generateApiKey } from "../src/utils/apiKeys.js";

if (existsSync(".env")) {
  config();
}

const walletAddress = process.argv[2];

if (!walletAddress || walletAddress.length < 32) {
  console.error("Usage: pnpm seed -- <SOLANA_WALLET_ADDRESS>");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("solana_wallet_address", walletAddress)
    .maybeSingle();

  let userId = existingUser?.id;

  if (!userId) {
    const { data: created, error } = await supabase
      .from("users")
      .insert({ solana_wallet_address: walletAddress })
      .select("id")
      .single();

    if (error || !created) {
      throw error ?? new Error("Failed to create user");
    }

    userId = created.id;
    console.log("Created user:", userId);
  } else {
    console.log("Using existing user:", userId);
  }

  const { count: keyCount } = await supabase
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((keyCount ?? 0) === 0) {
    const { plainKey, hash, prefix } = generateApiKey();
    const { error } = await supabase.from("api_keys").insert({
      user_id: userId,
      name: "demo-agent",
      api_key_hash: hash,
      key_prefix: prefix,
      active: true,
    });

    if (error) throw error;
    console.log("Created API key (save this once):", plainKey);
  } else {
    console.log("API keys already exist — skipped");
  }

  const balances = [
    {
      model_tier: "DEEPSEEK_JULY26",
      token_balance_remaining: 2_500_000,
      expiry_date: "2026-07-31T00:00:00.000Z",
    },
    {
      model_tier: "LLAMA_AUG26",
      token_balance_remaining: 850_000,
      expiry_date: "2026-08-31T00:00:00.000Z",
    },
  ];

  for (const balance of balances) {
    const { error } = await supabase.from("compute_balances").upsert(
      {
        user_id: userId,
        ...balance,
      },
      { onConflict: "user_id,model_tier" },
    );

    if (error) throw error;
    console.log("Upserted compute balance:", balance.model_tier);
  }

  const { count: stakeCount } = await supabase
    .from("staking_ledger")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((stakeCount ?? 0) === 0) {
    const { error } = await supabase.from("staking_ledger").insert({
      user_id: userId,
      amount_staked_auto: 1_250_000,
      vault_tx_signature: `seed_${Date.now()}`,
      claimable_usdc_yield: 47.82,
    });

    if (error) throw error;
    console.log("Created staking ledger entry");
  } else {
    console.log("Staking ledger already exists — skipped");
  }

  console.log("\nDone. Log in with this wallet on the frontend to see real data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
