"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { CONSOLE_NAV } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-[var(--ink)] px-3 py-5 text-white/80 md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-white">
          <Icon.subs width={18} height={18} />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-white">Nomba Recur</span>
          <span className="block text-[10px] uppercase tracking-wider text-white/40">
            Subscriptions Engine
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {CONSOLE_NAV.map(({ href, label, icon: I }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-white/10 font-medium text-white"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              <I width={18} height={18} className={active ? "text-[var(--brand)]" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/portal"
        className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
      >
        <Icon.portal width={18} height={18} />
        Customer portal
      </Link>
    </aside>
  );
}
