"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white">
      {/* Profile cards image section */}
      <div className="w-full bg-[#FFF9F0] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <img 
            src="/1287f77558fc6a47c506a92275bdcb435d5dc5d5.png" 
            alt="Professional team profile cards" 
            className="w-full max-w-5xl mx-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
      
      {/* Footer content */}
      <div className="bg-[#2A2A2A] text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Column 1 - Soradin */}
          <div>
            <h3 className="text-white mb-4">Soradin</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Home</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">About Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Press</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Careers</a></li>
              <li><a href="mailto:support@soradin.com" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Contact us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Help</a></li>
            </ul>
          </div>

          {/* Column 2 - Discover */}
          <div>
            <h3 className="text-white mb-4">Discover</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">The Patient Growth Stories for providers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Practice Resources for providers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Community standards</a></li>
              <li><a href="/privacy" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Data and privacy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Verified reviews</a></li>
              <li>
                <a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm inline-flex items-center gap-2">
                  Tech Blog
                  <span className="bg-[#FFE87C] text-black text-xs px-2 py-0.5 rounded">New</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 - For providers */}
          <div>
            <h3 className="text-white mb-4 text-sm">Are you a top doctor or health service?</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm inline-flex items-center gap-2">
                  Try So, your AI Phone Assistant
                  <span className="bg-[#FFE87C] text-black text-xs px-2 py-0.5 rounded font-semibold">NEW</span>
                </a>
              </li>
              <li><Link href="/learn-more-about-starting" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">List your practice on Soradin</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Become an EHR partner</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Learn about Soradin Enterprise Solutions</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Access Soradin for Developers</a></li>
            </ul>
          </div>

          {/* Column 4 - Directories */}
          <div>
            <h3 className="text-white mb-4">Directories</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Insurance Carriers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors text-sm">Top Specialties</a></li>
            </ul>
          </div>

          {/* Column 5 - Get the app */}
          <div>
            <h3 className="text-white mb-4">Get the Soradin app</h3>
            <div className="space-y-3">
              <a 
                href="#" 
                className="block w-full bg-black hover:bg-gray-900 text-white px-4 py-2 rounded transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍎</span>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </div>
              </a>
              <a 
                href="#" 
                className="block w-full bg-black hover:bg-gray-900 text-white px-4 py-2 rounded transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">▶️</span>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">GET IT ON</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-8">
          <p className="text-gray-400 text-xs leading-relaxed max-w-5xl">
            The content provided here and elsewhere on the Soradin site or mobile app is provided for general informational purposes only. It is not intended as, and Soradin does not provide, medical advice, diagnosis or treatment. Always contact your healthcare provider directly with any questions you may have regarding your health or specific medical advice.
          </p>
        </div>

        {/* Bottom section */}
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-400">© {new Date().getFullYear()} Soradin, Inc.</span>
            <Link href="/terms" className="text-gray-400 hover:text-[#0D5C3D] transition-colors">Terms</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-[#0D5C3D] transition-colors">Privacy</Link>
            <a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors">Consumer Health</a>
            <a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors inline-flex items-center gap-1">
              <span className="text-lg">🔒</span>
              Your privacy choices
            </a>
          </div>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors">
              <span className="text-xl">𝕏</span>
            </a>
            <a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors">
              <span className="text-xl">📷</span>
            </a>
            <a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors">
              <span className="text-xl">f</span>
            </a>
            <a href="#" className="text-gray-400 hover:text-[#0D5C3D] transition-colors">
              <span className="text-xl">in</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

