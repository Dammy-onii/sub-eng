import { Icon } from "@/components/icons";

export const CONSOLE_NAV = [
  { href: "/", label: "Overview", icon: Icon.overview },
  { href: "/plans", label: "Plans", icon: Icon.plans },
  { href: "/subscriptions", label: "Subscriptions", icon: Icon.subs },
  { href: "/customers", label: "Customers", icon: Icon.customers },
  { href: "/dunning", label: "Dunning", icon: Icon.dunning },
  { href: "/developers", label: "Developers", icon: Icon.developers },
  { href: "/architecture", label: "How it works", icon: Icon.architecture },
] as const;
