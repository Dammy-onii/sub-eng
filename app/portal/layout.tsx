import { PortalHeader } from "@/components/layout/PortalHeader";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PortalHeader />
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
      <footer className="mx-auto max-w-3xl px-5 pb-10 text-center text-xs text-[var(--faint)]">
        Powered by Nomba Recur · Subscriptions Engine
      </footer>
    </div>
  );
}
