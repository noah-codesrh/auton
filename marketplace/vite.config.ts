import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      nodePolyfills({
        include: ["buffer", "process"],
        globals: { Buffer: true, global: true, process: true },
        protocolImports: false,
      }),
      tailwindcss(),
      reactRouter(),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 5180,
      strictPort: false,
    },
    define: {
      "import.meta.env.VITE_AUTON_API_URL": JSON.stringify(
        env.VITE_AUTON_API_URL ||
          (mode === "development"
            ? "http://localhost:4000"
            : "https://api.autonairh.xyz"),
      ),
      "import.meta.env.VITE_SITE_URL": JSON.stringify(
        env.VITE_SITE_URL || "https://app.autonairh.xyz",
      ),
      "import.meta.env.VITE_ROBINHOOD_RPC_URL": JSON.stringify(
        env.VITE_ROBINHOOD_RPC_URL ||
          "https://rpc.mainnet.chain.robinhood.com",
      ),
      "import.meta.env.VITE_SOLANA_RPC_URL": JSON.stringify(
        env.VITE_SOLANA_RPC_URL || "",
      ),
    },
  };
});
