import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    define: {
      "import.meta.env.VITE_SITE_URL": JSON.stringify(env.VITE_SITE_URL || ""),
      "import.meta.env.VITE_PRIVY_APP_ID": JSON.stringify(
        env.VITE_PRIVY_APP_ID || env.PRIVY_APP_ID || "",
      ),
      "import.meta.env.VITE_AUTON_API_URL": JSON.stringify(
        env.VITE_AUTON_API_URL ||
          (mode === "development"
            ? "http://localhost:4000"
            : "https://api.autonairh.xyz"),
      ),
      "import.meta.env.VITE_ROBINHOOD_RPC_URL": JSON.stringify(
        env.VITE_ROBINHOOD_RPC_URL ||
          env.VITE_SOLANA_RPC_URL ||
          "https://rpc.mainnet.chain.robinhood.com",
      ),
      "import.meta.env.VITE_SOLANA_RPC_URL": JSON.stringify(
        env.VITE_SOLANA_RPC_URL || "",
      ),
      "import.meta.env.VITE_SOLANA_CLUSTER": JSON.stringify(
        env.VITE_SOLANA_CLUSTER || "mainnet-beta",
      ),
      "import.meta.env.VITE_AUTO_TOKEN_MINT": JSON.stringify(
        env.VITE_AUTO_TOKEN_MINT ||
          "0xdCED579A985eC88EC2Bd0af2eD9ac030F1AeC398",
      ),
      "import.meta.env.VITE_MASTER_VAULT_WALLET": JSON.stringify(
        env.VITE_MASTER_VAULT_WALLET || "",
      ),
      "import.meta.env.VITE_AUTO_STAKE_POOL": JSON.stringify(
        env.VITE_AUTO_STAKE_POOL || "",
      ),
      "import.meta.env.VITE_AUTO_TOKEN_DECIMALS": JSON.stringify(
        env.VITE_AUTO_TOKEN_DECIMALS || "6",
      ),
    },
    build: {
      rolldownOptions: {
        onwarn(warning, warn) {
          if (warning.code === "INVALID_ANNOTATION") return;
          warn(warning);
        },
      },
    },
  };
});
