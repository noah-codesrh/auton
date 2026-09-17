import { Link, useLocation } from "react-router";
import { useState, type ReactNode } from "react";
import { useWallet } from "../hooks/use-wallet";
import { logout as clearBackendToken } from "../lib/api/client";
import { LoginModal } from "./login-modal";

const NAV = [
  { to: "/", label: "Buy" },
  { to: "/trade", label: "Trade" },
  { to: "/yield-curve", label: "Curve" },
  { to: "/derivatives", label: "Options" },
  { to: "/indexes", label: "Indexes" },
  { to: "/chat", label: "Chat" },
  { to: "/models", label: "Models" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/dashboard", label: "Account" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { connected, disconnect } = useWallet();
  const [loginOpen, setLoginOpen] = useState(false);

  const handleDisconnect = async () => {
    clearBackendToken();
    await disconnect();
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="border-b border-black/10 bg-white/90 backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-4 sm:gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <img
              src="/logos/auton-icon.png"
              alt="Auton"
              className="h-7 w-7"
              width={28}
              height={28}
            />
            <span className="pixel-serif text-lg text-black">Futures</span>
          </Link>

          <nav className="flex flex-1 items-center justify-center gap-1 overflow-x-auto sm:gap-2 md:gap-4">
            {NAV.map((item) => {
              const baseClass =
                "pixel-sans shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm transition-colors sm:px-3";

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`${baseClass} ${
                    location.pathname === item.to ||
                    (item.to !== "/" && location.pathname.startsWith(item.to))
                      ? "bg-black/5 text-black"
                      : "text-black/50 hover:text-black"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0">
            {connected ? (
              <button
                type="button"
                onClick={() => void handleDisconnect()}
                className="pixel-sans rounded-lg border border-black/15 px-3 py-2 text-sm text-black/60 hover:border-black/30 hover:text-black"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="pixel-sans rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 hover:border-emerald-600/50"
              >
                Connect wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {children}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
