const REPO_URL = "https://github.com/alizaaiter27/ai-travel-planner";

// Shown on every page (added in app/layout.tsx).
export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Places from Google · Plans by AI · Costs are estimates — check before
          you go.
        </p>
        <nav aria-label="Project links" className="flex gap-1 sm:-mr-3">
          <a
            href={REPO_URL}
            className="-ml-3 flex min-h-11 items-center rounded-lg px-3 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:ml-0"
          >
            Source code
          </a>
          <a
            href={`${REPO_URL}/tree/main/docs/course`}
            className="flex min-h-11 items-center rounded-lg px-3 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            How it was built
          </a>
        </nav>
      </div>
    </footer>
  );
}
