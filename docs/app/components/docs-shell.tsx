import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  APP_URL,
  getDocPage,
  GUIDE_NAV,
  MAIN_NAV,
  type DocSection,
} from "../lib/navigation";

function NavLink({
  slug,
  label,
  onNavigate,
}: {
  slug: string;
  label: string;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const active =
    slug === "/" ? pathname === "/" : pathname === slug;

  return (
    <Link
      to={slug}
      onClick={onNavigate}
      className={`docs-nav-link ${active ? "docs-nav-link-active" : ""}`}
    >
      {label}
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M3 5h14M3 10h14M3 15h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TableOfContents({ sections }: { sections: DocSection[] }) {
  return (
    <nav aria-label="On this page" className="sticky top-20">
      <div className="pixel-sans mb-3 text-xs tracking-widest text-black/40 uppercase">
        On this page
      </div>
      <ul className="space-y-0.5">
        {sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="docs-toc-link">
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DocsFooter() {
  return (
    <footer className="mt-16 border-t border-black/10 pt-8 pb-12">
      <div className="pixel-sans text-xs text-black/40">
        <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
          <a
            href={APP_URL}
            className="transition-colors hover:text-black/70"
            target="_blank"
            rel="noopener noreferrer"
          >
            {APP_URL.replace(/^https?:\/\//, "")}
          </a>
          <a
            href="https://x.com/autonai_robinhood"
            className="transition-colors hover:text-black/70"
            target="_blank"
            rel="noopener noreferrer"
          >
            @autonai_robinhood
          </a>
          <a
            href="https://t.me/autonai_robinhood"
            className="transition-colors hover:text-black/70"
            target="_blank"
            rel="noopener noreferrer"
          >
            Telegram
          </a>
        </div>
        <p>Auton — the CME for machine resources.</p>
      </div>
    </footer>
  );
}

export function DocsShell({
  children,
  title,
  sections,
}: {
  children: React.ReactNode;
  title: string;
  sections: DocSection[];
}) {
  const { pathname } = useLocation();
  const page = getDocPage(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-black focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-1 inline-flex items-center justify-center rounded-md p-2 text-black/70 transition-colors hover:bg-black/[0.04] hover:text-black lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="docs-mobile-nav"
            >
              <MenuIcon />
            </button>
            <Link to="/" className="pixel-serif-logo text-lg text-black">
              AUTON
            </Link>
          </div>
          <a
            href={APP_URL}
            className="pixel-sans text-sm text-black/55 transition-colors hover:text-black"
            target="_blank"
            rel="noopener noreferrer"
          >
            App
          </a>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="docs-mobile-nav"
            className="absolute top-0 left-0 flex h-full w-72 max-w-[80%] flex-col bg-white shadow-xl"
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-black/10 px-4">
              <span className="pixel-serif-logo text-lg text-black">AUTON</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="-mr-1 inline-flex items-center justify-center rounded-md p-2 text-black/70 transition-colors hover:bg-black/[0.04] hover:text-black"
                aria-label="Close navigation menu"
              >
                <CloseIcon />
              </button>
            </div>
            <nav
              aria-label="Docs"
              className="flex-1 space-y-0.5 overflow-y-auto p-4"
            >
              {MAIN_NAV.map((item) => (
                <NavLink
                  key={item.slug}
                  slug={item.slug}
                  label={item.navLabel}
                  onNavigate={() => setMenuOpen(false)}
                />
              ))}

              <div className="pt-4">
                {GUIDE_NAV.map((item) => (
                  <NavLink
                    key={item.slug}
                    slug={item.slug}
                    label={item.navLabel}
                    onNavigate={() => setMenuOpen(false)}
                  />
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-0 px-4 md:px-6">
        <aside className="hidden w-56 shrink-0 border-r border-black/10 py-8 pr-6 lg:block xl:w-60">
          <nav aria-label="Docs" className="sticky top-20 space-y-0.5">
            {MAIN_NAV.map((item) => (
              <NavLink key={item.slug} slug={item.slug} label={item.navLabel} />
            ))}

            <div className="pt-4">
              {GUIDE_NAV.map((item) => (
                <NavLink key={item.slug} slug={item.slug} label={item.navLabel} />
              ))}
            </div>
          </nav>
        </aside>

        <main
          id="main-content"
          className="min-w-0 flex-1 py-8 md:px-8 lg:px-10 xl:px-14"
        >
          <article>
            <header className="mb-8">
              <p className="pixel-sans mb-2 text-xs text-black/40 lg:hidden">
                {page?.navLabel}
              </p>
              <h1 className="pixel-serif text-2xl text-black md:text-3xl">
                {title}
              </h1>
            </header>

            <div className="docs-prose">{children}</div>

            <DocsFooter />
          </article>
        </main>

        <aside className="hidden w-48 shrink-0 py-8 pl-6 xl:block">
          <TableOfContents sections={sections} />
        </aside>
      </div>
    </div>
  );
}
