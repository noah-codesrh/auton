export type UserRow = {
  id: string;
  solana_wallet_address: string;
  privy_user_id: string | null;
  created_at: string;
};

export type ApiKeyRow = {
  id: string;
  user_id: string;
  api_key_hash: string;
  key_prefix: string;
  name: string;
  active: boolean;
  created_at: string;
};

export type ComputeBalanceRow = {
  id: string;
  user_id: string;
  model_tier: string;
  token_balance_remaining: number | string;
  expiry_date: string;
};

export type StakingLedgerRow = {
  id: string;
  user_id: string;
  amount_staked_auto: number | string;
  vault_tx_signature: string;
  stake_timestamp: string;
  claimable_usdc_yield: number | string;
};

export type UsageLogRow = {
  id: string;
  user_id: string;
  api_key_id: string;
  model_used: string;
  tokens_consumed: number | string;
  timestamp: string;
};

export type ClaimRequestRow = {
  id: string;
  user_id: string;
  wallet_address: string;
  amount_usdc: number | string;
  status: string;
  created_at: string;
  processed_at: string | null;
};

export type ProviderNodeRow = {
  id: string;
  user_id: string;
  worker_token_hash: string;
  token_prefix: string;
  label: string;
  status: string;
  earnings_usdc: number | string;
  jobs_completed: number | string;
  last_seen_at: string | null;
  created_at: string;
};

export type MarketplacePurchaseRow = {
  id: string;
  user_id: string;
  model_tier: string;
  token_amount: number | string;
  usdc_amount_micro: number | string;
  tx_signature: string;
  created_at: string;
};

export type MarginAccountRow = {
  id: string;
  user_id: string;
  total_collateral: number | string;
  free_margin: number | string;
  locked_margin: number | string;
  auto_collateral: number | string;
  usdc_collateral: number | string;
  updated_at: string;
};

export type PositionRow = {
  id: string;
  user_id: string;
  market_tier: string;
  side: string;
  leverage: number;
  entry_price: number | string;
  size_millions: number | string;
  notional_usd: number | string;
  locked_collateral: number | string;
  liquidation_price: number | string;
  status: string;
  realized_pnl: number | string;
  exit_price: number | string | null;
  created_at: string;
  closed_at: string | null;
  settlement_tx: string | null;
  settlement_auto: number | string;
  order_type: string;
  limit_price: number | string | null;
  trigger_price: number | string | null;
  trigger_above: boolean | null;
  triggered: boolean;
  execute_at: string | null;
  parent_id: string | null;
};

export type MarginDepositRow = {
  id: string;
  user_id: string;
  asset: string;
  amount_auto: number | string;
  usd_credited: number | string;
  tx_signature: string;
  created_at: string;
};

export type MarginWithdrawalRow = {
  id: string;
  user_id: string;
  asset: string;
  amount: number | string;
  usd_debited: number | string;
  tx_signature: string | null;
  status: string;
  created_at: string;
};

export type CreditBalanceRow = {
  id: string;
  user_id: string;
  balance_usd_micro: number | string;
  total_purchased_usd_micro: number | string;
  total_spent_usd_micro: number | string;
  updated_at: string;
};

export type CreditPurchaseRow = {
  id: string;
  user_id: string;
  payment_asset: string;
  amount_paid_base: number | string;
  usd_credited_micro: number | string;
  tx_signature: string;
  created_at: string;
};

export type CreditUsageLogRow = {
  id: string;
  user_id: string;
  model_used: string;
  prompt_tokens: number | string;
  completion_tokens: number | string;
  total_tokens: number | string;
  usd_charged_micro: number | string;
  created_at: string;
};

export type OptionPositionRow = {
  id: string;
  user_id: string;
  model_tier: string;
  side: string;
  strike: number | string;
  expiry_date: string;
  expiry_label: string;
  contracts_millions: number | string;
  entry_forward: number | string;
  entry_premium_per_m: number | string;
  entry_iv_percent: number | string;
  premium_paid_usd_micro: number | string;
  status: string;
  close_premium_per_m: number | string | null;
  close_value_usd_micro: number | string | null;
  pnl_usd_micro: number | string | null;
  opened_at: string;
  closed_at: string | null;
};

export type MarketStateRow = {
  tier: string;
  spot: number | string;
  mark: number | string;
  day_open: number | string;
  candles: unknown;
  trades: unknown;
  updated_at: string;
};

export type EngineLockRow = {
  name: string;
  holder: string;
  expires_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: {
          id?: string;
          solana_wallet_address: string;
          privy_user_id?: string | null;
          created_at?: string;
        };
        Update: Partial<UserRow>;
        Relationships: [];
      };
      api_keys: {
        Row: ApiKeyRow;
        Insert: {
          id?: string;
          user_id: string;
          api_key_hash: string;
          key_prefix: string;
          name: string;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<ApiKeyRow>;
        Relationships: [];
      };
      compute_balances: {
        Row: ComputeBalanceRow;
        Insert: {
          id?: string;
          user_id: string;
          model_tier: string;
          token_balance_remaining: number | string;
          expiry_date: string;
        };
        Update: Partial<ComputeBalanceRow>;
        Relationships: [];
      };
      staking_ledger: {
        Row: StakingLedgerRow;
        Insert: {
          id?: string;
          user_id: string;
          amount_staked_auto: number | string;
          vault_tx_signature: string;
          stake_timestamp?: string;
          claimable_usdc_yield?: number | string;
        };
        Update: Partial<StakingLedgerRow>;
        Relationships: [];
      };
      usage_logs: {
        Row: UsageLogRow;
        Insert: {
          id?: string;
          user_id: string;
          api_key_id: string;
          model_used: string;
          tokens_consumed: number | string;
          timestamp?: string;
        };
        Update: Partial<UsageLogRow>;
        Relationships: [];
      };
      claim_requests: {
        Row: ClaimRequestRow;
        Insert: {
          id?: string;
          user_id: string;
          wallet_address: string;
          amount_usdc: number | string;
          status?: string;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: Partial<ClaimRequestRow>;
        Relationships: [];
      };
      provider_nodes: {
        Row: ProviderNodeRow;
        Insert: {
          id?: string;
          user_id: string;
          worker_token_hash: string;
          token_prefix: string;
          label?: string;
          status?: string;
          earnings_usdc?: number | string;
          jobs_completed?: number | string;
          last_seen_at?: string | null;
          created_at?: string;
        };
        Update: Partial<ProviderNodeRow>;
        Relationships: [];
      };
      marketplace_purchases: {
        Row: MarketplacePurchaseRow;
        Insert: {
          id?: string;
          user_id: string;
          model_tier: string;
          token_amount: number | string;
          usdc_amount_micro: number | string;
          tx_signature: string;
          created_at?: string;
        };
        Update: Partial<MarketplacePurchaseRow>;
        Relationships: [];
      };
      margin_accounts: {
        Row: MarginAccountRow;
        Insert: {
          id?: string;
          user_id: string;
          total_collateral?: number | string;
          free_margin?: number | string;
          locked_margin?: number | string;
          auto_collateral?: number | string;
          usdc_collateral?: number | string;
          updated_at?: string;
        };
        Update: Partial<MarginAccountRow>;
        Relationships: [];
      };
      positions: {
        Row: PositionRow;
        Insert: {
          id?: string;
          user_id: string;
          market_tier: string;
          side: string;
          leverage: number;
          entry_price: number | string;
          size_millions: number | string;
          notional_usd: number | string;
          locked_collateral: number | string;
          liquidation_price: number | string;
          status?: string;
          realized_pnl?: number | string;
          exit_price?: number | string | null;
          created_at?: string;
          closed_at?: string | null;
          settlement_tx?: string | null;
          settlement_auto?: number | string;
          order_type?: string;
          limit_price?: number | string | null;
          trigger_price?: number | string | null;
          trigger_above?: boolean | null;
          triggered?: boolean;
          execute_at?: string | null;
          parent_id?: string | null;
        };
        Update: Partial<PositionRow>;
        Relationships: [];
      };
      margin_deposits: {
        Row: MarginDepositRow;
        Insert: {
          id?: string;
          user_id: string;
          asset?: string;
          amount_auto: number | string;
          usd_credited?: number | string;
          tx_signature: string;
          created_at?: string;
        };
        Update: Partial<MarginDepositRow>;
        Relationships: [];
      };
      margin_withdrawals: {
        Row: MarginWithdrawalRow;
        Insert: {
          id?: string;
          user_id: string;
          asset: string;
          amount: number | string;
          usd_debited: number | string;
          tx_signature?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<MarginWithdrawalRow>;
        Relationships: [];
      };
      credit_balances: {
        Row: CreditBalanceRow;
        Insert: {
          id?: string;
          user_id: string;
          balance_usd_micro?: number | string;
          total_purchased_usd_micro?: number | string;
          total_spent_usd_micro?: number | string;
          updated_at?: string;
        };
        Update: Partial<CreditBalanceRow>;
        Relationships: [];
      };
      credit_purchases: {
        Row: CreditPurchaseRow;
        Insert: {
          id?: string;
          user_id: string;
          payment_asset: string;
          amount_paid_base: number | string;
          usd_credited_micro: number | string;
          tx_signature: string;
          created_at?: string;
        };
        Update: Partial<CreditPurchaseRow>;
        Relationships: [];
      };
      credit_usage_logs: {
        Row: CreditUsageLogRow;
        Insert: {
          id?: string;
          user_id: string;
          model_used: string;
          prompt_tokens?: number | string;
          completion_tokens?: number | string;
          total_tokens?: number | string;
          usd_charged_micro?: number | string;
          created_at?: string;
        };
        Update: Partial<CreditUsageLogRow>;
        Relationships: [];
      };
      option_positions: {
        Row: OptionPositionRow;
        Insert: {
          id?: string;
          user_id: string;
          model_tier: string;
          side: string;
          strike: number | string;
          expiry_date: string;
          expiry_label: string;
          contracts_millions: number | string;
          entry_forward: number | string;
          entry_premium_per_m: number | string;
          entry_iv_percent: number | string;
          premium_paid_usd_micro: number | string;
          status?: string;
          close_premium_per_m?: number | string | null;
          close_value_usd_micro?: number | string | null;
          pnl_usd_micro?: number | string | null;
          opened_at?: string;
          closed_at?: string | null;
        };
        Update: Partial<OptionPositionRow>;
        Relationships: [];
      };
      market_state: {
        Row: MarketStateRow;
        Insert: {
          tier: string;
          spot: number | string;
          mark: number | string;
          day_open: number | string;
          candles?: unknown;
          trades?: unknown;
          updated_at?: string;
        };
        Update: Partial<MarketStateRow>;
        Relationships: [];
      };
      engine_locks: {
        Row: EngineLockRow;
        Insert: {
          name: string;
          holder: string;
          expires_at: string;
        };
        Update: Partial<EngineLockRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export function toBigInt(value: number | string | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

export function toDecimalString(value: number | string): string {
  return typeof value === "number" ? value.toFixed(6) : String(value);
}
