// src/components/AgentNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/agent/dashboard", label: "Dashboard" },
  { href: "/agent/leads/available", label: "Available leads" },
  { href: "/agent/leads/mine", label: "My leads" },
  { href: "/agent/leads/purchased", label: "Purchased" },
];

export function AgentNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl gap-4 px-4">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`border-b-2 px-1 py-2 text-xs font-medium ${
                active
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

