import { assertNoError, getSupabase } from "../db/supabase.js";
import { signToken } from "../utils/jwt.js";
import { verifyEvmSignature } from "../utils/evm-auth.js";
import {
  findSolanaWalletOnPrivyUser,
  getPrivyClient,
  isPrivyConfigured,
} from "./privy.js";

async function upsertUserByWallet(
  walletAddress: string,
  privyUserId?: string,
) {
  const supabase = getSupabase();

  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("*")
    .eq("solana_wallet_address", walletAddress)
    .maybeSingle();

  assertNoError(lookupError);

  if (existing) {
    if (privyUserId && existing.privy_user_id !== privyUserId) {
      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update({ privy_user_id: privyUserId })
        .eq("id", existing.id)
        .select()
        .single();

      assertNoError(updateError);
      return updated ?? existing;
    }

    return existing;
  }

  const { data: created, error: insertError } = await supabase
    .from("users")
    .insert({
      solana_wallet_address: walletAddress,
      ...(privyUserId ? { privy_user_id: privyUserId } : {}),
    })
    .select()
    .single();

  assertNoError(insertError);

  if (!created) {
    throw new AuthError("Failed to create user");
  }

  return created;
}

function issueSession(user: {
  id: string;
  solana_wallet_address: string;
  created_at?: string;
}) {
  const token = signToken(user.id, user.solana_wallet_address);

  return {
    token,
    user: {
      id: user.id,
      walletAddress: user.solana_wallet_address,
      createdAt: user.created_at ?? new Date().toISOString(),
    },
  };
}

export async function loginWithWallet(
  walletAddress: string,
  message: string,
  signature: string,
) {
  const isValid = await verifyEvmSignature(walletAddress, message, signature);

  if (!isValid) {
    throw new AuthError("Invalid wallet signature");
  }

  const user = await upsertUserByWallet(walletAddress);
  return issueSession(user);
}

export async function loginWithPrivy(
  accessToken: string,
  walletAddress: string,
) {
  if (!isPrivyConfigured()) {
    throw new AuthError(
      "Privy is not configured on the server (PRIVY_APP_ID / PRIVY_APP_SECRET)",
    );
  }

  const privy = getPrivyClient();

  let privyUserId: string;

  try {
    const claims = await privy.verifyAuthToken(accessToken);
    privyUserId = claims.userId;
  } catch {
    throw new AuthError("Invalid or expired Privy session");
  }

  const privyUser = await privy.getUserById(privyUserId);

  if (
    !findSolanaWalletOnPrivyUser(
      privyUser.linkedAccounts as Array<{
        type: string;
        chainType?: string;
        address?: string;
      }>,
      walletAddress,
    )
  ) {
    throw new AuthError("Wallet is not linked to this Privy account");
  }

  const user = await upsertUserByWallet(walletAddress, privyUserId);
  return issueSession(user);
}

export class AuthError extends Error {
  statusCode = 401;

  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
