import type { Route } from "./+types/dashboard";
import { DashboardPage } from "../components/dashboard-page";
import { pageTitle } from "../config/site";

export function meta(_args: Route.MetaArgs) {
  return [{ title: pageTitle("Account") }];
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const message =
    error instanceof Error ? error.message : "Something went wrong on this page.";

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-black md:px-6">
      <h1 className="pixel-serif text-2xl">Account page error</h1>
      <p className="pixel-sans mt-3 text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="pixel-sans mt-6 rounded-xl border border-black/15 px-5 py-2.5 text-sm hover:bg-black/5"
      >
        Reload
      </button>
    </main>
  );
}

export default function Dashboard() {
  return <DashboardPage />;
}
