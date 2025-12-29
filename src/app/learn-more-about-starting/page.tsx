"use client";

import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { SolutionsSection } from "./components/SolutionsSection";
import { CaseStudiesSection } from "./components/CaseStudiesSection";
import { IntegrationSection } from "./components/IntegrationSection";
import { CTASection } from "./components/CTASection";
import { Footer } from "./components/Footer";

export default function LearnMoreAboutStartingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <SolutionsSection />
        <CaseStudiesSection />
        <IntegrationSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
