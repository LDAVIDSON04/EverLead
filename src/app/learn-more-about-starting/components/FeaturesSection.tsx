"use client";

export function FeaturesSection() {
  const features = [
    {
      title: "Calendar Integration",
      description: "Show patients accurate availability without extra work.",
      icon: "📅",
      bgColor: "bg-[#FFF9F0]",
    },
    {
      title: "Soradin Video Service",
      description: "Connect with patients via our intuitive HIPAA-compliant telehealth solution.",
      icon: "🎥",
      bgColor: "bg-[#FFF9F0]",
    },
    {
      title: "Intake",
      description: "Streamline appointment management by collecting forms online.",
      icon: "📋",
      bgColor: "bg-[#FFF9F0]",
    },
    {
      title: "Appointment reminders",
      description: "Improve attendance rates with automated reminders.",
      icon: "📱",
      bgColor: "bg-[#FFF9F0]",
    },
    {
      title: "Reviews",
      description: "Build trust with verified patient reviews, automatically collected for you.",
      icon: "👍",
      bgColor: "bg-[#FFF9F0]",
    },
    {
      title: "Performance reporting",
      description: "Measure results with clear, actionable data.",
      icon: "📊",
      bgColor: "bg-[#FFF9F0]",
    },
  ];

  return (
    <section className="bg-[#FFF9F0] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl md:text-5xl text-black mb-4">
            Essential features for great patient experiences
          </h2>
          <p className="text-lg text-gray-700">
            All Soradin solutions come with features designed to save your practice time and help you see more patients.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="w-16 h-16 bg-[#0D5C3D] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">{feature.icon}</span>
              </div>
              <h3 className="text-black mb-2">{feature.title}</h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

