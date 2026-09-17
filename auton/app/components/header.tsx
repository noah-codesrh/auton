import { Link } from "react-router";
import { TRADE_APP_URL } from "../lib/site-urls";

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}

export function Header({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const isLight = variant === "light";

  const navShell = isLight
    ? "border-black/10 bg-white/85"
    : "border-white/10 bg-black/80";
  const logo = isLight ? "text-black" : "text-white";
  const icon = isLight
    ? "text-black/60 hover:text-black"
    : "text-white/70 hover:text-white";
  const tradeBtn = isLight
    ? "bg-black text-white hover:bg-black/85"
    : "bg-white text-black hover:bg-white/85";

  return (
    <header className="fixed top-0 right-0 left-0 z-50 py-4">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <nav className={`flex items-center justify-between rounded-2xl border px-4 py-3 backdrop-blur-sm md:px-6 ${navShell}`}>
          <Link
            to="/"
            className={`pixel-serif-logo flex items-center text-lg font-bold md:text-xl ${logo}`}
          >
            AUTON
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="https://x.com/autonairh"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 transition-colors ${icon}`}
              aria-label="X"
            >
              <XIcon />
            </a>
            <a
              href="https://t.me/autonaichat"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 transition-colors ${icon}`}
              aria-label="Telegram"
            >
              <TelegramIcon />
            </a>
            <a
              href={`${TRADE_APP_URL}/trade`}
              className={`pixel-serif-logo rounded-lg px-4 py-2 text-sm transition-colors md:px-5 ${tradeBtn}`}
            >
              Trade
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
