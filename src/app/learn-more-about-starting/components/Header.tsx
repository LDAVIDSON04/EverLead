"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="w-full bg-[#FAF9F6] sticky top-0 z-50 shadow-sm">
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
          <span className="text-sm md:text-2xl font-semibold text-[#1A1A1A] md:mt-0 -mt-1">Soradin For Agents</span>
        </Link>
        
        {/* Nav links + Auth - match front page header size (text-lg) */}
        <div className="flex items-center gap-3">
          <Link href="/help/for-providers" className="text-black hover:text-[#1A1A1A] hover:underline text-lg font-medium">
            Help
          </Link>
          <Link href="/" className="text-black hover:text-[#1A1A1A] hover:underline text-lg font-medium">
            Find care
          </Link>
          <Link href="/agent">
            <Button variant="ghost" className="text-black hover:text-[#1A1A1A] hover:bg-transparent text-lg font-medium">
              Log in
            </Button>
          </Link>
          <Link href="/create-account">
            <Button className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white text-lg font-medium">
              Create account
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

