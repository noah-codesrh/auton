import { Link } from "react-router";
import { useState } from "react";
import { DOCS_URL, TRADE_APP_URL } from "../lib/site-urls";

const NAV_LINKS = [
  { label: "Markets", href: TRADE_APP_URL, internal: false },
  { label: "Chat", href: `${TRADE_APP_URL}/chat`, internal: false },
  { label: "Earn", href: "/earn", internal: true },
  { label: "Roadmap", href: "/roadmap", internal: true },
  { label: "Dashboard", href: `${TRADE_APP_URL}/dashboard`, internal: false },
  { label: "Docs", href: DOCS_URL, internal: false },
];

const AUTO_LINKS = [
  { label: "Staking", href: "/staking", internal: true },
  { label: "Treasury", href: "/treasury", internal: true },
  { label: "Token", href: "/#auto", internal: true },
];

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const isLight = variant === "light";

  const navShell = isLight
    ? "border-black/10 bg-white/85"
    : "border-white/10 bg-black/80";
  const logo = isLight ? "text-black" : "text-white";
  const linkClass = isLight
    ? "text-black/60 hover:text-black"
    : "text-white/70 hover:text-white";
  const icon = isLight
    ? "text-black/60 hover:text-black"
    : "text-white/70 hover:text-white";
  const menuBg = isLight
    ? "border-black/10 bg-white/95"
    : "border-white/10 bg-black/95";
  const dropdownBg = isLight
    ? "border-black/10 bg-white/95"
    : "border-white/10 bg-black/95";
  const burger = isLight ? "bg-black" : "bg-white";
  const tradeBtn = isLight
    ? "bg-black text-white hover:bg-black/85"
    : "bg-white text-black hover:bg-white/85";

  return (
    <header className="fixed top-0 right-0 left-0 z-50 py-4">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <nav className={`flex items-center justify-between rounded-2xl border px-4 py-3 backdrop-blur-sm md:px-6 ${navShell}`}>
          <div className="flex-1">
            <Link
              to="/"
              className={`pixel-serif-logo flex items-center text-lg font-bold md:text-xl ${logo}`}
            >
              AUTON
            </Link>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) =>
              link.internal ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`pixel-sans text-sm tracking-wide transition-colors ${linkClass}`}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className={`pixel-sans text-sm tracking-wide transition-colors ${linkClass}`}
                >
                  {link.label}
                </a>
              ),
            )}
            <div className="group relative">
              <span className={`pixel-sans inline-flex cursor-pointer items-center gap-1 text-sm tracking-wide transition-colors ${linkClass}`}>
                <span className="dollar">$</span>AUTO
                <svg width="8" height="6" viewBox="0 0 8 6" fill="currentColor" className="mt-0.5">
                  <path d="M0 0h8L4 6z" />
                </svg>
              </span>
              <div className="absolute top-full left-1/2 hidden -translate-x-1/2 pt-3 group-hover:block">
                <div className={`flex flex-col gap-3 rounded-xl border px-5 py-3 whitespace-nowrap ${dropdownBg}`}>
                  {AUTO_LINKS.map((autoLink) =>
                    autoLink.internal ? (
                      <Link
                        key={autoLink.label}
                        to={autoLink.href}
                        className={`pixel-sans text-sm tracking-wide transition-colors ${linkClass}`}
                      >
                        {autoLink.label}
                      </Link>
                    ) : (
                      <a
                        key={autoLink.label}
                        href={autoLink.href}
                        className={`pixel-sans text-sm tracking-wide transition-colors ${linkClass}`}
                      >
                        {autoLink.label}
                      </a>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            <a
              href="https://github.com/Autonai-robinhood"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 transition-colors ${icon}`}
              aria-label="GitHub"
            >
              <GitHubIcon />
            </a>
            <a
              href="https://x.com/autonai_robinhood"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 transition-colors ${icon}`}
              aria-label="X"
            >
              <XIcon />
            </a>
            <a
              href="https://t.me/autonai_robinhood"
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
            <button
              type="button"
              className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className={`block h-0.5 w-5 transition-transform ${burger} ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`block h-0.5 w-5 transition-opacity ${burger} ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 transition-transform ${burger} ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className={`mt-2 rounded-2xl border p-4 md:hidden ${menuBg}`}>
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((navLink) =>
                navLink.internal ? (
                  <Link
                    key={navLink.label}
                    to={navLink.href}
                    className={`pixel-sans text-sm tracking-wide transition-colors ${linkClass}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {navLink.label}
                  </Link>
                ) : (
                  <a
                    key={navLink.label}
                    href={navLink.href}
                    className={`pixel-sans text-sm tracking-wide transition-colors ${linkClass}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {navLink.label}
                  </a>
                ),
              )}
              {AUTO_LINKS.map((autoLink) =>
                autoLink.internal ? (
                  <Link
                    key={autoLink.label}
                    to={autoLink.href}
                    className={`pixel-sans text-sm tracking-wide transition-colors ${linkClass}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {autoLink.label}
                  </Link>
                ) : (
                  <a
                    key={autoLink.label}
                    href={autoLink.href}
                    className={`pixel-sans text-sm tracking-wide transition-colors ${linkClass}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {autoLink.label}
                  </a>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
