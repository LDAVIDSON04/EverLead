"use client";

import Link from "next/link";

export function SolutionsSection() {
  const solutions = [
    {
      title: "Soradin Marketplace",
      description: "Reach millions of families searching for care.",
      icon: "🔍",
      bgColor: "bg-white",
      image: "/cd6b39dd37848fa2e07c2d2e725d3e2c50d49696.png",
    },
    {
      title: "Website scheduling",
      description: "Ensure families on your website can book anytime with 24/7 online scheduling.",
      icon: "🗓️",
      bgColor: "bg-white",
      image: "/f103b18d805714f0cf26707650407e7192408cbe.png",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-wider text-gray-600 mb-4">Our solutions</p>
          <h2 className="text-4xl md:text-5xl text-black max-w-4xl">
            How Soradin Helps Families Plan Ahead
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className={`${solution.bgColor} p-6 rounded-2xl border border-gray-200 hover:border-[#0D5C3D] transition-all hover:shadow-lg group`}
            >
              {solution.image ? (
                <div className="mb-6 rounded-xl overflow-hidden">
                  <img src={solution.image} alt={solution.title} className="w-full h-auto object-cover" />
                </div>
              ) : (
                <div className="h-48 mb-6 flex items-center justify-center text-6xl">
                  {solution.icon}
                </div>
              )}
              <h3 className="text-black mb-3">{solution.title}</h3>
              <p className="text-gray-600 text-sm mb-6">
                {solution.description}
              </p>
              <Link href="/create-account">
                <button className="text-[#0D5C3D] text-sm hover:underline group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Learn more →
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

