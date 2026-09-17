import { Link } from "react-router";
import { TRADE_APP_URL } from "../lib/site-urls";

const FOOTER_LINKS = {
  Product: [
    { label: "Markets", href: TRADE_APP_URL, external: true },
    {
      label: "Dashboard",
      href: `${TRADE_APP_URL}/dashboard`,
      external: true,
    },
    { label: "Trade", href: `${TRADE_APP_URL}/trade`, external: true },
    { label: "Roadmap", href: "/roadmap", external: false },
  ],
  "$AUTO": [
    { label: "Staking", href: "/staking", external: false },
    { label: "Treasury", href: "/treasury", external: false },
    { label: "Token", href: "/#auto", external: false },
  ],
  Resources: [
    { label: "Blog", href: "#", external: false },
    { label: "X", href: "https://x.com/autonai_rh", external: true },
    { label: "Telegram", href: "https://t.me/autonaichat", external: true },
  ],
};

export function Footer() {
  return (
    <footer className="mt-8 border-t border-black/10">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="pixel-serif-logo text-lg text-black">
              AUTON
            </Link>
            <p className="pixel-sans mt-3 max-w-[220px] text-xs text-black/40">
              The CME for machine resources — the liquidity venue for the
              machine economy.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <div className="pixel-sans mb-3 text-xs tracking-widest text-black/40">
                {section === "$AUTO" ? (
                  <>
                    <span className="dollar">$</span>AUTO
                  </>
                ) : (
                  section.toUpperCase()
                )}
              </div>
              <div className="flex flex-col gap-2">
                {links.map((link) =>
                  link.external ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pixel-sans text-sm text-black/60 transition-colors hover:text-black"
                    >
                      {link.label}
                    </a>
                  ) : link.href.startsWith("#") || link.href.startsWith("/#") ? (
                    <a
                      key={link.label}
                      href={link.href}
                      className="pixel-sans text-sm text-black/60 transition-colors hover:text-black"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      to={link.href}
                      className="pixel-sans text-sm text-black/60 transition-colors hover:text-black"
                    >
                      {link.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
