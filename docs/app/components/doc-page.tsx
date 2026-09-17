import { Link } from "react-router";
import { DocsShell } from "./docs-shell";
import { getAdjacentPages, type DocPage } from "../lib/navigation";

export function DocPage({
  page,
  children,
}: {
  page: DocPage;
  children: React.ReactNode;
}) {
  const { prev, next } = getAdjacentPages(page.slug);

  return (
    <DocsShell title={page.title} sections={page.sections}>
      {children}

      {(prev || next) && (
        <nav
          aria-label="Docs pagination"
          className="mt-12 flex items-stretch justify-between gap-4 border-t border-black/10 pt-8"
        >
          {prev ? (
            <Link
              to={prev.slug}
              className="group flex flex-col gap-1 rounded-lg border border-black/10 px-4 py-3 transition-colors hover:border-black/30 hover:bg-black/[0.02]"
            >
              <span className="pixel-sans text-xs text-black/40">Previous</span>
              <span className="pixel-sans text-sm text-black/70 group-hover:text-black">
                {prev.navLabel}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={next.slug}
              className="group flex flex-col items-end gap-1 rounded-lg border border-black/10 px-4 py-3 text-right transition-colors hover:border-black/30 hover:bg-black/[0.02]"
            >
              <span className="pixel-sans text-xs text-black/40">Next</span>
              <span className="pixel-sans text-sm text-black/70 group-hover:text-black">
                {next.navLabel}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </DocsShell>
  );
}
