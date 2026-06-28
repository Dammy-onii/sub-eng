export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)]/85 px-6 backdrop-blur">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--amber-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--amber)]">
          <span className="h-1.5 w-1.5 rounded-full bg-current" /> Sandbox
        </span>
        <span className="hidden sm:inline">Built on Nomba payment primitives</span>
      </div>
      <div className="flex items-center gap-3">
        <code className="hidden rounded-md bg-[var(--slate-soft)] px-2 py-1 text-xs text-[var(--slate-text)] sm:inline">
          acct_nomba_demo
        </code>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">
          SG
        </span>
      </div>
    </header>
  );
}
