"use client";

import Image from "next/image";
import Link from "next/link";

// Installer files: after building the Electron app, place the outputs in public/downloads/
// - Mac: electron/dist/Soradin Agent Portal-1.0.0.dmg → public/downloads/Soradin-Agent-Portal-mac.dmg
// - Windows: electron/dist/Soradin Agent Portal Setup 1.0.0.exe → public/downloads/Soradin-Agent-Portal-win.exe
const MAC_DOWNLOAD_URL = "/downloads/Soradin-Agent-Portal-mac.dmg";
const WIN_DOWNLOAD_URL = "/downloads/Soradin-Agent-Portal-win.exe";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="w-full bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Soradin Logo"
              width={80}
              height={80}
              className="h-20 w-20 object-contain"
            />
            <span className="text-2xl font-medium text-[#1A1A1A]">Soradin</span>
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors font-medium"
          >
            Home
          </Link>
        </div>
      </header>

      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-2">
          Soradin Agent Portal
        </h1>
        <p className="text-[#4a4a4a] mb-10">
          Use the agent portal in a dedicated app. Same login as the website.
        </p>

        {/* App icon on dark background so white logo is visible */}
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-[#1A1A1A] mb-10">
          <Image
            src="/download-app-icon.png"
            alt="Soradin Agent Portal"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={MAC_DOWNLOAD_URL}
            download
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-[#333] transition-colors"
          >
            Download for Mac
          </a>
          <a
            href={WIN_DOWNLOAD_URL}
            download
            className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-[#333] transition-colors"
          >
            Download for Windows
          </a>
        </div>

        <p className="mt-8 text-sm text-[#4a4a4a]">
          After installing, open the app and sign in with your Soradin agent
          account.
        </p>
      </section>
    </div>
  );
}
