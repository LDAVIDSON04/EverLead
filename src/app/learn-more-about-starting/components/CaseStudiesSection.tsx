"use client";

export function CaseStudiesSection() {
  const caseStudies = [
    {
      category: "Reach & Demand",
      title: "Reach the right patients, at the right time",
      description: "Organizations use Soradin to connect with patients actively seeking in-person care. By offering real-time availability and verified provider profiles, Soradin helps practices increase appointment requests without increasing administrative workload.",
      bgColor: "bg-[#FFE87C]",
    },
    {
      category: "Booking Efficiency",
      title: "Turn availability into confirmed appointments",
      description: "Soradin simplifies the booking process by displaying only real, bookable appointment slots. Organizations see higher confirmation rates and fewer scheduling conflicts, helping teams operate more efficiently.",
      bgColor: "bg-[#7DDFC3]",
    },
    {
      category: "Accessibility & Continuity",
      title: "Make in-person care easier to access",
      description: "Soradin helps organizations maintain near-term availability while improving access to in-person consultations. With verified specialists and structured scheduling, patients can confidently book the care they need.",
      bgColor: "bg-[#FFE87C]",
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl text-black mb-3">
            Why Agents choose Soradin
          </h2>
          <p className="text-gray-600">
            Built to support high-trust scheduling at scale.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {caseStudies.map((study, index) => (
            <div
              key={index}
              className={`${study.bgColor} rounded-2xl overflow-hidden border-4 border-black hover:scale-105 transition-transform group`}
            >
              <div className="h-56 relative flex items-center justify-center p-4">
                {/* Simple illustration placeholder */}
                <div className="w-full h-full bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-6xl opacity-50">
                    {index === 0 ? "👥" : index === 1 ? "✅" : "🏥"}
                  </span>
                </div>
              </div>
              <div className="p-6 bg-white border-t-4 border-black">
                <h3 className="text-black mb-3">{study.title}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {study.description}
                </p>
                <button className="text-[#0D5C3D] hover:underline group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Learn more →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

