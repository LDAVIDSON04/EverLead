"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, Calendar, Check, ChevronDown, Heart, Facebook, Instagram, Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const [specialty, setSpecialty] = useState("Funeral Pre-Planning");
  const [location, setLocation] = useState("");
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationDetecting, setLocationDetecting] = useState(false);

  // Auto-detect and pre-fill location on page load
  // DISABLED on initial load to improve Speed Index - only run on user interaction
  useEffect(() => {
    // Don't run geolocation on initial load - it blocks Speed Index
    // Location will be detected when user interacts with the search form
    return;
  }, []); // Empty dependency array - only run once on mount

  // Function to navigate to search page with detected location from IP
  const navigateToSearchWithLocation = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Always detect location from IP first, then navigate with it
    // This ensures the family's location is known before showing agents
    try {
      console.log("🔍 [HOME] Detecting family location from IP...");
      const res = await fetch("/api/geolocation");
      const data = await res.json();
      console.log("📍 [HOME] Geolocation API response:", data);
      
      if (data.location) {
        console.log("✅ [HOME] Location detected from IP:", data.location);
        // Navigate with location in URL - this will show agents in that city
        const searchUrl = `/search?location=${encodeURIComponent(data.location)}`;
        console.log("🚀 [HOME] Navigating to:", searchUrl);
        router.push(searchUrl);
      } else {
        console.warn("⚠️ [HOME] Could not detect location from IP, data:", data);
        // Navigate without location if detection fails
        router.push("/search");
      }
    } catch (err) {
      // Navigate without location if detection fails
      console.error("❌ [HOME] Error detecting location:", err);
      router.push("/search");
    }
  };

  const cities = [
    // Alberta
    "Calgary, AB",
    "Edmonton, AB",
    "Red Deer, AB",
    "Lethbridge, AB",
    "Medicine Hat, AB",
    "Grande Prairie, AB",
    "Fort McMurray, AB",
    "Airdrie, AB",
    "St. Albert, AB",
    "Leduc, AB",
    "Spruce Grove, AB",
    "Cochrane, AB",
    "Okotoks, AB",
    "Canmore, AB",
    "Banff, AB",
    // British Columbia
    "Vancouver, BC",
    "Victoria, BC",
    "Kelowna, BC",
    "Surrey, BC",
    "Burnaby, BC",
    "Richmond, BC",
    "Langley, BC",
    "Abbotsford, BC",
    "Coquitlam, BC",
    "Saanich, BC",
    "Delta, BC",
    "Kamloops, BC",
    "Nanaimo, BC",
    "Prince George, BC",
    "Chilliwack, BC",
    "Maple Ridge, BC",
    "New Westminster, BC",
    "Port Coquitlam, BC",
    "North Vancouver, BC",
    "West Vancouver, BC",
    "Penticton, BC",
    "Vernon, BC",
    "Salmon Arm, BC",
    "Courtenay, BC",
    "Campbell River, BC",
    "Duncan, BC",
    "Port Alberni, BC",
    // Saskatchewan
    "Saskatoon, SK",
    "Regina, SK",
    "Prince Albert, SK",
    "Moose Jaw, SK",
    "Swift Current, SK",
    "Yorkton, SK",
    "North Battleford, SK",
    // Manitoba
    "Winnipeg, MB",
    "Brandon, MB",
    "Steinbach, MB",
    "Thompson, MB",
    "Portage la Prairie, MB",
    // Ontario
    "Toronto, ON",
    "Ottawa, ON",
    "Mississauga, ON",
    "Brampton, ON",
    "Hamilton, ON",
    "London, ON",
    "Markham, ON",
    "Vaughan, ON",
    "Kitchener, ON",
    "Windsor, ON",
    "Richmond Hill, ON",
    "Oakville, ON",
    "Burlington, ON",
    "Oshawa, ON",
    "St. Catharines, ON",
    "Cambridge, ON",
    "Guelph, ON",
    "Barrie, ON",
    "Kingston, ON",
    "Thunder Bay, ON",
    "Sudbury, ON",
    "Sault Ste. Marie, ON",
    "North Bay, ON",
    "Timmins, ON",
    // Quebec
    "Montreal, QC",
    "Quebec City, QC",
    "Laval, QC",
    "Gatineau, QC",
    "Longueuil, QC",
    "Sherbrooke, QC",
    "Saguenay, QC",
    "Lévis, QC",
    "Trois-Rivières, QC",
    "Terrebonne, QC",
    // New Brunswick
    "Saint John, NB",
    "Moncton, NB",
    "Fredericton, NB",
    "Dieppe, NB",
    "Miramichi, NB",
    // Nova Scotia
    "Halifax, NS",
    "Dartmouth, NS",
    "Sydney, NS",
    "Truro, NS",
    "New Glasgow, NS",
    // Prince Edward Island
    "Charlottetown, PE",
    "Summerside, PE",
    // Newfoundland and Labrador
    "St. John's, NL",
    "Mount Pearl, NL",
    "Corner Brook, NL",
    "Conception Bay South, NL",
    // Yukon
    "Whitehorse, YT",
    // Northwest Territories
    "Yellowknife, NT",
    // Nunavut
    "Iqaluit, NU",
  ];

  const specialtySuggestions = [
    "Funeral Pre-Planning",
    "End of life planning",
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
    router.push(`/search?${params.toString()}`);
  };

  const handleSpecialtyChange = (value: string) => {
    setSpecialty(value);
    setShowSpecialtyDropdown(false);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    setSearchError(null); // Clear error when user types
    
    if (value.length > 0) {
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

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* HEADER */}
      <header className="bg-[#FAF9F6] py-5 px-4 relative z-30 overflow-visible">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and Name - Mobile: text next to, Desktop: original layout (text next to) */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/Soradin.png"
                alt="Soradin Logo"
                width={80}
                height={80}
                className="h-16 w-16 md:h-20 md:w-20 object-contain"
              />
              <span className="text-sm md:text-2xl font-semibold text-[#1A1A1A]">Soradin</span>
            </Link>
          </div>

          {/* Right Side Navigation - Desktop: original layout, Mobile: Hamburger menu */}
          <div className="flex items-center gap-6">
            {/* Desktop Navigation */}
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
            {/* Mobile: Hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#1A1A1A] hover:text-[#0C6F3C] transition-colors"
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
                    <div className="flex items-center gap-3">
                      <Image
                        src="/Soradin.png"
                        alt="Soradin Logo"
                        width={80}
                        height={80}
                        className="h-12 w-12 object-contain"
                      />
                      <span className="text-lg font-semibold text-[#1A1A1A]">Soradin</span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 text-[#1A1A1A] hover:text-[#0C6F3C] transition-colors"
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
                        className="px-6 py-4 bg-[#0C6F3C] text-white rounded-xl hover:bg-[#0C6F3C]/90 transition-all shadow-sm text-center text-base font-medium"
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
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-[#0C6F3C]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#D9C7A3]/30 rounded-full blur-3xl" />
        </div>

        {/* Hero illustration - positioned absolutely on the right, above title */}
        {/* Fixed aspect-ratio prevents CLS on desktop */}
        <div className="absolute right-10 top-10 hidden lg:block" style={{ width: "350px", aspectRatio: "1/1" }}>
          <Image
            src="/hero-image.png"
            alt="Book a specialist"
            width={350}
            height={350}
            className="w-full h-full object-contain"
            style={{
              mixBlendMode: "multiply",
            }}
            loading="lazy"
          />
        </div>

        {/* Arm pointing illustration - positioned to point at Find care button */}
        {/* Fixed aspect-ratio prevents CLS on desktop */}
        <div 
          className="absolute hidden lg:block z-10 pointer-events-none arm-pointing-illustration" 
          style={{ 
            width: "1500px", 
            aspectRatio: "1500/800",
            bottom: "-9vh",
            right: "-22vw",
          }}
        >
          <Image
            src="/arm-image.png"
            alt=""
            width={1500}
            height={800}
            className="w-full h-full object-contain"
            style={{
              mixBlendMode: "multiply",
              imageRendering: "-webkit-optimize-contrast",
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
            }}
            loading="lazy"
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-20 w-full md:mt-0 mt-1 overflow-visible">
          {/* Headline and Search Bar - Full Width */}
          <div className="max-w-4xl">
            <h1 className="text-6xl md:text-6xl text-2xl md:mb-8 mb-3 text-[#1A1A1A] font-semibold tracking-tight leading-none text-left" style={{ paddingTop: '4px' }}>
              Book local funeral planning professionals
            </h1>

            {/* Horizontal search bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 shadow-lg border border-[#1A1A1A]/5 relative z-30 md:mb-8 mb-4">
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
                      placeholder="Enter city here"
                      className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 relative z-10"
                      value={location}
                      onChange={handleLocationChange}
                      onFocus={() => {
                        if (location.length > 0) {
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
                    className="w-full lg:w-auto bg-[#0C6F3C] text-white px-8 py-3 rounded-xl hover:bg-[#0C6F3C]/90 transition-all shadow-sm"
                  >
                    Find care
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          {/* Mobile Only: Pre-Need Planning Box */}
          <div className="md:hidden mt-4">
            <div className="bg-[#FAF9F6] rounded-3xl p-6 border border-[#1A1A1A]/5 relative overflow-hidden group hover:shadow-xl hover:shadow-black/5 transition-all flex flex-col">
              {/* Image inside the card, showing full torso */}
              <div className="relative w-full flex items-center justify-center -mx-6 mb-2 overflow-hidden" style={{ height: '150px', minHeight: '150px', marginTop: '-72px', paddingTop: '0' }}>
                <Image
                  src="/What is Pre need planning image.png"
                  alt="Person asking about pre-need planning"
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                  style={{
                    filter: "brightness(1.1) contrast(1.05)",
                    mixBlendMode: "multiply",
                    objectPosition: 'top center',
                  }}
                  loading="lazy"
                  fetchPriority="low"
                />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center -mt-1">
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-1">
                  What are pre arrangements?
                </h3>
                <p className="text-sm text-[#1A1A1A]/70 mb-3">
                  Learn more about pre needs and how they help you plan ahead
                </p>
                <Link 
                  href="/what-is-pre-need-funeral-planning"
                  className="text-[#0C6F3C] hover:text-[#0C6F3C]/80 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  Learn more
                  <ChevronRight className="w-4 h-4" />
                </Link>
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

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Left Box - Read Reviews */}
            <div className="bg-[#FAF9F6] rounded-3xl p-6 border border-[#1A1A1A]/5 relative overflow-visible group hover:shadow-xl hover:shadow-black/5 transition-all flex flex-col">
              {/* Image overlapping the top */}
              <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-96 h-96 flex items-center justify-center" style={{ aspectRatio: "1/1" }}>
                <Image
                  src="/review-image.png"
                  alt="Person holding review card"
                  width={384}
                  height={384}
                  className="w-full h-full object-contain"
                  style={{
                    filter: "brightness(1.1) contrast(1.05)",
                    mixBlendMode: "multiply",
                  }}
                  loading="lazy"
                  fetchPriority="low"
                />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center mt-20">
                <h3 className="text-xl mb-2 text-[#1A1A1A] font-semibold">
                  Read reviews from families
                </h3>
                <p className="text-[#1A1A1A]/60 text-sm leading-relaxed mb-4">
                  Discover what families are saying about specialists in your area
                </p>
                <button 
                  onClick={navigateToSearchWithLocation}
                  className="bg-[#0C6F3C] text-white px-5 py-2.5 rounded-xl hover:bg-[#0C6F3C]/90 transition-all shadow-sm text-sm"
                >
                  See reviews
                </button>
              </div>
            </div>

            {/* Right Box - Book Appointment */}
            <div className="bg-[#FAF9F6] rounded-3xl p-6 border border-[#1A1A1A]/5 relative overflow-visible group hover:shadow-xl hover:shadow-black/5 transition-all flex flex-col">
              {/* Image overlapping the top */}
              <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-96 h-96 flex items-center justify-center" style={{ aspectRatio: "1/1" }}>
                <Image
                  src="/booking-image.png"
                  alt="Person holding book now sign"
                  width={384}
                  height={384}
                  className="w-full h-full object-contain"
                  style={{
                    filter: "brightness(1.1) contrast(1.05)",
                    mixBlendMode: "multiply",
                  }}
                  loading="lazy"
                  fetchPriority="low"
                />
              </div>

              <div className="relative z-10 flex flex-col items-center text-center mt-20">
                <h3 className="text-xl mb-2 text-[#1A1A1A] font-semibold">
                  Book an appointment today
                </h3>
                <p className="text-[#1A1A1A]/60 text-sm leading-relaxed mb-4">
                  Schedule consultations with trusted funeral specialists online
                </p>
                <button 
                  onClick={navigateToSearchWithLocation}
                  className="bg-[#0C6F3C] text-white px-5 py-2.5 rounded-xl hover:bg-[#0C6F3C]/90 transition-all shadow-sm text-sm"
                >
                  See availability
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR SPECIALISTS SECTION */}
      <section className="py-24 px-4 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-12 items-center">
            {/* Left side - Image - Remove priority (below fold, 6.7MB hurts mobile LCP) */}
            <div className="relative w-full" style={{ aspectRatio: "900/700" }}>
              <Image
                src="/specialist-image.jpg"
                alt="Professional funeral specialist"
                width={900}
                height={700}
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
                fetchPriority="low"
              />
            </div>

            {/* Right side - Content */}
            <div>
              <h2 className="text-5xl mb-6 text-[#1A1A1A] font-semibold tracking-tight">
                Soradin for Specialists
              </h2>

              <p className="text-2xl text-[#1A1A1A]/80 mb-8 leading-relaxed">
                Are you interested in filling out your calendar?
              </p>

              <div className="space-y-5 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#0C6F3C] flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl text-[#1A1A1A]/70">
                    Reach thousands of families with Soradin
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#0C6F3C] flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl text-[#1A1A1A]/70">
                    Make it easy for families to book with you
                  </p>
                </div>
              </div>

              <div>
                <Link 
                  href="/learn-more-about-starting"
                  className="inline-block bg-[#0C6F3C] text-white px-8 py-4 rounded-2xl hover:bg-[#0C6F3C]/90 transition-all text-lg shadow-sm"
                >
                  Learn more about starting with us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED PARTNERS */}
      <section className="py-24 px-4 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Image (mobile first, desktop right) - Fixed aspect-ratio prevents CLS */}
            <div className="relative w-full order-1 lg:order-2" style={{ aspectRatio: "800/600" }}>
              <Image
                src="/estate-planning-image.webp"
                alt="Estate planning professionals"
                width={800}
                height={600}
                className="w-full h-full object-contain rounded-xl"
                style={{
                  filter: "brightness(1.05) contrast(1.05)",
                  mixBlendMode: "multiply",
                }}
                loading="lazy"
                fetchPriority="low"
              />
            </div>
            {/* Right side - Content (mobile second, desktop left) */}
            <div className="order-2 lg:order-1 text-center">
              <h2 className="text-5xl mb-6 text-[#1A1A1A] font-semibold tracking-tight leading-tight">
                Built with professional standards in mind
              </h2>
              <p className="text-xl text-[#1A1A1A]/70 leading-relaxed mb-8">
                Soradin is designed to support thoughtful, ethical estate planning prioritizing clarity, consent, and family peace of mind.
              </p>
              <button 
                onClick={navigateToSearchWithLocation}
                className="bg-[#0C6F3C] text-white px-8 py-4 rounded-xl hover:bg-[#0C6F3C]/90 transition-all shadow-sm text-lg"
              >
                Find care
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CITIES LIST */}
      <section className="py-24 px-4 bg-[#D9C7A3]/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl mb-12 text-[#1A1A1A] font-medium tracking-tight">
            Find funeral professionals near you
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {["Calgary", "Edmonton", "Kelowna", "Penticton", "Salmon Arm"].map((city) => (
              <Link
                key={city}
                href={`/search?location=${city}`}
                className="bg-transparent border-b-2 border-[#1A1A1A]/20 hover:border-[#0C6F3C] py-4 text-left transition-all group flex items-center justify-between"
              >
                <span className="text-[#1A1A1A] text-lg group-hover:text-[#0C6F3C] transition-colors">
                  {city}
                </span>
                <ChevronDown className="w-5 h-5 text-[#1A1A1A]/40 group-hover:text-[#0C6F3C] transition-colors" />
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

              {/* Column 4 - Services */}
              <div>
                <h4 className="mb-6 text-lg font-medium">Services</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Funeral pre-planning
                    </Link>
                  </li>
                  <li>
                    <span className="text-white/60">
                      Estate Planning Lawyer <span className="text-white/40 text-sm">(coming soon)</span>
                    </span>
                  </li>
                  <li>
                    <span className="text-white/60">
                      Insurance Agents <span className="text-white/40 text-sm">(coming soon)</span>
                    </span>
                  </li>
                  <li>
                    <span className="text-white/60">
                      Financial Advisors <span className="text-white/40 text-sm">(coming soon)</span>
                    </span>
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
