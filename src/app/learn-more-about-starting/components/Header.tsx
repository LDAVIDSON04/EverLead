"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="w-full bg-[#FFF9F0]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo - Mobile: text below, Desktop: text next to (original) */}
        <Link href="/" className="flex flex-col items-start md:flex-row md:items-center md:gap-3">
          <Image 
            src="/Soradin.png" 
            alt="Soradin Logo" 
            width={80} 
            height={80}
            className="h-16 w-16 md:h-20 md:w-20 object-contain"
          />
          <span className="text-sm md:text-2xl font-semibold text-[#1A1A1A] md:mt-0 -mt-1">Soradin</span>
        </Link>
        
        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <Link href="/agent">
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

