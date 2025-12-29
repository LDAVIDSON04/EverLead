"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="w-full bg-[#FFF9F0]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Soradin" 
            width={80} 
            height={80}
            className="object-contain"
            style={{ backgroundColor: 'transparent' }}
          />
          <span className="text-xl font-semibold text-black">Soradin</span>
        </Link>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-black hover:text-[#0D5C3D] hover:bg-transparent">
              Log in
            </Button>
          </Link>
          <Link href="/create-account">
            <Button className="bg-[#0D5C3D] hover:bg-[#0A4A30] text-white">
              Create account
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

