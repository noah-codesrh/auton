import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchPublicConfig, type PublicConfig } from "../lib/api/config";

const ConfigContext = createContext<{
  config: PublicConfig | null;
  loading: boolean;
  error: string | null;
}>({ config: null, loading: true, error: null });

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchPublicConfig()
      .then(setConfig)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load config");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
