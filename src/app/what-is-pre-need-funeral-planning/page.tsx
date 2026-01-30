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
            <div className="rounded-xl overflow-hidden shadow-lg min-h-[400px] md:min-h-[500px] bg-[#faf8f3] flex items-center justify-center">
              {/* Image slot: replace src with your estate planning image path */}
              <img
                src="/estate-planning-image.jpg"
                alt="Estate planning and wills"
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
            <div className="rounded-xl overflow-hidden shadow-lg bg-[#e8e6e1] min-h-[400px] md:min-h-[500px] flex items-center justify-center order-1 md:order-2">
              <span className="text-gray-400 text-sm uppercase tracking-wider">Image slot</span>
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
        <div className="max-w-5xl mx-auto px-6">
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

      <section
        id="panel-insurance"
        role="tabpanel"
        aria-labelledby="tab-insurance"
        hidden={activeTab !== "insurance"}
        className="bg-white py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg bg-[#faf8f3] min-h-[400px] md:min-h-[500px] flex items-center justify-center">
              <span className="text-gray-400 text-sm uppercase tracking-wider">Life insurance</span>
            </div>
            <div className="pt-20">
              <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 mb-8 leading-tight">
                Life Insurance
              </h1>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Life insurance is a way to provide for your loved ones and cover final expenses, debts, or income replacement. Understanding your options with a licensed advisor helps you choose coverage that fits your goals and budget.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Rather than putting off the conversation, planning ahead lets you compare products, lock in rates where appropriate, and ensure your family has clear information about your coverage and how to make a claim when the time comes.
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

      <section
        id="panel-financial"
        role="tabpanel"
        aria-labelledby="tab-financial"
        hidden={activeTab !== "financial"}
        className="bg-white py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="rounded-xl overflow-hidden shadow-lg bg-[#faf8f3] min-h-[400px] md:min-h-[500px] flex items-center justify-center">
              <span className="text-gray-400 text-sm uppercase tracking-wider">Financial planning</span>
            </div>
            <div className="pt-20">
              <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 mb-8 leading-tight">
                Financial Advisors
              </h1>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                A financial advisor can help you plan for retirement, education, and legacy goals while managing risk and tax efficiency. Whether you are building savings or preparing for later life, a qualified advisor can tailor a strategy to your situation.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Rather than navigating investments and estate implications alone, working with a regulated professional helps you document your objectives, understand your options, and adjust your plan as your life and regulations change.
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
