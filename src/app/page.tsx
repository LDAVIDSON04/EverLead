"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, FileText, Star, Calendar, Check, ChevronDown, Heart, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [service, setService] = useState("");

  const cities = ["Calgary", "Edmonton", "Kelowna", "Penticton", "Salmon Arm"];

  const handleSearch = () => {
    // Search functionality can be implemented later
    console.log("Searching for:", { specialty, location, service });
  };

  return (
    <main className="min-h-screen bg-[#FFFBDF]">
      {/* HEADER */}
      <header className="bg-[#FFFBDF] py-5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and Name */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo - white.png"
              alt="Soradin Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="text-2xl font-semibold text-black">Soradin</span>
          </Link>

          {/* Right Side Navigation */}
          <div className="flex items-center gap-6">
            <button className="text-black hover:text-[#30382F] transition-colors">
              List your Specialty
            </button>
            <button className="bg-[#30382F] text-white px-6 py-2.5 rounded-xl hover:bg-[#30382F]/90 transition-all shadow-sm">
              Log in
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="relative bg-[#FFFBDF] py-20 px-4 overflow-hidden min-h-[calc(100vh-80px)] flex items-center">
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-[#30382F]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#30382F]/20 rounded-full blur-3xl" />
        </div>

        {/* Illustration - positioned absolutely on the right */}
        <div className="absolute right-0 top-12 hidden lg:block opacity-20">
          <div className="relative w-96">
            {/* Abstract illustration inspired by Zocdoc's hands */}
            <div className="relative">
              {/* Left hand with card */}
              <div className="absolute left-0 top-8 w-48 h-56 rotate-6">
                <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Hand shape */}
                  <path
                    d="M100 180 C80 190, 60 180, 50 160 L40 120 L50 100 L60 90 L70 100 L75 110 L80 100 L85 90 L90 100 L95 110 L100 100 L105 90 L110 100 L120 120 Z"
                    fill="#30382F"
                    opacity="0.3"
                  />
                  {/* Card */}
                  <rect x="80" y="40" width="80" height="50" rx="4" fill="white" stroke="#30382F" strokeWidth="2" />
                  <rect x="88" y="52" width="24" height="4" rx="2" fill="#30382F" opacity="0.3" />
                  <rect x="88" y="62" width="40" height="3" rx="1.5" fill="#30382F" opacity="0.2" />
                  <rect x="88" y="70" width="32" height="3" rx="1.5" fill="#30382F" opacity="0.2" />
                  {/* Plus symbol */}
                  <circle cx="144" cy="65" r="12" fill="#30382F" />
                  <path d="M144 60 L144 70 M139 65 L149 65" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Right hand pointing */}
              <div className="absolute right-0 top-0 w-52 h-60 -rotate-6">
                <svg viewBox="0 0 220 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Hand shape - pointing */}
                  <path
                    d="M80 120 L90 80 L100 70 L110 75 L115 90 L120 100 L130 90 L140 95 L145 110 L150 120 L155 140 L150 160 L140 180 L120 190 L100 185 L85 170 L78 150 Z"
                    fill="#30382F"
                    opacity="0.3"
                  />
                  {/* Accent rectangle */}
                  <rect
                    x="160"
                    y="10"
                    width="40"
                    height="100"
                    rx="4"
                    fill="#30382F"
                    opacity="0.3"
                    transform="rotate(25 180 60)"
                  />
                </svg>
              </div>

              {/* Background circle */}
              <div className="w-80 h-80 rounded-full bg-gradient-to-br from-[#30382F]/20 to-transparent" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          {/* Headline and Search Bar - Full Width */}
          <div className="max-w-4xl">
            <h1 className="text-6xl mb-8 text-black font-semibold tracking-tight leading-tight">
              Book local funeral specialists
            </h1>

            {/* Horizontal search bar */}
            <div className="bg-white rounded-2xl p-3 shadow-lg border border-black/5">
              <div className="flex flex-col lg:flex-row items-stretch gap-0">
                {/* Search field */}
                <div className="flex-1 relative border-b border-black/10 lg:border-b-0 lg:border-r lg:border-black/10">
                  <label className="absolute left-4 top-2 text-xs text-black/60">Search</label>
                  <div className="relative pt-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                    <input
                      type="text"
                      placeholder="Service or specialist"
                      className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none text-black placeholder:text-black/40"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                    />
                  </div>
                </div>

                {/* Location field */}
                <div className="flex-1 relative border-b border-black/10 lg:border-b-0 lg:border-r lg:border-black/10">
                  <label className="absolute left-4 top-2 text-xs text-black/60">Location</label>
                  <div className="relative pt-6">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                    <input
                      type="text"
                      placeholder="City, state, or zip"
                      className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none text-black placeholder:text-black/40"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* Service Type field */}
                <div className="flex-1 relative">
                  <label className="absolute left-4 top-2 text-xs text-black/60">Service Type</label>
                  <div className="relative pt-6">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                    <input
                      type="text"
                      placeholder="Any service"
                      className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:outline-none text-black placeholder:text-black/40"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                    />
                  </div>
                </div>

                {/* Button */}
                <div className="flex items-center lg:pl-2">
                  <button
                    onClick={handleSearch}
                    className="w-full lg:w-auto bg-[#30382F] text-white px-8 py-3 rounded-xl hover:bg-[#30382F]/90 transition-all shadow-sm"
                  >
                    Find care
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TWO BOXES SECTION */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl mb-16 text-black font-semibold tracking-tight text-center">
            Let&apos;s connect you with the right specialist
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Box - Read Reviews */}
            <div className="bg-[#FFFBDF] rounded-3xl p-12 border border-black/5 relative overflow-hidden group hover:shadow-xl hover:shadow-black/5 transition-all">
              {/* Illustration element built into the box */}
              <div className="absolute -bottom-8 -right-8 w-48 h-48 opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 rounded-full bg-[#30382F]/30" />
                  <div className="absolute top-8 left-8 w-32 h-32 rounded-lg bg-white flex items-center justify-center rotate-12">
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#30382F] text-[#30382F]" opacity="0.5" />
                        ))}
                      </div>
                      <div className="h-2 bg-black/10 rounded" />
                      <div className="h-2 bg-black/10 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-[#30382F]/10 flex items-center justify-center mb-6">
                  <Star className="w-8 h-8 text-[#30382F]" />
                </div>
                <h3 className="text-3xl mb-4 text-black font-semibold">Read reviews from families</h3>
                <p className="text-black/60 text-lg leading-relaxed mb-8">
                  Discover what families are saying about specialists in your area
                </p>
                <button className="bg-white text-black px-6 py-3 rounded-xl hover:bg-[#30382F]/5 transition-all border border-black/10">
                  See reviews
                </button>
              </div>
            </div>

            {/* Right Box - Book Appointment */}
            <div className="bg-[#FFFBDF] rounded-3xl p-12 border border-black/5 relative overflow-hidden group hover:shadow-xl hover:shadow-black/5 transition-all">
              {/* Illustration element built into the box */}
              <div className="absolute -bottom-8 -right-8 w-48 h-48 opacity-20 group-hover:opacity-30 transition-opacity">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 rounded-full bg-[#30382F]/30" />
                  <div className="absolute top-8 left-8 w-32 h-32 rounded-2xl bg-white flex items-center justify-center rotate-12">
                    <Calendar className="w-16 h-16 text-[#30382F]/60" />
                  </div>
                </div>
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-[#30382F]/10 flex items-center justify-center mb-6">
                  <Calendar className="w-8 h-8 text-[#30382F]" />
                </div>
                <h3 className="text-3xl mb-4 text-black font-semibold">Book an appointment today</h3>
                <p className="text-black/60 text-lg leading-relaxed mb-8">
                  Schedule consultations with trusted funeral specialists online
                </p>
                <button className="bg-[#30382F] text-white px-6 py-3 rounded-xl hover:bg-[#30382F]/90 transition-all shadow-sm">
                  See availability
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR SPECIALISTS SECTION */}
      <section className="py-24 px-4 bg-[#FFFBDF]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left side - Abstract illustration */}
            <div className="relative">
              <div className="w-full aspect-square rounded-3xl bg-gradient-to-br from-[#30382F]/10 to-[#30382F]/20 flex items-center justify-center">
                <div className="w-4/5 h-4/5 rounded-full bg-white/60 backdrop-blur-sm border border-[#30382F]/20 flex items-center justify-center">
                  <div className="w-3/5 h-3/5 rounded-full bg-[#30382F]/20" />
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-[#30382F]/30" />
              <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-[#30382F]/10" />
            </div>

            {/* Right side - Content */}
            <div>
              <h2 className="text-5xl mb-6 text-black font-semibold tracking-tight">
                Soradin for Specialists
              </h2>

              <p className="text-2xl text-black/80 mb-8 leading-relaxed">
                Are you interested in filling out your calendar?
              </p>

              <div className="space-y-5 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#30382F] flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl text-black/70">Reach thousands of families with Soradin</p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#30382F] flex items-center justify-center flex-shrink-0 mt-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xl text-black/70">Make it easy for families to book with you</p>
                </div>
              </div>

              <div>
                <button className="bg-[#30382F] text-white px-8 py-4 rounded-2xl hover:bg-[#30382F]/90 transition-all text-lg shadow-sm">
                  Learn more about starting with us
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED PARTNERS */}
      <section className="py-24 px-4 bg-[#FFFBDF]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Content */}
            <div>
              <h2 className="text-5xl mb-8 text-black font-semibold tracking-tight leading-tight">
                Trusted by top funeral homes
              </h2>
            </div>

            {/* Right side - Logo Grid */}
            <div className="grid grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="flex items-center justify-center">
                  {/* Empty bubble logo placeholder */}
                  <div className="w-24 h-24 rounded-full bg-white border-2 border-black/10 shadow-sm flex items-center justify-center">
                    <span className="text-xs text-black/30">Logo {index}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CITIES LIST */}
      <section className="py-24 px-4 bg-[#30382F]/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl mb-12 text-black font-medium tracking-tight">
            Find funeral specialists by city
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {cities.map((city) => (
              <Link
                key={city}
                href={`/search?location=${city}`}
                className="bg-transparent border-b-2 border-black/20 hover:border-[#30382F] py-4 text-left transition-all group flex items-center justify-between"
              >
                <span className="text-black text-lg group-hover:text-[#30382F] transition-colors">
                  {city}
                </span>
                <ChevronDown className="w-5 h-5 text-black/40 group-hover:text-[#30382F] transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white">
        {/* Main Footer */}
        <div className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-5 gap-12 mb-12">
              {/* Column 1 - Soradin */}
              <div>
                <h4 className="mb-6 text-lg font-medium">Soradin</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      About us
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Press
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Contact us
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Help
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2 - Discover */}
              <div>
                <h4 className="mb-6 text-lg font-medium">Discover</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Stories for families
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Resources for specialists
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Community Standards
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
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
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      List your practice
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Partner resources
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
                      Funeral Planning
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Estate Planning
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Grief Counseling
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Memorial Services
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 5 - Are you a specialist */}
              <div>
                <h4 className="mb-6 text-lg font-medium">Are you a funeral specialist?</h4>
                <ul className="space-y-3">
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      List your practice on Soradin
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Become a partner
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-white/60 hover:text-white transition-colors">
                      Learn about solutions
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
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#"
                    className="text-white/50 hover:text-white transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#"
                    className="text-white/50 hover:text-white transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </Link>
                  <Link
                    href="#"
                    className="text-white/50 hover:text-white transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              <div className="text-sm text-white/40 text-center md:text-left">
                <p>© {new Date().getFullYear()} Soradin, Inc. Terms · Privacy · Site map</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
