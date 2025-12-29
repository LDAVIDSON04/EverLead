"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#0D5C3D] flex items-center justify-center">
            <span className="text-white text-xl font-semibold">S</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold text-black">Soradin</span>
            <span className="text-gray-600">for Providers</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-black hover:text-[#0D5C3D] hover:bg-transparent">
              Log in
            </Button>
          </Link>
          <Link href="/create-account">
            <Button className="bg-[#0D5C3D] hover:bg-[#0A4A30] text-white">
              Sign up
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

