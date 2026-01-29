"use client";

import Link from "next/link";

export function SolutionsSection() {
  const solutions = [
    {
      imageOnly: true,
      image: "/soradin-laptop-marketplace.png",
    },
    {
      title: "Website scheduling",
      description: "Ensure families on your website can book anytime with 24/7 online scheduling.",
      icon: "🗓️",
      bgColor: "bg-white",
      image: "/soradin-website-scheduling.png",
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
              className={`${(solution as { bgColor?: string }).bgColor ?? "bg-white"} p-6 rounded-2xl border border-gray-200 transition-all duration-300 ease-out hover:border-[#1A1A1A] hover:shadow-xl hover:shadow-black/10 hover:scale-[1.03] hover:-translate-y-1 group cursor-pointer`}
            >
              {solution.image ? (
                <div className={solution.imageOnly ? "rounded-xl overflow-hidden" : "mb-6 rounded-xl overflow-hidden"}>
                  <img src={solution.image} alt={solution.imageOnly ? "Soradin marketplace on laptop" : solution.title} className="w-full h-auto object-cover" />
                </div>
              ) : (
                <div className="h-48 mb-6 flex items-center justify-center text-6xl">
                  {solution.icon}
                </div>
              )}
              {!solution.imageOnly && (
                <>
                  <h3 className="text-black mb-3">{solution.title}</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    {solution.description}
                  </p>
                  <Link href="/create-account">
                    <button className="text-[#1A1A1A] text-sm hover:underline group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Learn more →
                    </button>
                  </Link>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

