"use client";

import Image from "next/image";
import Link from "next/link";
import { Instagram, Facebook, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white">
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Column 1 - Soradin */}
            <div>
              <h4 className="mb-6 text-lg font-medium">Soradin</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-white/60 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-white/60 hover:text-white transition-colors">
                    About us
                  </Link>
                </li>
                <li>
                  <Link href="mailto:support@soradin.com" className="text-white/60 hover:text-white transition-colors">
                    Contact us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2 - Discover */}
            <div>
              <h4 className="mb-6 text-lg font-medium">Discover</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/learn-more-about-starting" className="text-white/60 hover:text-white transition-colors">
                    Resources for specialists
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-white/60 hover:text-white transition-colors">
                    Data and privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-white/60 hover:text-white transition-colors">
                    Verified reviews
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3 - For Specialists */}
            <div>
              <h4 className="mb-6 text-lg font-medium">For Specialists</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/learn-more-about-starting" className="text-white/60 hover:text-white transition-colors">
                    List your practice
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4 - Have questions? */}
            <div>
              <h4 className="mb-6 text-lg font-medium">Have questions?</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/help" className="text-white/60 hover:text-white transition-colors">
                    Help
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 5 - Are you a specialist */}
            <div>
              <h4 className="mb-6 text-lg font-medium">Are you a planning professional?</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/learn-more-about-starting" className="text-white/60 hover:text-white transition-colors">
                    List your availability on Soradin
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="border-t border-white/10 pt-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo - white.png"
                  alt="Soradin Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                />
                <span className="text-2xl font-medium">Soradin</span>
              </div>

              <div className="flex gap-5">
                <Link
                  href="#"
                  className="text-white/50 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </Link>
                <Link
                  href="https://www.facebook.com/profile.php?id=61583953961107"
                  className="text-white/50 hover:text-white transition-colors"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="text-sm text-white/40 text-center md:text-left">
              <p>
                © {new Date().getFullYear()} Soradin, Inc.{" "}
                <Link href="/terms" className="hover:text-white/60 transition-colors underline">
                  Terms
                </Link>
                {" · "}
                <Link href="/privacy" className="hover:text-white/60 transition-colors underline">
                  Privacy
                </Link>
                {" "}
                <Lock className="inline-block w-4 h-4 text-white/40 align-middle" aria-label="SSL secured" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
