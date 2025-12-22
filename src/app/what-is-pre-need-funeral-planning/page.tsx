"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function WhatIsPreNeedFuneralPlanningPage() {
  return (
    <main className="min-h-screen bg-white">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          What is Pre-Need Funeral Planning?
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-700 leading-relaxed mb-6">
            Pre-need funeral planning is the process of making funeral arrangements in advance, 
            before the need arises. This proactive approach allows individuals and families to 
            make important decisions about their final arrangements with clarity and peace of mind.
          </p>

          <h2 className="text-3xl font-semibold text-gray-900 mt-8 mb-4">
            Why Plan Ahead?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Planning your funeral in advance offers numerous benefits for both you and your loved ones. 
            It provides an opportunity to make thoughtful decisions without the emotional stress that 
            comes with making arrangements during a time of grief.
          </p>

          <h2 className="text-3xl font-semibold text-gray-900 mt-8 mb-4">
            Key Benefits of Pre-Need Planning
          </h2>
          <ul className="list-disc list-inside space-y-3 text-gray-700 mb-6">
            <li>Financial peace of mind by locking in today's prices</li>
            <li>Reduces emotional burden on family members during a difficult time</li>
            <li>Ensures your wishes are clearly documented and followed</li>
            <li>Allows for meaningful conversations with family about your preferences</li>
            <li>Provides flexibility to make changes as your circumstances evolve</li>
          </ul>

          <h2 className="text-3xl font-semibold text-gray-900 mt-8 mb-4">
            What's Included in Pre-Need Planning?
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Pre-need funeral planning typically includes decisions about:
          </p>
          <ul className="list-disc list-inside space-y-3 text-gray-700 mb-6">
            <li>Type of service (traditional burial, cremation, memorial service, etc.)</li>
            <li>Casket or urn selection</li>
            <li>Location and venue for services</li>
            <li>Music, readings, and other personal touches</li>
            <li>Flower arrangements and memorial displays</li>
            <li>Transportation arrangements</li>
            <li>Final resting place decisions</li>
          </ul>

          <h2 className="text-3xl font-semibold text-gray-900 mt-8 mb-4">
            How to Get Started
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Getting started with pre-need funeral planning is easier than you might think. 
            Our licensed funeral planning specialists are here to guide you through every step 
            of the process, answering your questions and helping you make informed decisions 
            that reflect your values and preferences.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Ready to Start Planning?
            </h3>
            <p className="text-gray-700 mb-4">
              Connect with a licensed pre-need funeral planning specialist in your area today. 
              They can help you create a comprehensive plan that gives you and your family peace of mind.
            </p>
            <Link
              href="/search"
              className="inline-block bg-[#0C6F3C] text-white px-6 py-3 rounded-xl hover:bg-[#0C6F3C]/90 transition-all shadow-sm font-medium"
            >
              Find a Specialist
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
