"use client";

import Link from 'next/link';
import { Calendar, User, Settings, FileText, Shield, HelpCircle, Building2, CreditCard, MessageSquare } from 'lucide-react';

export default function ProviderHelpPage() {
  const categories = [
    { id: 1, title: 'Getting Started', icon: HelpCircle, articles: 12 },
    { id: 2, title: 'Managing Appointments', icon: Calendar, articles: 15 },
    { id: 3, title: 'Profile & Bio', icon: User, articles: 8 },
    { id: 4, title: 'Settings', icon: Settings, articles: 10 },
    { id: 5, title: 'Billing & Payments', icon: CreditCard, articles: 7 },
    { id: 6, title: 'Account Management', icon: Building2, articles: 6 },
    { id: 7, title: 'Privacy & Security', icon: Shield, articles: 5 },
    { id: 8, title: 'Reviews & Feedback', icon: MessageSquare, articles: 9 },
    { id: 9, title: 'Policies & Terms', icon: FileText, articles: 4 }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header & Hero Section Combined */}
      <section className="relative bg-gradient-to-br from-[#0C6F3C] to-[#0a5a2e] px-6 overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px),
                              repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`
          }}></div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#0a5a2e] rounded-full opacity-30 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-[#0C6F3C] rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#0a5a2e] rounded-full opacity-30 blur-3xl translate-x-1/3 translate-y-1/3"></div>
          <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-[#0C6F3C] rounded-full opacity-20 blur-2xl"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8">
              <span className="text-lg text-white font-medium">Provider Help Center</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-white hover:text-gray-200 transition-colors">
                Soradin
              </Link>
              <Link href="/help" className="text-sm text-white hover:text-gray-200 transition-colors">
                Family Help
              </Link>
              <Link href="mailto:support@soradin.com" className="text-sm text-white hover:text-gray-200 transition-colors">
                Contact us
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="max-w-3xl mx-auto relative z-10 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center">
            How can we help you?
          </h1>
          <p className="text-white/90 text-center mt-4 text-lg">
            Resources and guides for funeral professionals
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                href="#"
                className="group bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-4 bg-[#0C6F3C]/10 rounded-full flex items-center justify-center group-hover:bg-[#0C6F3C] transition-colors">
                    <Icon className="w-8 h-8 text-[#0C6F3C] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg mb-2 text-black font-medium">{category.title}</h3>
                  <p className="text-sm text-gray-500">{category.articles} articles</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Additional Help Section */}
      <section className="bg-[#FAF9F6] py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl text-gray-700 mb-4 font-medium">Need more assistance?</h2>
          <p className="text-gray-600 mb-6">Our support team is here to help you succeed</p>
          <Link 
            href="mailto:support@soradin.com"
            className="inline-block px-8 py-3 bg-[#0C6F3C] text-white rounded-xl hover:bg-[#0C6F3C]/90 transition-colors shadow-sm"
          >
            Contact Support
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm">Provider Help Center</p>
        </div>
      </footer>
    </div>
  );
}
