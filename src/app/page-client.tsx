"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, Calendar, Check, ChevronDown, Heart, Facebook, Instagram, Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
// Major BC cities for the "Find funeral professionals near you" section (12 cities max)
const majorBCCities = [
  "Vancouver, BC",
  "Victoria, BC",
  "Kelowna, BC",
  "Surrey, BC",
  "Burnaby, BC",
  "Richmond, BC",
  "Abbotsford, BC",
  "Kamloops, BC",
  "Nanaimo, BC",
  "Prince George, BC",
  "Chilliwack, BC",
  "Penticton, BC",
];

import { cities } from "@/lib/cities";

interface HomePageClientProps {
  initialLocation: string;
}

export default function HomePageClient({ initialLocation }: HomePageClientProps) {
  const router = useRouter();
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState(initialLocation);
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const citiesRef = useRef<string[] | null>(null);

  // Rotating text for hero title - deferred for mobile performance
  const rotatingTexts = [
    "Funeral Pre Planners",
    "Estate Lawyers",
    "Life Insurance Brokers",
    "Financial Planners",
  ];
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Defer rotating text animation until after initial render to improve FCP/LCP
  // Use longer delay on mobile to prioritize critical rendering
  useEffect(() => {
    // Use requestIdleCallback if available, otherwise setTimeout with longer delay
    const scheduleAnimation = (callback: () => void) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(callback, { timeout: 3000 });
      } else {
        // Longer delay on mobile to ensure FCP/LCP complete first
        const isMobile = typeof window !== 'undefined' && (window as Window).innerWidth < 768;
        setTimeout(callback, isMobile ? 3000 : 2000);
      }
    };

    let interval: NodeJS.Timeout | null = null;
    
    scheduleAnimation(() => {
      interval = setInterval(() => {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentTextIndex((prevIndex) => (prevIndex + 1) % rotatingTexts.length);
          setIsVisible(true);
        }, 250);
      }, 3000);
    });

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rotatingTexts.length]);

  const specialtySuggestions = [
    "Funeral Pre Planner",
    "Estate Lawyer",
    "Life Insurance Broker",
    "Financial Planner",
  ];

  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Require location for search
    if (!location || location.trim() === "") {
      setSearchError("Please enter a location to search");
      return;
    }
    
    setSearchError(null);
    const params = new URLSearchParams();
    if (specialty) params.set("q", specialty);
    params.set("location", location);
    router.push(`/search/choose?${params.toString()}`);
  };

  const handleSpecialtyChange = (value: string) => {
    setSpecialty(value);
    setShowSpecialtyDropdown(false);
  };

  // Lazy load cities array only when needed
  const getCities = async (): Promise<string[]> => {
    if (citiesRef.current) {
      return citiesRef.current;
    }
    // Dynamically import cities to reduce initial bundle size
    const { cities } = await import('@/lib/cities');
    citiesRef.current = cities;
    return cities;
  };

  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    setSearchError(null); // Clear error when user types
    
    if (value.length > 0) {
      const cities = await getCities();
      const filtered = cities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
      );
      setLocationSuggestions(filtered);
      setShowLocationDropdown(true);
    } else {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
    }
  };

  const handleLocationSelect = (city: string) => {
    setLocation(city);
    setShowLocationDropdown(false);
    setLocationSuggestions([]);
  };

  // Function to navigate to search page with detected location from IP
  // (Only used for buttons - search bar remains blank for manual input)
  const navigateToSearchWithLocation = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Detect location from IP, then navigate with it
    try {
      const res = await fetch("/api/geolocation");
      const data = await res.json();
      
      if (data.location) {
        const searchUrl = `/search/choose?location=${encodeURIComponent(data.location)}`;
        router.push(searchUrl);
      } else {
        router.push("/search");
      }
    } catch (err) {
      router.push("/search");
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* HEADER */}
      <header className="bg-[#FAF9F6] py-5 px-4 relative z-30 overflow-visible">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and Name - not clickable, same font as nav */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 cursor-default">
              <Image
                src="/Soradin.png"
                alt="Soradin Logo"
                width={80}
                height={80}
                className="h-16 w-16 md:h-20 md:w-20 object-contain"
                priority
                fetchPriority="high"
                sizes="(max-width: 768px) 64px, 80px"
              />
              <span className="text-sm md:text-lg font-medium text-[#1A1A1A]">Soradin - Estate Planning, Simplified</span>
            </div>
          </div>

          {/* Right Side Navigation - Desktop: original layout, Mobile: Hamburger menu */}
          <div className="flex items-center gap-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-10">
              <Link href="/about" className="text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors text-lg font-medium">
                About Us
              </Link>
              <Link href="/help" className="text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors text-lg font-medium">
                Help
              </Link>
              <Link href="/learn-more-about-starting" className="text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors text-lg font-medium">
                List Your Specialty With Soradin
              </Link>
              <Link href="/agent" className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm">
                Log in
              </Link>
            </div>
            {/* Mobile: Hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Overlay - Full Page Sheet */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu Sheet - Cropped to content */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-[#FAF9F6] z-50 rounded-b-3xl shadow-2xl">
              <div className="flex flex-col">
                {/* Header */}
                <div className="px-4 py-5 bg-[#FAF9F6]">
                  <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 cursor-default">
                      <Image
                        src="/Soradin.png"
                        alt="Soradin Logo"
                        width={80}
                        height={80}
                        className="h-12 w-12 object-contain"
                      />
                      <span className="text-base font-medium text-[#1A1A1A]">Soradin - Estate Planning, Simplified</span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                {/* Menu Content */}
                <div className="px-4 pb-8">
                  <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <h2 className="text-3xl font-bold text-[#1A1A1A] mb-8 text-center">
                      Welcome to Soradin
                    </h2>
                    <div className="w-full max-w-sm flex flex-col gap-4">
                      <Link 
                        href="/learn-more-about-starting" 
                        className="px-6 py-4 bg-[#1A1A1A] text-white rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm text-center text-base font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Create account
                      </Link>
                      <Link 
                        href="/agent" 
                        className="px-6 py-4 bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] rounded-xl hover:bg-[#FAF9F6] transition-all text-center text-base font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log in
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* HERO */}
      <div className="relative bg-[#FAF9F6] pb-12 px-4 min-h-[calc(100vh-80px)] flex items-start md:pt-32 pt-0 md:pb-12 -mt-2 md:mt-0" style={{ overflow: 'visible' }}>
        {/* Abstract background shapes - deferred to prevent blocking initial render */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ contentVisibility: 'auto', contain: 'layout style paint' }}>
          <div className="absolute top-20 right-10 w-96 h-96 bg-[#1A1A1A]/10 rounded-full blur-3xl" style={{ willChange: 'auto' }} />
        </div>

        {/* Hero illustration - positioned absolutely on the right, above title */}
        <div className="absolute right-10 top-10 hidden lg:block" style={{ width: "500px", height: "500px" }}>
          <Image
            src="/hero-image.png"
            alt="Book a specialist"
            width={500}
            height={500}
            className="w-full h-full object-contain"
            style={{
              mixBlendMode: "multiply",
              background: "transparent",
            }}
            loading="eager"
            fetchPriority="high"
            sizes="500px"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-20 w-full md:mt-0 mt-1 overflow-visible">
          {/* Headline and Search Bar - Full Width */}
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-6xl text-2xl md:mb-8 mb-14 text-[#1A1A1A] font-semibold tracking-tight leading-none text-center md:text-left" style={{ paddingTop: '4px' }}>
              {/* "Book Local" fixed + rotating (same on mobile and desktop so search bar doesn't move) */}
              <span className="block">Book Local</span>
              <span className="block relative" style={{ minHeight: '1.2em', height: '1.2em' }}>
                <span
                  className={`absolute left-0 top-0 transition-opacity duration-500 ease-in-out text-center md:text-left w-full md:w-auto ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {rotatingTexts[currentTextIndex]}
                </span>
                <span className="invisible block text-center md:text-left">{rotatingTexts.reduce((a, b) => a.length > b.length ? a : b)}</span>
              </span>
            </h1>

            {/* Horizontal search bar - sticky on mobile so it doesn't move when scrolling */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 shadow-lg border border-[#1A1A1A]/5 relative z-30 md:mb-8 mb-4 flex-shrink-0">
              <div className="flex flex-col lg:flex-row items-stretch gap-0">
                {/* Search field */}
                <div className="flex-1 relative border-b border-[#1A1A1A]/10 lg:border-b-0 lg:border-r lg:border-[#1A1A1A]/10">
                  <label className="absolute left-4 top-2 text-xs text-[#1A1A1A]/60">Search</label>
                  <div className="relative pt-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/40 z-10" />
                    <input
                      type="text"
                      placeholder="Service or specialist"
                      className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 relative z-10"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      onFocus={() => setShowSpecialtyDropdown(true)}
                      onBlur={() => {
                        // Delay to allow clicking on dropdown
                        setTimeout(() => setShowSpecialtyDropdown(false), 200);
                      }}
                    />
                    {/* Specialty Dropdown */}
                    {showSpecialtyDropdown && (
                      <div 
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div className="p-2">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2">
                            Popular specialties
                          </div>
                          {specialtySuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSpecialtyChange(suggestion);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-[#1A1A1A]"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location field */}
                <div className="flex-1 relative border-b border-[#1A1A1A]/10 lg:border-b-0 lg:border-r lg:border-[#1A1A1A]/10 lg:pr-2">
                  <label className="absolute left-4 top-2 text-xs text-[#1A1A1A]/60">Location</label>
                  <div className="relative pt-6">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/40 z-10" />
                    <input
                      type="text"
                      placeholder="Location"
                      className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 relative z-10"
                      value={location}
                      onChange={handleLocationChange}
                      onFocus={async () => {
                        if (location.length > 0) {
                          const cities = await getCities();
                          const filtered = cities.filter(city => 
                            city.toLowerCase().includes(location.toLowerCase())
                          );
                          setLocationSuggestions(filtered);
                          setShowLocationDropdown(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow clicking on dropdown
                        setTimeout(() => setShowLocationDropdown(false), 200);
                      }}
                    />
                    {/* Modern popup below location box */}
                    {searchError && (
                      <div className="absolute top-full left-0 right-0 mt-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-lg p-3 backdrop-blur-sm">
                          <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Please enter a location
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Location Autocomplete Dropdown */}
                    {showLocationDropdown && locationSuggestions.length > 0 && (
                      <div 
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div className="p-2">
                          {locationSuggestions.map((city, index) => (
                            <button
                              key={index}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleLocationSelect(city);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-[#1A1A1A]"
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Button */}
                <div className="flex items-center lg:pl-2">
                  <button
                    type="submit"
                    className="w-full lg:w-auto bg-[#1A1A1A] text-white px-8 py-3 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm"
                  >
                    Find care
                  </button>
                </div>
              </div>
            </form>

            {/* Mobile Only: How it Works Section */}
            <div className="md:hidden mt-6 mb-6">
              {/* Top row: Two cards side by side */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Step 1 - Find Local Experts */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center mb-2">
                    <Search className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1A1A1A] mb-1">Find Local Experts</h3>
                  <p className="text-xs text-[#1A1A1A]/70 leading-tight">
                    Browse verified professionals in your community.
                  </p>
                </div>

                {/* Step 2 - Compare at Your Pace */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center mb-2">
                    <Calendar className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1A1A1A] mb-1">Compare at Your Pace</h3>
                  <p className="text-xs text-[#1A1A1A]/70 leading-tight">
                    Review profiles, specialties, and real availability.
                  </p>
                </div>
              </div>

              {/* Bottom row: Book with Confidence centered */}
              <div className="flex justify-center">
                <div className="flex flex-col items-center text-center max-w-[calc(50%-0.5rem)]">
                  <div className="w-12 h-12 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center mb-2">
                    <Check className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#1A1A1A] mb-1">Book with Confidence</h3>
                  <p className="text-xs text-[#1A1A1A]/70 leading-tight">
                    Schedule a free appointment on your terms.
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Only: How it Works Section */}
            <div className="hidden md:flex items-center justify-center gap-8 mt-12 mb-8 max-w-4xl">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center flex-1">
                <div className="w-16 h-16 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Find Local Experts</h3>
                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
                  Browse verified professionals in your community.
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-6 h-6 text-[#1A1A1A]/30 flex-shrink-0" />

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center flex-1">
                <div className="w-16 h-16 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Compare at Your Pace</h3>
                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
                  Review profiles, specialties, and real availability.
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-6 h-6 text-[#1A1A1A]/30 flex-shrink-0" />

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center flex-1">
                <div className="w-16 h-16 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">Book with Confidence</h3>
                <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
                  Schedule a free appointment on your terms.
                </p>
              </div>
            </div>
      </div>
    </div>
  </div>

      {/* TWO BOXES SECTION */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl mb-16 text-[#1A1A1A] font-semibold tracking-tight text-center">
            Let&apos;s connect you with the right person
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* First Card - Browse your options */}
            <div className="bg-[#FAF9F6] rounded-3xl p-6 border border-[#1A1A1A]/5 relative overflow-visible group flex flex-col transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1">
              {/* Reserved space for image to prevent CLS */}
              <div className="w-full h-12 flex-shrink-0" aria-hidden="true" />
              {/* Image overlapping the top - bg stripped by scripts/remove-browse-card-bg.mjs */}
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-56 h-56 flex items-center justify-center" style={{ aspectRatio: "1/1" }}>
                <Image
                  src="/browse-card-image.png"
                  alt="Start planning today with Soradin"
                  width={224}
                  height={224}
                  className="w-full h-full object-contain"
                  style={{
                    filter: "brightness(1.1) contrast(1.05)",
                  }}
                  loading="lazy"
                  fetchPriority="low"
                  sizes="(max-width: 768px) 100vw, 224px"
                />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <h3 className="text-xl mb-2 text-[#1A1A1A] font-semibold">
                  Browse your options
                </h3>
                <p className="text-[#1A1A1A]/60 text-sm leading-relaxed mb-4">
                  Compare up to 4 specialists on Soradin and book with the ones that fit you best
                </p>
                <button 
                  onClick={navigateToSearchWithLocation}
                  className="bg-[#1A1A1A] text-white px-5 py-2.5 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm text-sm"
                >
                  Browse specialists
                </button>
              </div>
            </div>

            {/* Second Card - Read Reviews */}
            <div className="bg-[#FAF9F6] rounded-3xl p-6 border border-[#1A1A1A]/5 relative overflow-visible group flex flex-col transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1">
              {/* Reserved space for image to prevent CLS */}
              <div className="w-full h-12 flex-shrink-0" aria-hidden="true" />
              {/* Image overlapping the top */}
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-56 h-56 flex items-center justify-center" style={{ aspectRatio: "1/1" }}>
              <Image
                src="/review-image.png"
                alt="Person holding review card"
                width={224}
                height={224}
                className="w-full h-full object-contain"
                style={{
                  filter: "brightness(1.1) contrast(1.05)",
                  mixBlendMode: "multiply",
                }}
                loading="lazy"
                fetchPriority="low"
                sizes="(max-width: 768px) 100vw, 224px"
              />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <h3 className="text-xl mb-2 text-[#1A1A1A] font-semibold">
                  Read reviews from families
                </h3>
                <p className="text-[#1A1A1A]/60 text-sm leading-relaxed mb-4">
                  Discover what families are saying about specialists in your area
                </p>
                <button 
                  onClick={navigateToSearchWithLocation}
                  className="bg-[#1A1A1A] text-white px-5 py-2.5 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm text-sm"
                >
                  See reviews
                </button>
              </div>
            </div>

            {/* Third Card - Book Appointment */}
            <div className="bg-[#FAF9F6] rounded-3xl p-6 border border-[#1A1A1A]/5 relative overflow-visible group flex flex-col transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1">
              {/* Reserved space for image to prevent CLS */}
              <div className="w-full h-12 flex-shrink-0" aria-hidden="true" />
              {/* Image overlapping the top */}
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-56 h-56 flex items-center justify-center" style={{ aspectRatio: "1/1" }}>
                <Image
                  src="/booking-image.png"
                  alt="Person holding book now sign"
                  width={224}
                  height={224}
                  className="w-full h-full object-contain"
                  style={{
                    filter: "brightness(1.1) contrast(1.05)",
                    mixBlendMode: "multiply",
                  }}
                  loading="lazy"
                  fetchPriority="low"
                  sizes="(max-width: 768px) 100vw, 224px"
                />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center">
                <h3 className="text-xl mb-2 text-[#1A1A1A] font-semibold">
                  Book an appointment today
                </h3>
                <p className="text-[#1A1A1A]/60 text-sm leading-relaxed mb-4">
                  Schedule consultations with trusted funeral specialists online
                </p>
                <button 
                  onClick={navigateToSearchWithLocation}
                  className="bg-[#1A1A1A] text-white px-5 py-2.5 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm text-sm"
                >
                  See availability
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-arrangements – card left, image right (Empathy-style) */}
      <section className="bg-[#FAF9F6] py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 min-h-[min(80vh,640px)] md:min-h-[560px] gap-0 overflow-hidden rounded-2xl shadow-lg md:shadow-xl">
          {/* Left: card */}
          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-white rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none order-2 md:order-1">
            <p className="text-sm font-medium text-[#1A1A1A]/60 uppercase tracking-wider mb-2">Planning ahead</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#1A1A1A] tracking-tight mb-4 md:mb-6">
              Estate Planning
            </h2>
            <p className="text-base md:text-lg text-[#1A1A1A]/70 leading-relaxed mb-6 md:mb-8 max-w-lg">
              From wills and funeral planning to life insurance and financial advice, we connect you with trusted specialists to help you and your family prepare with clarity and confidence.
            </p>
            <Link
              href="/what-is-pre-need-funeral-planning"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90 transition-all shrink-0 text-sm font-medium"
              aria-label="Learn more about Planning ahead"
            >
              <span>Learn more about Planning ahead</span>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </Link>
          </div>
          {/* Right: image with rounded edges */}
          <div className="relative w-full min-h-[50vh] md:min-h-full rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none overflow-hidden order-1 md:order-2">
            <Image
              src="/pre-arrangements-image.png"
              alt="Estate planning"
              fill
              className="object-cover object-center"
              loading="lazy"
              fetchPriority="low"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* FOR SPECIALISTS SECTION */}
      <section className="py-8 md:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-6 md:gap-12 items-center">
            {/* Left side - Image - Using PNG version (722K) instead of JPG (6.7MB) for better performance */}
            <div className="relative w-full md:min-h-[400px]" style={{ aspectRatio: "900/700", minHeight: "250px" }}>
              <Image
                src="/specialist-image.jpg"
                alt="Professional funeral specialist"
                width={900}
                height={700}
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
                fetchPriority="low"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 900px"
              />
            </div>

            {/* Right side - Content */}
            <div className="w-full">
              <h2 className="text-2xl md:text-5xl mb-3 md:mb-6 text-[#1A1A1A] font-semibold tracking-tight break-words">
                Soradin for Specialists
              </h2>

              <p className="text-base md:text-2xl text-[#1A1A1A]/80 mb-4 md:mb-8 leading-relaxed break-words">
                Are you interested in filling out your calendar?
              </p>

              <div className="space-y-3 md:space-y-5 mb-4 md:mb-10">
                <div className="flex items-start gap-2 md:gap-4">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-2.5 h-2.5 md:w-4 md:h-4 text-white" />
                  </div>
                  <p className="text-sm md:text-xl text-[#1A1A1A]/70 break-words flex-1">
                    Reach thousands of families with Soradin
                  </p>
                </div>

                <div className="flex items-start gap-2 md:gap-4">
                  <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-2.5 h-2.5 md:w-4 md:h-4 text-white" />
                  </div>
                  <p className="text-sm md:text-xl text-[#1A1A1A]/70 break-words flex-1">
                    Make it easy for families to book with you
                  </p>
                </div>
              </div>

              <div>
                <Link 
                  href="/learn-more-about-starting"
                  className="inline-block bg-[#1A1A1A] text-white px-5 py-2.5 md:px-8 md:py-4 rounded-2xl hover:bg-[#1A1A1A]/90 transition-all text-sm md:text-lg shadow-sm w-full md:w-auto text-center"
                >
                  Learn more about starting with us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED PARTNERS - dark green like empathy.com */}
      <section className="py-24 px-4 bg-[#234a3d]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 flex flex-col items-center text-center">
              <h2 className="text-5xl mb-6 text-white font-semibold tracking-tight leading-tight">
                Trusted by agents from top funeral homes
              </h2>
              <p className="text-xl text-white/85 leading-relaxed mb-8 max-w-xl">
                Funeral professionals across British Columbia rely on Soradin to connect with families and grow their practice with confidence.
              </p>
              <button 
                onClick={navigateToSearchWithLocation}
                className="bg-white text-[#234a3d] px-8 py-4 rounded-xl hover:bg-white/90 transition-all shadow-sm text-lg font-medium"
              >
                Find care
              </button>
            </div>
            <div className="relative w-full order-1 lg:order-2 flex items-center justify-center h-full">
              <div className="flex flex-col gap-12 w-full items-center justify-center">
                <div className="flex items-center justify-center gap-8 md:gap-10">
                  <Image
                    src="/trusted-agent-1.png"
                    alt="Funeral professional"
                    width={200}
                    height={200}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/30 shadow-lg"
                    loading="lazy"
                    fetchPriority="low"
                    sizes="(max-width: 768px) 128px, 160px"
                  />
                  <Image
                    src="/trusted-agent-2.png"
                    alt="Funeral professional"
                    width={200}
                    height={200}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/30 shadow-lg"
                    loading="lazy"
                    fetchPriority="low"
                    sizes="(max-width: 768px) 128px, 160px"
                  />
                  <Image
                    src="/trusted-agent-3.png"
                    alt="Funeral professional"
                    width={200}
                    height={200}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/30 shadow-lg"
                    loading="lazy"
                    fetchPriority="low"
                    sizes="(max-width: 768px) 128px, 160px"
                  />
                </div>
                <div className="flex items-center justify-center gap-8 md:gap-10">
                  <Image
                    src="/trusted-agent-4.png"
                    alt="Funeral professional"
                    width={200}
                    height={200}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/30 shadow-lg"
                    loading="lazy"
                    fetchPriority="low"
                    sizes="(max-width: 768px) 128px, 160px"
                  />
                  <Image
                    src="/trusted-agent-5.png"
                    alt="Funeral professional"
                    width={200}
                    height={200}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/30 shadow-lg"
                    loading="lazy"
                    fetchPriority="low"
                    sizes="(max-width: 768px) 128px, 160px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CITIES LIST - dark green like empathy.com */}
      <section className="py-24 px-4 bg-[#234a3d]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl mb-12 text-white font-medium tracking-tight">
            Find funeral professionals near you
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {majorBCCities.map((city) => (
              <Link
                key={city}
                href={`/search/choose?location=${encodeURIComponent(city)}`}
                className="bg-transparent border-b-2 border-white/30 hover:border-white py-4 text-left transition-all group flex items-center justify-between"
              >
                <span className="text-white text-lg group-hover:text-white transition-colors">
                  {city}
                </span>
                <ChevronDown className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1A1A1A] text-white">
        {/* Main Footer */}
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
                <h4 className="mb-6 text-lg font-medium">Are you a funeral specialist?</h4>
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
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
