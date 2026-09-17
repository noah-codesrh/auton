import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { checkSupabaseConnection } from "./db/supabase.js";
import { startOptionSettlement } from "./services/options.js";
import { initPriceEngine, startPriceEngine } from "./services/price-engine.js";
import { startRiskEngine } from "./services/trading.js";

const app = createApp();

async function start() {
  await new Promise<void>((resolve) => {
    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`Auton backend listening on port ${env.PORT}`);
      console.log(`Health: /health`);
      console.log(`Gateway: /api/v1/gateway/chat/completions`);
      console.log(`Trading: /api/v1/trade/markets`);
      resolve();
    });
  });

  void initPriceEngine()
    .then(() => {
      startPriceEngine();
      startRiskEngine();
      startOptionSettlement();
      console.log("Price oracle + risk + option settlement engines started");
    })
    .catch((error) => {
      console.warn("Failed to start trading engines:", error);
    });

  void checkSupabaseConnection().then((health) => {
    if (!health.ok) {
      console.warn("Supabase:", health.error);
      console.warn(
        "Run supabase/migrations/0001_auton_schema.sql in your Supabase SQL Editor",
      );
      return;
    }

    console.log(`Connected to Supabase (${health.latencyMs}ms)`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
