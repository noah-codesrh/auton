/**
 * Deploy $AUTO (ERC-20) on Robinhood Chain.
 *
 *   cd backend
 *   DEPLOY_PRIVATE_KEY=0x… pnpm deploy:auto
 *
 * Optional:
 *   AUTO_RECIPIENT=0x…   # defaults to the deployer; usually the treasury
 *   ROBINHOOD_RPC_URL=https://rpc.mainnet.chain.robinhood.com
 *
 * After it prints the address, set AUTO_TOKEN_MINT (and VITE_AUTO_TOKEN_MINT) to that 0x.
 */
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { robinhoodChain } from "../src/config/chain.js";

config({ override: true });

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = readFileSync(join(ROOT, "contracts/AutoToken.sol"), "utf8");

const rpc =
  process.env.ROBINHOOD_RPC_URL?.trim() ||
  "https://rpc.mainnet.chain.robinhood.com";

function compile(): { abi: unknown; bytecode: Hex } {
  const input = {
    language: "Solidity",
    sources: { "AutoToken.sol": { content: SOURCE } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object"] },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input))) as {
    errors?: Array<{ severity: string; formattedMessage: string }>;
    contracts?: {
      "AutoToken.sol"?: {
        AutoToken?: {
          abi: unknown;
          evm: { bytecode: { object: string } };
        };
      };
    };
  };

  const errors = (output.errors ?? []).filter((e) => e.severity === "error");
  if (errors.length > 0) {
    throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
  }

  const artifact = output.contracts?.["AutoToken.sol"]?.AutoToken;
  const bytecode = artifact?.evm.bytecode.object;
  if (!artifact || !bytecode) {
    throw new Error("solc did not emit AutoToken bytecode");
  }

  return {
    abi: artifact.abi,
    bytecode: `0x${bytecode}` as Hex,
  };
}

async function main() {
  const rawKey = process.env.DEPLOY_PRIVATE_KEY?.trim();
  if (!rawKey || !/^0x[0-9a-fA-F]{64}$/.test(rawKey)) {
    throw new Error(
      "Set DEPLOY_PRIVATE_KEY to a 0x-prefixed 32-byte key that has ETH on Robinhood for gas.",
    );
  }

  const account = privateKeyToAccount(rawKey as Hex);
  const recipientRaw = process.env.AUTO_RECIPIENT?.trim() || account.address;
  if (!isAddress(recipientRaw, { strict: false })) {
    throw new Error("AUTO_RECIPIENT must be a 0x address");
  }
  const recipient = recipientRaw as Address;

  const { abi, bytecode } = compile();
  const chain = {
    ...robinhoodChain,
    rpcUrls: { default: { http: [rpc] } },
  };

  const wallet = createWalletClient({
    account,
    chain,
    transport: http(rpc),
  });
  const publicClient = createPublicClient({
    chain,
    transport: http(rpc),
  });

  const hash = await wallet.deployContract({
    abi: abi as never,
    bytecode,
    args: [recipient],
  });

  console.log("Deploy tx:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) {
    throw new Error("Deploy transaction failed");
  }

  console.log("");
  console.log("$AUTO deployed on Robinhood Chain");
  console.log("  address:   ", receipt.contractAddress);
  console.log("  recipient: ", recipient);
  console.log("  supply:    ", "1000000000 AUTO (6 decimals)");
  console.log("  explorer:  ", `${robinhoodChain.blockExplorers.default.url}/address/${receipt.contractAddress}`);
  console.log("");
  console.log("Set these and restart:");
  console.log(`  AUTO_TOKEN_MINT=${receipt.contractAddress}`);
  console.log("  AUTO_TOKEN_DECIMALS=6");
  console.log(`  VITE_AUTO_TOKEN_MINT=${receipt.contractAddress}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
