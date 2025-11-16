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
    <nav className="border-b border-[#ded3c2] bg-white">
      <div className="mx-auto flex max-w-6xl gap-4 px-6">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`border-b-2 px-1 py-3 text-xs font-medium transition-colors ${
                active
                  ? "border-[#2a2a2a] text-[#2a2a2a]"
                  : "border-transparent text-[#6b6b6b] hover:border-[#ded3c2] hover:text-[#2a2a2a]"
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
