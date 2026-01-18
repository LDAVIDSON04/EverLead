// Server component - critical LCP content renders immediately
import Image from "next/image";
import Link from "next/link";

export function HomeHero() {
  return (
    <>
      {/* HEADER - Server rendered for instant display */}
      <header className="bg-[#FAF9F6] py-5 px-4 relative z-30 overflow-visible">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and Name */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/Soradin.png"
                alt="Soradin Logo"
                width={80}
                height={80}
                className="h-16 w-16 md:h-20 md:w-20 object-contain"
                priority
                fetchPriority="high"
              />
              <span className="text-sm md:text-2xl font-semibold text-[#1A1A1A]">Soradin</span>
            </Link>
          </div>

          {/* Right Side Navigation - Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-[#1A1A1A] hover:text-[#0C6F3C] transition-colors">
              About Us
            </Link>
            <Link href="/what-is-pre-need-funeral-planning" className="text-[#1A1A1A] hover:text-[#0C6F3C] transition-colors">
              What are pre arrangements?
            </Link>
            <Link href="/learn-more-about-starting" className="text-[#1A1A1A] hover:text-[#0C6F3C] transition-colors">
              List your Specialty
            </Link>
            <Link href="/agent" className="bg-[#0C6F3C] text-white px-6 py-2.5 rounded-xl hover:bg-[#0C6F3C]/90 transition-all shadow-sm">
              Log in
            </Link>
          </div>
          {/* Mobile: Hamburger button will be added by client component */}
          <div id="mobile-menu-button" className="md:hidden"></div>
        </div>
      </header>

      {/* HERO - Server rendered for instant LCP */}
      <div className="relative bg-[#FAF9F6] pb-12 px-4 min-h-[calc(100vh-80px)] flex items-start md:pt-32 pt-0 md:pb-12 -mt-2 md:mt-0" style={{ overflow: 'visible' }}>
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ contentVisibility: 'auto' }}>
          <div className="absolute top-20 right-10 w-96 h-96 bg-[#0C6F3C]/10 rounded-full blur-3xl" />
        </div>

        {/* Hero illustration - desktop only, lazy loaded */}
        <div className="absolute right-10 top-10 hidden lg:block" style={{ width: "350px", aspectRatio: "1/1" }}>
          <Image
            src="/hero-image.png"
            alt="Book a specialist"
            width={350}
            height={350}
            className="w-full h-full object-contain"
            style={{ mixBlendMode: "multiply" }}
            loading="lazy"
            fetchPriority="low"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-20 w-full md:mt-0 mt-1 overflow-visible">
          {/* Headline - CRITICAL LCP ELEMENT - Server rendered */}
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-6xl text-2xl md:mb-8 mb-3 text-[#1A1A1A] font-semibold tracking-tight leading-none text-center md:text-left" style={{ paddingTop: '4px' }}>
              Book local funeral planning professionals
            </h1>

            {/* Search bar placeholder - client component will render here */}
            <div id="search-bar-container" className="relative z-30"></div>
          </div>
        </div>
      </div>
    </>
  );
}