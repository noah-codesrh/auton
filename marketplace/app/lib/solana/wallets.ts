import {
  ROBINHOOD_CHAIN_ID,
  ROBINHOOD_EXPLORER,
  getRobinhoodRpcUrl,
} from "../robinhood";

export type WalletId = string;

export type WalletOption = {
  id: WalletId;
  label: string;
  detected: boolean;
  installUrl?: string;
  icon?: string;
};

export type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

type EthereumProvider = Eip1193Provider & {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isCoinbaseBrowser?: boolean;
  isPhantom?: boolean;
  isRabby?: boolean;
  isRainbow?: boolean;
  isBraveWallet?: boolean;
  isTrust?: boolean;
  isTrustWallet?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isZerion?: boolean;
  isFrame?: boolean;
  isTalisman?: boolean;
  isBitKeep?: boolean;
  isBitget?: boolean;
  isCtrlWallet?: boolean;
  isXDEFI?: boolean;
  providers?: EthereumProvider[];
};

type Eip6963ProviderInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
};

type Eip6963ProviderDetail = {
  info: Eip6963ProviderInfo;
  provider: EthereumProvider;
};

type DiscoveredWallet = {
  id: WalletId;
  label: string;
  provider: EthereumProvider;
  rdns?: string;
  icon?: string;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    phantom?: { ethereum?: EthereumProvider };
    coinbaseWalletExtension?: EthereumProvider;
    rabby?: EthereumProvider;
    okxwallet?: EthereumProvider;
    zerionWallet?: EthereumProvider;
    trustwallet?: EthereumProvider;
  }

  interface WindowEventMap {
    "eip6963:announceProvider": CustomEvent<Eip6963ProviderDetail>;
  }
}

const CHAIN_HEX = `0x${ROBINHOOD_CHAIN_ID.toString(16)}`;

const KNOWN_EVM: Array<{
  id: WalletId;
  label: string;
  installUrl: string;
  rdns?: string[];
}> = [
  {
    id: "metamask",
    label: "MetaMask",
    installUrl: "https://metamask.io/download",
    rdns: ["io.metamask", "io.metamask.flask"],
  },
  {
    id: "coinbase",
    label: "Coinbase Wallet",
    installUrl: "https://www.coinbase.com/wallet/downloads",
    rdns: ["com.coinbase.wallet"],
  },
  {
    id: "rabby",
    label: "Rabby",
    installUrl: "https://rabby.io",
    rdns: ["io.rabby"],
  },
  {
    id: "rainbow",
    label: "Rainbow",
    installUrl: "https://rainbow.me/download",
    rdns: ["me.rainbow"],
  },
  {
    id: "phantom",
    label: "Phantom",
    installUrl: "https://phantom.app/download",
    rdns: ["app.phantom"],
  },
  {
    id: "brave",
    label: "Brave Wallet",
    installUrl: "https://brave.com/wallet",
    rdns: ["com.brave.wallet"],
  },
  {
    id: "okx",
    label: "OKX Wallet",
    installUrl: "https://www.okx.com/web3",
    rdns: ["com.okex.wallet", "com.okx.wallet"],
  },
  {
    id: "zerion",
    label: "Zerion",
    installUrl: "https://zerion.io/extension",
    rdns: ["io.zerion.wallet"],
  },
  {
    id: "trust",
    label: "Trust Wallet",
    installUrl: "https://trustwallet.com/browser-extension",
    rdns: ["com.trustwallet.app"],
  },
  {
    id: "bitget",
    label: "Bitget",
    installUrl: "https://web3.bitget.com/en/wallet-download",
    rdns: ["com.bitget.web3"],
  },
];

const RDNS_TO_KNOWN = new Map<string, (typeof KNOWN_EVM)[number]>();
for (const wallet of KNOWN_EVM) {
  for (const rdns of wallet.rdns ?? []) {
    RDNS_TO_KNOWN.set(rdns, wallet);
  }
}

const discovered = new Map<WalletId, DiscoveredWallet>();
const listeners = new Set<() => void>();
let listening = false;

function notify() {
  for (const listener of listeners) listener();
}

function alreadyHasProvider(provider: EthereumProvider) {
  for (const entry of discovered.values()) {
    if (entry.provider === provider) return true;
  }
  return false;
}

function remember(entry: DiscoveredWallet) {
  if (alreadyHasProvider(entry.provider) || discovered.has(entry.id)) return;
  discovered.set(entry.id, entry);
  notify();
}

function guessInjectedId(provider: EthereumProvider): {
  id: WalletId;
  label: string;
} {
  if (provider.isRabby) return { id: "rabby", label: "Rabby" };
  if (provider.isRainbow) return { id: "rainbow", label: "Rainbow" };
  if (provider.isPhantom) return { id: "phantom", label: "Phantom" };
  if (provider.isCoinbaseWallet || provider.isCoinbaseBrowser) {
    return { id: "coinbase", label: "Coinbase Wallet" };
  }
  if (provider.isBraveWallet) return { id: "brave", label: "Brave Wallet" };
  if (provider.isOkxWallet || provider.isOKExWallet) {
    return { id: "okx", label: "OKX Wallet" };
  }
  if (provider.isTrust || provider.isTrustWallet) {
    return { id: "trust", label: "Trust Wallet" };
  }
  if (provider.isZerion) return { id: "zerion", label: "Zerion" };
  if (provider.isTalisman) return { id: "talisman", label: "Talisman" };
  if (provider.isBitKeep || provider.isBitget) {
    return { id: "bitget", label: "Bitget" };
  }
  if (provider.isCtrlWallet || provider.isXDEFI) {
    return { id: "ctrl", label: "Ctrl Wallet" };
  }
  if (provider.isMetaMask) return { id: "metamask", label: "MetaMask" };
  return { id: "injected", label: "Browser wallet" };
}

function onAnnounce(event: Event) {
  const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
  if (!detail?.info || !detail.provider) return;

  const known = RDNS_TO_KNOWN.get(detail.info.rdns);
  remember({
    id: known?.id ?? `eip6963:${detail.info.rdns}`,
    label: known?.label ?? detail.info.name,
    provider: detail.provider,
    rdns: detail.info.rdns,
    icon: detail.info.icon,
  });
}

function collectLegacyProviders() {
  if (typeof window === "undefined") return;

  const injected = window.ethereum;
  const listed: EthereumProvider[] = [];
  if (injected?.providers?.length) listed.push(...injected.providers);
  else if (injected) listed.push(injected);
  if (window.phantom?.ethereum) listed.push(window.phantom.ethereum);
  if (window.coinbaseWalletExtension) listed.push(window.coinbaseWalletExtension);
  if (window.rabby) listed.push(window.rabby);
  if (window.okxwallet) listed.push(window.okxwallet);
  if (window.zerionWallet) listed.push(window.zerionWallet);
  if (window.trustwallet) listed.push(window.trustwallet);

  for (const provider of listed) {
    const { id, label } = guessInjectedId(provider);
    remember({ id, label, provider });
  }

  if (injected && !discovered.size) {
    remember({
      id: "injected",
      label: "Browser wallet",
      provider: injected,
    });
  }
}

function ensureListener() {
  if (typeof window === "undefined" || listening) return;
  listening = true;
  window.addEventListener("eip6963:announceProvider", onAnnounce);
}

export function startWalletDiscovery() {
  if (typeof window === "undefined") return;
  ensureListener();
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  collectLegacyProviders();
}

export function requestWalletDiscovery() {
  startWalletDiscovery();
}

export async function waitForWalletDiscovery(ms = 250) {
  startWalletDiscovery();
  await new Promise((resolve) => setTimeout(resolve, ms));
  collectLegacyProviders();
}

export function subscribeWalletDiscovery(listener: () => void) {
  startWalletDiscovery();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getWalletInstallUrl(walletId: WalletId) {
  return KNOWN_EVM.find((wallet) => wallet.id === walletId)?.installUrl;
}

export function listWalletOptions(): WalletOption[] {
  startWalletDiscovery();
  collectLegacyProviders();

  const options: WalletOption[] = [];
  const seen = new Set<string>();

  for (const entry of discovered.values()) {
    options.push({
      id: entry.id,
      label: entry.label,
      detected: true,
      icon: entry.icon,
    });
    seen.add(entry.id);
    seen.add(entry.label.toLowerCase());
    if (entry.rdns) seen.add(entry.rdns);
  }

  for (const wallet of KNOWN_EVM) {
    if (seen.has(wallet.id) || seen.has(wallet.label.toLowerCase())) continue;
    if (wallet.rdns?.some((rdns) => seen.has(rdns))) continue;
    options.push({
      id: wallet.id,
      label: wallet.label,
      detected: false,
      installUrl: wallet.installUrl,
    });
  }

  return options;
}

function findDiscovered(walletId: WalletId) {
  const exact = discovered.get(walletId);
  if (exact) return exact;

  for (const entry of discovered.values()) {
    if (entry.id === walletId) return entry;
    if (entry.rdns && `eip6963:${entry.rdns}` === walletId) return entry;
  }

  return null;
}

export function getWalletProvider(walletId: WalletId): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  startWalletDiscovery();
  collectLegacyProviders();

  const remembered = findDiscovered(walletId);
  if (remembered) return remembered.provider;

  switch (walletId) {
    case "phantom":
      return window.phantom?.ethereum ?? null;
    case "coinbase":
      return window.coinbaseWalletExtension ?? null;
    case "rabby":
      return window.rabby ?? null;
    case "okx":
      return window.okxwallet ?? null;
    case "zerion":
      return window.zerionWallet ?? null;
    case "trust":
      return window.trustwallet ?? null;
    case "injected":
      return window.ethereum ?? null;
    default:
      return null;
  }
}

export function isWalletInstalled(walletId: WalletId) {
  return Boolean(findDiscovered(walletId) || getWalletProvider(walletId));
}

export async function ensureRobinhoodChain(provider: Eip1193Provider) {
  const current = await provider.request({ method: "eth_chainId" });
  if (String(current).toLowerCase() === CHAIN_HEX) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_HEX }],
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? Number((error as { code: unknown }).code)
        : 0;
    if (code !== 4902) throw error;

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_HEX,
          chainName: "Robinhood Chain",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [getRobinhoodRpcUrl()],
          blockExplorerUrls: [ROBINHOOD_EXPLORER],
        },
      ],
    });
  }
}

export async function connectWallet(
  walletId: WalletId,
  options?: { onlyIfTrusted?: boolean },
) {
  await waitForWalletDiscovery(options?.onlyIfTrusted ? 400 : 80);
  const provider = getWalletProvider(walletId);

  if (!provider) {
    const known = KNOWN_EVM.find((wallet) => wallet.id === walletId);
    throw new Error(
      known
        ? `${known.label} not found in this browser. Install it and refresh.`
        : "No EVM wallet found in this browser.",
    );
  }

  const method = options?.onlyIfTrusted ? "eth_accounts" : "eth_requestAccounts";
  const accounts = (await provider.request({ method })) as string[];
  const address = accounts[0];

  if (!address) {
    throw new Error(
      options?.onlyIfTrusted
        ? "Wallet is not already connected."
        : "Wallet did not return an address.",
    );
  }

  if (!options?.onlyIfTrusted) {
    await ensureRobinhoodChain(provider);
  }

  return { walletId, address, provider };
}

export async function disconnectWallet(_walletId: WalletId | null) {
  // Injected EVM wallets do not expose a reliable disconnect.
}

export async function signWalletMessage(
  provider: Eip1193Provider,
  address: string,
  message: string,
) {
  const signature = await provider.request({
    method: "personal_sign",
    params: [message, address],
  });
  return String(signature);
}

export async function sendWalletTransaction(
  provider: Eip1193Provider,
  from: string,
  transaction: { to: string; data: string },
) {
  await ensureRobinhoodChain(provider);
  const hash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to: transaction.to,
        data: transaction.data,
      },
    ],
  });
  return String(hash);
}
