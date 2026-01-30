"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const TABS = [
  { id: "funeral", label: "Funeral pre planning" },
  { id: "estate", label: "Estate lawyers and wills" },
  { id: "insurance", label: "Life Insurance" },
  { id: "financial", label: "Financial advisors" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function WhatIsPreNeedFuneralPlanningPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("funeral");

  const navigateToSearch = () => {
    router.push("/search");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white py-5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Soradin.png"
              alt="Soradin Logo"
              width={80}
              height={80}
              className="h-20 w-20 object-contain"
            />
            <span className="text-2xl font-semibold text-[#1A1A1A]">Soradin</span>
          </Link>
          <Link
            href="/"
            className="text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors text-lg font-medium"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex gap-0" role="tablist" aria-label="Planning topics">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-5 text-base font-medium transition-colors whitespace-nowrap
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a2e] focus-visible:ring-offset-2
                  ${activeTab === tab.id
                    ? "text-[#1a3a2e] border-b-2 border-[#1a3a2e] bg-[#faf8f3]"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab panels */}
      <section
        id="panel-funeral"
        role="tabpanel"
        aria-labelledby="tab-funeral"
        hidden={activeTab !== "funeral"}
        className="bg-white py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/Liam_Davidson_Can_you_make_them_look_like_business_people_fa0c6ee9-eee5-43bd-b48a-bbaadc8f2153 (1).jpg"
                alt="Professional consultation with funeral planning specialists"
                width={600}
                height={600}
                className="w-full h-full object-contain md:object-cover min-h-[400px] md:min-h-[500px]"
              />
            </div>
            <div className="pt-20">
              <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 mb-8 leading-tight">
                What Is Pre-Need Funeral Planning?
              </h1>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Pre-need funeral planning is the process of making decisions about your funeral and end-of-life arrangements in advance, while you are able to think clearly, ask questions, and make choices that reflect your values.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Rather than leaving these decisions to loved ones during an emotionally difficult time, pre-need planning allows you to document your wishes, understand your options, and ensure everything is handled the way you intend.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Estate lawyers and wills – full panel */}
      <section
        id="panel-estate"
        role="tabpanel"
        aria-labelledby="tab-estate"
        hidden={activeTab !== "estate"}
        className="bg-white py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg min-h-[400px] md:min-h-[500px] flex items-center justify-center">
              <img
                src="/estate-planning-couple-advisor.png"
                alt="Couple meeting with an advisor to discuss estate planning and wills"
                className="w-full h-full object-cover min-h-[400px] md:min-h-[500px]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <span className="hidden text-gray-400 text-sm uppercase tracking-wider p-8 text-center">Estate planning</span>
            </div>
            <div className="pt-20">
              <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 mb-8 leading-tight">
                What Is Estate Planning and Why Are Wills Important?
              </h1>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Estate planning is the process of legally documenting how your assets, responsibilities, and wishes should be handled if you pass away or become unable to make decisions for yourself.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                At the center of estate planning is a will. A will clearly outlines who should receive your assets, who will act on your behalf, and how important decisions should be carried out. Without proper documentation, these decisions are left to provincial laws rather than personal choice.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Working with an estate lawyer ensures your wishes are legally binding, clearly written, and properly executed.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Rather than leaving loved ones to navigate complex legal systems during a difficult time, estate planning provides clarity, protection, and peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {activeTab === "estate" && (
        <>
      {/* Why Families Create Wills - Cream */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
                Why Families Create Wills and Work With Estate Lawyers
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Many families delay estate planning because it feels overwhelming or uncomfortable. Unfortunately, waiting often leads to confusion, delays, and conflict later.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Families choose to work with estate lawyers because it allows them to:
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Ensure assets are distributed according to their wishes</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Prevent legal disputes and unnecessary court involvement</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Appoint guardians for minor children or dependents</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Plan for incapacity with powers of attorney and healthcare directives</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Reduce stress and uncertainty for loved ones</span>
                </li>
              </ul>
              <p className="text-gray-700 text-lg leading-relaxed italic">
                An estate lawyer helps translate personal wishes into legally sound documents that stand up when they are needed most.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg min-h-[400px] md:min-h-[500px] order-1 md:order-2">
              <img
                src="/estate-lawyers-families.png"
                alt="Professional and couple in office discussing estate planning and wills"
                className="w-full h-full object-cover min-h-[400px] md:min-h-[500px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What Is Covered - White */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
            What Is Covered in Estate Planning
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-16 max-w-3xl">
            Estate planning typically involves more than writing a will. It is a coordinated process that may include:
          </p>
          <div className="grid md:grid-cols-3 gap-10 mb-16">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Legal Documents</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Wills</li>
                <li className="text-gray-700 leading-relaxed">Powers of attorney</li>
                <li className="text-gray-700 leading-relaxed">Advance healthcare directives</li>
                <li className="text-gray-700 leading-relaxed">Trusts where appropriate</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Family and Personal Considerations</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Guardianship decisions</li>
                <li className="text-gray-700 leading-relaxed">Blended family arrangements</li>
                <li className="text-gray-700 leading-relaxed">Care for dependents with special needs</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Financial and Tax Planning</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Reducing probate and estate taxes</li>
                <li className="text-gray-700 leading-relaxed">Protecting business or property interests</li>
                <li className="text-gray-700 leading-relaxed">Structuring assets for efficient transfer</li>
              </ul>
            </div>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed max-w-3xl">
            A qualified estate lawyer explains each option clearly and helps families make informed decisions without rushing.
          </p>
        </div>
      </section>

      {/* What Estate Planning Is Not - Cream */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
            What Estate Planning Is Not
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Estate planning is often misunderstood. It is not:
          </p>
          <ul className="space-y-5 mb-10">
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Only for wealthy individuals</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Only for older adults</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">A complicated or rigid process</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Something that cannot be updated later</span>
            </li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed">
            Estate plans can and should evolve as life circumstances change.
          </p>
        </div>
      </section>

      {/* Who Benefits - White */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img
                src="/estate-who-benefits-infographic.png"
                alt="Who benefits from estate planning: parents, couples, individuals with property, business owners, and anyone who wants clarity and control"
                className="w-full h-auto object-contain"
              />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
                Who Benefits From Estate Planning
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Estate planning is valuable for people at many stages of life, including:
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Parents with young or dependent children</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Couples planning for the future</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Individuals with property or savings</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Business owners</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Anyone who wants clarity and control</span>
                </li>
              </ul>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                There is no perfect time to start. The right time is when you want your wishes clearly documented.
              </p>
              <button
                onClick={navigateToSearch}
                className="bg-[#1A1A1A] text-white px-8 py-4 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm text-lg font-medium"
              >
                Find care
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How Soradin Helps - Cream */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
            How Soradin Helps
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Soradin connects families with verified estate lawyers who focus on wills and end of life planning.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Through Soradin, you can:
          </p>
          <ul className="space-y-5 mb-10">
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Review lawyer profiles and areas of focus</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Understand what services are offered</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Request a consultation in person or virtually</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Feel confident you are working with a qualified professional</span>
            </li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed">
            Every legal professional on Soradin is reviewed before being listed so families can focus on understanding their options, not verifying credentials.
          </p>
        </div>
      </section>

      {/* A Foundation for Peace of Mind - White */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
            A Foundation for Peace of Mind
          </h2>
          <p className="text-gray-700 text-xl leading-relaxed mb-6">
            Estate planning is not about anticipating the worst.
          </p>
          <p className="text-gray-700 text-xl leading-relaxed mb-6">
            It is about protecting the people you care about and ensuring your intentions are respected.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
            A properly prepared estate plan brings clarity today and confidence for the future.
          </p>
        </div>
      </section>
        </>
      )}

      {/* Life Insurance – full panel */}
      <section
        id="panel-insurance"
        role="tabpanel"
        aria-labelledby="tab-insurance"
        hidden={activeTab !== "insurance"}
        className="bg-white py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg min-h-[400px] md:min-h-[500px]">
              <img
                src="/life-insurance-intro.png"
                alt="Advisor and client discussing life insurance and end of life planning"
                className="w-full h-full object-cover min-h-[400px] md:min-h-[500px]"
              />
            </div>
            <div className="pt-20">
              <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 mb-8 leading-tight">
                What Is Life Insurance for End of Life Planning?
              </h1>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Life insurance is a financial tool designed to provide immediate support to loved ones when someone passes away. In the context of end of life planning, it plays a critical role in covering expenses, settling debts, and maintaining stability during a time of loss.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Life insurance pays a tax free lump sum to beneficiaries, allowing families to handle funeral costs and financial obligations without delay.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Rather than leaving loved ones to manage expenses during grief, life insurance provides certainty and protection when it matters most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {activeTab === "insurance" && (
        <>
      {/* Why Families Include Life Insurance - Cream */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
                Why Families Include Life Insurance in Their Planning
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Final expenses and financial obligations do not disappear after death. Without planning, families are often forced to make urgent financial decisions at an already stressful time.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Families choose life insurance because it allows them to:
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Cover funeral and burial or cremation costs</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Pay off outstanding debts or mortgages</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Provide financial support to surviving family members</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Avoid selling assets under pressure</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Transfer funds quickly outside of probate</span>
                </li>
              </ul>
              <p className="text-gray-700 text-lg leading-relaxed italic">
                Life insurance ensures financial responsibilities are handled with dignity and care.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg min-h-[400px] md:min-h-[500px] order-1 md:order-2">
              <img
                src="/life-insurance-why-families.png"
                alt="Why families include life insurance: protection from final expenses, mortgage debt, and loss of income; financial security and dignity"
                className="w-full h-full object-cover min-h-[400px] md:min-h-[500px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Types of Life Insurance - White */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
            Types of Life Insurance Used in End of Life Planning
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-16 max-w-3xl">
            Life insurance is not one size fits all. Common options include:
          </p>
          <div className="grid md:grid-cols-3 gap-10 mb-16">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Permanent Life Insurance</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Provides lifelong coverage</li>
                <li className="text-gray-700 leading-relaxed">Often used to cover final expenses or estate taxes</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Term Life Insurance</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Covers a specific period of time</li>
                <li className="text-gray-700 leading-relaxed">Often used to protect income or pay off debts</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Final Expense or Burial Insurance</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Designed specifically for funeral and medical costs</li>
                <li className="text-gray-700 leading-relaxed">Typically easier to qualify for later in life</li>
              </ul>
            </div>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed max-w-3xl">
            A licensed insurance professional helps families understand which option aligns best with their goals and circumstances.
          </p>
        </div>
      </section>

      {/* What Life Insurance Is Not - Cream */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
            What Life Insurance Is Not
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Life insurance is not:
          </p>
          <ul className="space-y-5 mb-10">
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Only for families with children</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Only for high income earners</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">A replacement for estate planning</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">A product you must commit to immediately</span>
            </li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed">
            A consultation is meant to be educational, not transactional.
          </p>
        </div>
      </section>

      {/* Who Should Consider - White */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <img
                src="/life-insurance-who-should-consider.png"
                alt="Who should consider life insurance: funeral costs, protecting family, homeowners, business owners, legacy"
                className="w-full h-auto object-contain"
              />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
                Who Should Consider Life Insurance
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Life insurance is commonly considered by:
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Individuals planning for funeral costs</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Parents or caregivers</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Homeowners with outstanding mortgages</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Business owners</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Anyone who wants to protect loved ones financially</span>
                </li>
              </ul>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Planning early often provides more options and affordability.
              </p>
              <button
                onClick={navigateToSearch}
                className="bg-[#1A1A1A] text-white px-8 py-4 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm text-lg font-medium"
              >
                Find care
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How Soradin Helps - Cream */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg bg-[#e8e6e1] min-h-[400px] md:min-h-[500px] flex items-center justify-center">
              <span className="text-gray-400 text-sm uppercase tracking-wider">Image slot</span>
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
                How Soradin Helps
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Soradin connects families with verified life insurance professionals who specialize in end of life and estate related planning.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Through Soradin, you can:
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Review broker profiles and experience</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Request virtual or in person consultations</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Ask questions without pressure</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Work with licensed professionals</span>
                </li>
              </ul>
              <p className="text-gray-700 text-lg leading-relaxed">
                Every insurance professional on Soradin is reviewed to ensure proper licensing and ethical standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Protection With Purpose - White */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
            Financial Protection With Purpose
          </h2>
          <p className="text-gray-700 text-xl leading-relaxed mb-6">
            Life insurance is not about fear.
          </p>
          <p className="text-gray-700 text-xl leading-relaxed mb-6">
            It is about responsibility, preparation, and care.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
            When used thoughtfully, it provides families with security, dignity, and peace of mind when they need it most.
          </p>
        </div>
      </section>
        </>
      )}

      {/* Financial Advisors – full panel */}
      <section
        id="panel-financial"
        role="tabpanel"
        aria-labelledby="tab-financial"
        hidden={activeTab !== "financial"}
        className="bg-white py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg bg-[#e8e6e1] min-h-[400px] md:min-h-[500px] flex items-center justify-center">
              <span className="text-gray-400 text-sm uppercase tracking-wider">Image slot</span>
            </div>
            <div className="pt-20">
              <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 mb-8 leading-tight">
                What Is Financial Planning for End of Life?
              </h1>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Financial planning for end of life focuses on organizing assets, minimizing taxes, and ensuring a smooth transfer of wealth according to personal wishes.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                A financial advisor helps families coordinate the financial side of estate planning so that legal documents, beneficiary designations, and assets work together.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Rather than leaving finances scattered and unclear, financial planning brings structure, efficiency, and long term clarity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {activeTab === "financial" && (
        <>
      {/* Why Families Work With Financial Advisors - Cream */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
                Why Families Work With Financial Advisors
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                End of life planning often involves complex financial decisions that extend beyond a will.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Families work with financial advisors because they help:
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Reduce tax burdens on estates</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Coordinate beneficiary designations</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Organize financial accounts and documentation</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Protect assets for future generations</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Support heirs who may lack financial experience</span>
                </li>
              </ul>
              <p className="text-gray-700 text-lg leading-relaxed italic">
                Professional guidance helps prevent costly mistakes and unnecessary stress.
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg bg-[#e8e6e1] min-h-[400px] md:min-h-[500px] flex items-center justify-center order-1 md:order-2">
              <span className="text-gray-400 text-sm uppercase tracking-wider">Image slot</span>
            </div>
          </div>
        </div>
      </section>

      {/* What Financial Advisors Help With - White */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
            What Financial Advisors Help With
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-16 max-w-3xl">
            Financial advisors often support families by addressing:
          </p>
          <div className="grid md:grid-cols-3 gap-10 mb-16">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Estate and Legacy Planning</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Coordinating assets with legal documents</li>
                <li className="text-gray-700 leading-relaxed">Structuring inheritances</li>
                <li className="text-gray-700 leading-relaxed">Planning charitable giving</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Tax Efficiency</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Reducing capital gains and probate costs</li>
                <li className="text-gray-700 leading-relaxed">Planning for business succession</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Support for Beneficiaries</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Guidance for heirs receiving assets</li>
                <li className="text-gray-700 leading-relaxed">Long term financial education</li>
              </ul>
            </div>
          </div>
          <p className="text-gray-700 text-lg leading-relaxed max-w-3xl">
            An advisor works alongside lawyers and insurance professionals to create a complete plan.
          </p>
        </div>
      </section>

      {/* What Financial Planning Is Not - Cream */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
            What Financial Planning Is Not
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Financial planning is not:
          </p>
          <ul className="space-y-5 mb-10">
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Only for wealthy families</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Only about investments</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">A replacement for legal advice</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Something done only after death</span>
            </li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed">
            It is a proactive process designed to prevent confusion and loss.
          </p>
        </div>
      </section>

      {/* Who Benefits From Financial Planning - White */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
            Who Benefits From Financial Planning
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Financial planning is valuable for:
          </p>
          <ul className="space-y-5 mb-10">
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Individuals with savings or investments</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Homeowners</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Business owners</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Families concerned about tax exposure</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Anyone planning a thoughtful legacy</span>
            </li>
          </ul>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Even modest estates can benefit from proper coordination.
          </p>
          <button
            onClick={navigateToSearch}
            className="bg-[#1A1A1A] text-white px-8 py-4 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm text-lg font-medium"
          >
            Find care
          </button>
        </div>
      </section>

      {/* How Soradin Helps - Cream */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg bg-[#e8e6e1] min-h-[400px] md:min-h-[500px] flex items-center justify-center">
              <span className="text-gray-400 text-sm uppercase tracking-wider">Image slot</span>
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
                How Soradin Helps
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Soradin connects families with verified financial advisors who focus on estate and end of life planning.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Through Soradin, you can:
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">View advisor profiles and specialties</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Request consultations</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Understand how your finances fit into your overall plan</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Work with professionals who meet credentialing standards</span>
                </li>
              </ul>
              <p className="text-gray-700 text-lg leading-relaxed">
                Soradin allows families to approach financial planning with clarity rather than uncertainty.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* A Clear Path Forward - White */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
            A Clear Path Forward
          </h2>
          <p className="text-gray-700 text-xl leading-relaxed mb-6">
            End of life financial planning is about alignment.
          </p>
          <p className="text-gray-700 text-xl leading-relaxed mb-6">
            When legal, financial, and insurance plans work together, families experience fewer delays, fewer conflicts, and greater peace of mind.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
            Planning ahead allows you to leave clarity instead of questions.
          </p>
        </div>
      </section>
        </>
      )}

      {/* Rest of page (funeral planning only) */}
      {activeTab === "funeral" && (
        <>
      {/* Why People Choose - Cream Background */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
                Why People Choose Pre-Need Planning
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Most families are forced to make funeral decisions under stress and time pressure. Pre-need planning removes that burden.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                People choose to plan ahead because it allows them to:
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Make informed decisions without urgency</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Reduce emotional and financial stress on family members</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Clearly communicate personal, cultural, or religious preferences</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Avoid uncertainty, disagreements, or guesswork later</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Ensure arrangements align with their values and beliefs</span>
                </li>
              </ul>
              <p className="text-gray-700 text-lg leading-relaxed italic mb-8">
                Pre-need planning is a way of taking responsibility — not only for yourself, but for those who will one day be asked to carry these decisions forward.
              </p>
              <button
                onClick={navigateToSearch}
                className="bg-[#1A1A1A] text-white px-8 py-4 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm text-lg font-medium"
              >
                Find care
              </button>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg order-1 md:order-2">
              <img 
                src="/bf599b03f4b83eb7d458ba52eb11f1573e5ac36d.png" 
                alt="Planning workspace"
                className="w-full h-full object-contain md:object-cover min-h-[400px] md:min-h-[500px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* What Is Covered - White Background */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
            What Is Covered in Pre-Need Funeral Planning?
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-16 max-w-3xl">
            Pre-need planning is not a single decision. It&apos;s a guided conversation that typically covers several areas, including:
          </p>

          <div className="grid md:grid-cols-3 gap-10 mb-16">
            {/* Personal Preferences */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Personal Preferences</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Burial or cremation</li>
                <li className="text-gray-700 leading-relaxed">Type of service or memorial</li>
                <li className="text-gray-700 leading-relaxed">Religious, cultural, or spiritual elements</li>
                <li className="text-gray-700 leading-relaxed">Music, readings, or personal touches</li>
                <li className="text-gray-700 leading-relaxed">Location and setting preferences</li>
              </ul>
            </div>

            {/* Practical Arrangements */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Practical Arrangements</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Funeral home selection</li>
                <li className="text-gray-700 leading-relaxed">Type of service (private, public, memorial, celebration of life)</li>
                <li className="text-gray-700 leading-relaxed">Transportation considerations</li>
                <li className="text-gray-700 leading-relaxed">Documentation and next steps</li>
              </ul>
            </div>

            {/* Financial Considerations */}
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Financial Considerations</h3>
              <ul className="space-y-4">
                <li className="text-gray-700 leading-relaxed">Understanding available options</li>
                <li className="text-gray-700 leading-relaxed">Discussing payment structures (without pressure)</li>
                <li className="text-gray-700 leading-relaxed">Planning in a way that aligns with your family&apos;s situation</li>
              </ul>
            </div>
          </div>

          <p className="text-gray-700 text-lg leading-relaxed max-w-3xl">
            A qualified pre-need specialist helps explain these choices clearly, without rushing or pushing decisions.
          </p>
        </div>
      </section>

      {/* What Pre-Need Planning Is Not - Cream Background */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg order-1 md:order-1">
              <img 
                src="/a448f0358969818d57da3a45b0fef57728b21630.png" 
                alt="Professional documentation"
                className="w-full h-full object-contain md:object-cover min-h-[400px] md:min-h-[500px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="order-2 md:order-2">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
                What Pre-Need Planning Is Not
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Pre-need planning is often misunderstood. It is not:
              </p>
              <ul className="space-y-5 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">A sales pitch</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">A forced purchase</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">A one-size-fits-all package</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">A commitment you can&apos;t change</span>
                </li>
              </ul>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                A proper pre-need consultation is informational, supportive, and flexible. Plans can be revised over time as circumstances change.
              </p>
              <button
                onClick={navigateToSearch}
                className="bg-[#1A1A1A] text-white px-8 py-4 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm text-lg font-medium"
              >
                Find care
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is Pre-Need Planning For - White Background */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 leading-tight">
            Who Is Pre-Need Planning For?
          </h2>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Pre-need planning is not limited to a specific age group.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            People who often find it valuable include:
          </p>
          
          <ul className="space-y-5 mb-12 max-w-3xl">
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Individuals planning for the future</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Couples who want clarity for each other</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Parents who want to ease the burden on their children</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">People with specific cultural, religious, or personal wishes</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
              <span className="text-gray-700 text-lg leading-relaxed">Anyone who values preparation and thoughtful decision-making</span>
            </li>
          </ul>

          <p className="text-gray-700 text-lg leading-relaxed">
            There is no &quot;right time&quot; — only the time that feels right for you.
          </p>
        </div>
      </section>

      {/* What Happens During a Consultation - Cream Background */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="order-2 md:order-1">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
                What Happens During a Pre-Need Consultation?
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8 font-medium">
                A pre-need consultation is a conversation, not a transaction.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                During a consultation, you can expect to:
              </p>
              
              <ul className="space-y-5 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Ask questions freely</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Learn about your options in plain language</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Discuss your priorities and concerns</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Receive guidance from a verified professional</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Decide what — if anything — you&apos;d like to document or plan next</span>
                </li>
              </ul>

              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                There is no obligation to move forward. The goal is understanding, not pressure.
              </p>
              <button
                onClick={navigateToSearch}
                className="bg-[#1A1A1A] text-white px-8 py-4 rounded-xl hover:bg-[#1A1A1A]/90 transition-all shadow-sm text-lg font-medium"
              >
                Find care
              </button>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg order-1 md:order-2">
              <img 
                src="/consultation-image.jpg" 
                alt="Professional consultation space"
                className="w-full h-full object-contain md:object-cover min-h-[400px] md:min-h-[500px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How Soradin Helps - White Background */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg order-1 md:order-1">
              <img 
                src="/3342a4b29bf643b580d630c78e1f13747daaed1c.png" 
                alt="Calm interior setting"
                className="w-full h-full object-contain md:object-cover min-h-[400px] md:min-h-[500px]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="order-2 md:order-2">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
                How Soradin Helps
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Soradin connects individuals and families with verified pre-need funeral planning specialists who meet professional and credentialing standards.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Through Soradin, you can:
              </p>
              
              <ul className="space-y-5 mb-10">
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">View specialist profiles and backgrounds</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Understand their areas of expertise</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Request an in-person consultation</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1a3a2e] mt-2 mr-4 flex-shrink-0"></span>
                  <span className="text-gray-700 text-lg leading-relaxed">Feel confident you&apos;re speaking with a qualified professional</span>
                </li>
              </ul>

              <p className="text-gray-700 text-lg leading-relaxed">
                Every specialist on Soradin is reviewed before being listed, so you can focus on the conversation — not on vetting credentials.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* A Thoughtful Step Forward - Cream Background */}
      <section className="bg-[#faf8f3] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-8 leading-tight">
            A Thoughtful Step Forward
          </h2>
          <p className="text-gray-700 text-xl leading-relaxed mb-6">
            Planning ahead doesn&apos;t mean dwelling on the end.
          </p>
          <p className="text-gray-700 text-xl leading-relaxed mb-6">
            It means making space for clarity, dignity, and peace of mind.
          </p>
          <p className="text-gray-700 text-lg leading-relaxed max-w-3xl mx-auto">
            Pre-need funeral planning gives you control over important decisions — and gives your loved ones the comfort of knowing your wishes were thoughtfully considered.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#1a3a2e] text-white py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 leading-tight">
            Book Local Experts Today
          </h2>
          <p className="text-xl leading-relaxed mb-12 text-gray-100 max-w-2xl mx-auto">
            Request an in-person consultation with a verified pre-need planning specialist to explore your options at your own pace.
          </p>
          <Link 
            href="/search"
            className="inline-block bg-white text-[#1a3a2e] px-12 py-5 rounded-lg hover:bg-gray-100 transition-all shadow-lg text-lg font-medium"
          >
            Book Local Experts Today
          </Link>
        </div>
      </section>
        </>
      )}
    </div>
  );
}
