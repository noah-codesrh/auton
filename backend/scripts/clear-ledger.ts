import { getSupabase } from "../src/db/supabase.js";

type Wipe = {
  table: string;
  column: string;
};

const WIPES: Wipe[] = [
  { table: "usage_logs", column: "timestamp" },
  { table: "credit_usage_logs", column: "created_at" },
  { table: "credit_purchases", column: "created_at" },
  { table: "credit_balances", column: "updated_at" },
  { table: "option_positions", column: "opened_at" },
  { table: "positions", column: "created_at" },
  { table: "margin_deposits", column: "created_at" },
  { table: "margin_withdrawals", column: "created_at" },
  { table: "margin_accounts", column: "updated_at" },
  { table: "marketplace_purchases", column: "created_at" },
  { table: "compute_balances", column: "expiry_date" },
  { table: "claim_requests", column: "created_at" },
  { table: "staking_ledger", column: "stake_timestamp" },
  { table: "api_keys", column: "created_at" },
  { table: "provider_nodes", column: "created_at" },
  { table: "users", column: "created_at" },
  { table: "market_state", column: "updated_at" },
  { table: "engine_locks", column: "expires_at" },
];

async function main() {
  const supabase = getSupabase();

  for (const { table, column } of WIPES) {
    const { error } = await supabase
      .from(table)
      .delete()
      .gte(column, "1970-01-01T00:00:00Z");

    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`cleared ${table}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
