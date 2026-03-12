"use client";

export function CaseStudiesSection() {
  const caseStudies = [
    {
      category: "Reach & Demand",
      title: "Connect with families planning ahead",
      description: "Soradin helps you connect with families who are actively looking for estate planning guidance. By displaying your professional profile and real-time availability, families can easily discover you and book meetings without additional marketing on your end.",
      bgColor: "bg-[#FFE87C]",
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img 
            src="/391d87d0bfa941287dde563e9d115601074bffda.png" 
            alt="Healthcare provider and patient" 
            className="w-full h-full object-cover rounded-lg md:[object-position:center_35%]"
            onError={(e) => {
              // Fallback to placeholder if image doesn't exist
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = '<div class="w-full h-full bg-white/20 rounded-lg flex items-center justify-center"><span class="text-6xl opacity-50">👥</span></div>';
              }
            }}
          />
        </div>
      ),
    },
    {
      category: "Booking Efficiency",
      title: "Turn availability into confirmed meetings",
      description: "Set your real-time availability and allow families to book consultations in just a few clicks. Soradin removes the back-and-forth scheduling so you can focus on meeting with clients instead of managing appointment requests.",
      bgColor: "bg-[#7DDFC3]",
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img 
            src="/aa944d0f69729d63dff1b4adab6f298d6b22262e.png" 
            alt="Calendar with checkmark" 
            className="w-full h-full object-cover rounded-[2rem]"
            style={{ borderRadius: '2rem' }}
            onError={(e) => {
              // Fallback to placeholder if image doesn't exist
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = '<div class="w-full h-full bg-white/20 rounded-[2rem]" style="border-radius: 2rem;"><span class="text-6xl opacity-50">✅</span></div>';
              }
            }}
          />
        </div>
      ),
    },
    {
      category: "Accessibility & Continuity",
      title: "Grow your practice across the province",
      description: "Soradin helps professionals expand their reach beyond their local network. Families across British Columbia can discover your services, learn about your expertise, and schedule meetings directly through the platform.",
      bgColor: "bg-[#FFE87C]",
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img 
            src="/a478ea6f5e58a07a66b407d76c672137532df177.png" 
            alt="Healthcare building with location pin" 
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              // Fallback to placeholder if image doesn't exist
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = '<div class="w-full h-full bg-white/20 rounded-lg flex items-center justify-center"><span class="text-6xl opacity-50">🏥</span></div>';
              }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl text-black">
            Why professionals choose Soradin
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {caseStudies.map((study, index) => (
            <div
              key={index}
              className={`${study.bgColor} rounded-2xl overflow-hidden border-4 border-black hover:scale-105 transition-transform group`}
            >
              <div className="h-56 relative">
                {study.illustration}
              </div>
              <div className="p-6 bg-white border-t-4 border-black">
                <h3 className="text-black mb-3">{study.title}</h3>
                <p className="text-gray-600 text-sm">
                  {study.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

