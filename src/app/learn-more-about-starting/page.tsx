"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LearnMoreAboutStartingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Learn More About Starting with Soradin
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 mb-6">
            Welcome to Soradin! We're here to help you grow your practice and connect with families in need of your services.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Why Choose Soradin?
          </h2>
          
          <ul className="list-disc list-inside space-y-3 text-gray-700 mb-8">
            <li>Reach thousands of families looking for your services</li>
            <li>Streamlined booking process for easy appointment management</li>
            <li>Professional platform that builds trust with families</li>
            <li>Grow your practice and expand your reach</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Getting Started
          </h2>
          
          <p className="text-gray-700 mb-6">
            Getting started with Soradin is simple. Our team will guide you through the process and help you set up your profile.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
            Contact Us
          </h2>
          
          <p className="text-gray-700 mb-8">
            If you have any questions or would like to learn more, please don't hesitate to reach out to our team.
          </p>
        </div>
      </main>
    </div>
  );
}
