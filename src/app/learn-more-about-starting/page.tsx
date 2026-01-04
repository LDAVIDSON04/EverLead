"use client";

import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { TrustedBySection } from "./components/TrustedBySection";
import { SolutionsSection } from "./components/SolutionsSection";
import { CaseStudiesSection } from "./components/CaseStudiesSection";
import { IntegrationSection } from "./components/IntegrationSection";
import { CTASection } from "./components/CTASection";

export default function LearnMoreAboutStartingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <SolutionsSection />
        <CaseStudiesSection />
        <IntegrationSection />
        <CTASection />
      </main>
    </div>
  );
}
