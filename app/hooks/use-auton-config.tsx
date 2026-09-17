import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  fetchPublicConfig,
  type AutonPublicConfig,
} from "../lib/api/public-config";

const AutonConfigContext = createContext<{
  config: AutonPublicConfig | null;
  loading: boolean;
}>({ config: null, loading: true });

export function AutonConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AutonPublicConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchPublicConfig()
      .then(setConfig)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AutonConfigContext.Provider value={{ config, loading }}>
      {children}
    </AutonConfigContext.Provider>
  );
}

export function useAutonConfig() {
  return useContext(AutonConfigContext);
}

export function useStakingStatusFromConfig() {
  const { config } = useAutonConfig();
  const stakePool = import.meta.env.VITE_AUTO_STAKE_POOL?.trim() ?? "";

  if (!config?.autoTokenMint) return "pending" as const;
  if (!stakePool) return "token-only" as const;
  return "live" as const;
}
