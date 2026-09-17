/**
 * Manually credit a deposit whose on-chain transfer succeeded but never got
 * credited to the trading account (e.g. the frontend errored, or the RPC hadn't
 * indexed the tx when the deposit call ran).
 *
 * It re-verifies the transfer on-chain and credits buying power. It is
 * idempotent: the margin_deposits.tx_signature unique constraint prevents a
 * double credit, so re-running on an already-credited tx is a safe no-op error.
 *
 * Usage:
 *   pnpm tsx scripts/credit-deposit.ts <WALLET_ADDRESS> <AMOUNT> <ASSET> <TX_SIGNATURE>
 *
 * Example (recover a stuck 168 USDC deposit):
 *   pnpm tsx scripts/credit-deposit.ts 6TAN...i8E9 168 USDC 5xQ...abc
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (and SOLANA_RPC_URL for
 * verification) in .env.
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { getSupabase } from "../src/db/supabase.js";
import { depositMargin, TradingError } from "../src/services/trading.js";

if (existsSync(".env")) {
  config({ override: true });
}

async function main() {
  const [walletAddress, amountArg, assetArg, txSignature] =
    process.argv.slice(2);

  const asset = (assetArg ?? "").toUpperCase();
  const amount = Number(amountArg);

  if (
    !walletAddress ||
    walletAddress.length < 32 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    (asset !== "AUTO" && asset !== "USDC") ||
    !txSignature
  ) {
    console.error(
      "Usage: pnpm tsx scripts/credit-deposit.ts <WALLET_ADDRESS> <AMOUNT> <AUTO|USDC> <TX_SIGNATURE>",
    );
    process.exit(1);
  }

  const supabase = getSupabase();

  const { data: user, error } = await supabase
    .from("users")
    .select("id")
    .eq("solana_wallet_address", walletAddress)
    .maybeSingle();

  if (error) throw error;
  if (!user) {
    console.error(`No user found for wallet ${walletAddress}.`);
    process.exit(1);
  }

  console.log(
    `Crediting ${amount} ${asset} to user ${user.id} (${walletAddress}) from tx ${txSignature}...`,
  );

  try {
    const result = await depositMargin(
      user.id,
      walletAddress,
      amount,
      asset as "AUTO" | "USDC",
      txSignature,
    );
    console.log("Credited successfully. New account state:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    if (err instanceof TradingError) {
      console.error(`Could not credit: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
