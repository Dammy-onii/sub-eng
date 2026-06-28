import Link from "next/link";
import { Icon } from "@/components/icons";

export function PortalHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand)] text-white">
            <Icon.subs width={16} height={16} />
          </span>
          <span className="text-sm font-semibold text-[var(--text)]">BrightPay billing</span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--text)]"
        >
          <Icon.portal width={15} height={15} /> Merchant console
        </Link>
      </div>
    </header>
  );
}
