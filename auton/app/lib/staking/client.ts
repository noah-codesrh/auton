import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import {
  type IInteractExt,
  SolanaStakingClient,
} from "@streamflow/staking";
import { autoStakingConfig } from "../../config/auto-staking";

let client: SolanaStakingClient | null = null;

export function getStakingClient() {
  if (!client) {
    client = new SolanaStakingClient({
      clusterUrl: autoStakingConfig.rpcUrl,
    });
  }

  return client;
}

export function resetStakingClient() {
  client = null;
}

export async function fetchStakePool() {
  if (!autoStakingConfig.stakePool) {
    return null;
  }

  const stakingClient = getStakingClient();
  return stakingClient.getStakePool(autoStakingConfig.stakePool);
}

export async function fetchUserStakeEntries(owner: string) {
  if (!autoStakingConfig.stakePool) {
    return [];
  }

  const stakingClient = getStakingClient();
  return stakingClient.searchStakeEntries({
    stakePool: autoStakingConfig.stakePool,
    authority: new PublicKey(owner),
  });
}

export async function stakeTokens(
  params: { amount: BN; duration: BN; nonce: number },
  ext: IInteractExt,
) {
  const stakingClient = getStakingClient();
  return stakingClient.stake(
    {
      stakePool: autoStakingConfig.stakePool,
      stakePoolMint: autoStakingConfig.tokenMint,
      amount: params.amount,
      duration: params.duration,
      nonce: params.nonce,
    },
    ext,
  );
}

export async function unstakeTokens(
  params: { nonce: number },
  ext: IInteractExt,
) {
  const stakingClient = getStakingClient();
  return stakingClient.unstake(
    {
      stakePool: autoStakingConfig.stakePool,
      stakePoolMint: autoStakingConfig.tokenMint,
      nonce: params.nonce,
    },
    ext,
  );
}

export async function claimRewards(
  params: { rewardPoolNonce: number; depositNonce: number },
  ext: IInteractExt,
) {
  const stakingClient = getStakingClient();
  return stakingClient.claimRewards(
    {
      stakePool: autoStakingConfig.stakePool,
      stakePoolMint: autoStakingConfig.tokenMint,
      rewardMint: autoStakingConfig.rewardMint,
      rewardPoolNonce: params.rewardPoolNonce,
      depositNonce: params.depositNonce,
    },
    ext,
  );
}
