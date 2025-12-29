"use client";

import Link from "next/link";
import Image from "next/image";

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
          />
          <span className="text-xl font-semibold text-black">Soradin</span>
        </Link>
      </div>
    </header>
  );
}

