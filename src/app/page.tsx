// app/page.tsx
export default function Home() {
  const advisors = [
    {
      name: "Sarah Thompson",
      title: "Pre-Need Specialist",
      location: "Calgary, AB",
      rating: "4.9",
    },
    {
      name: "Michael Chen",
      title: "Funeral Pre-Planning Advisor",
      location: "Edmonton, AB",
      rating: "4.8",
    },
    {
      name: "Linda Garcia",
      title: "Cremation & Pre-Need Consultant",
      location: "Calgary, AB",
      rating: "5.0",
    },
  ];

  const articles = [
    {
      title: "What Is Pre-Need Planning?",
      summary: "Learn what pre-need planning is and how it can ease emotional and financial stress for your family.",
    },
    {
      title: "How to Choose a Funeral Home Before You Need One",
      summary: "Key questions to ask when comparing funeral homes and service providers ahead of time.",
    },
    {
      title: "Cremation vs. Burial: Planning the Financial Side",
      summary: "Understand cost differences and payment options when planning ahead.",
    },
  ];

  const faqs = [
    {
      question: "What is pre-need planning?",
      answer:
        "Pre-need planning means making funeral, cremation, or cemetery arrangements in advance so your wishes and budget are clearly documented.",
    },
    {
      question: "How does Soradin work?",
      answer:
        "Tell us what you're planning for, browse trusted advisors in Calgary and Edmonton, then book a consultation at a time that works for you.",
    },
    {
      question: "Are advisors licensed?",
      answer:
        "Soradin only lists licensed funeral and pre-need professionals or staff working with licensed providers.",
    },
    {
      question: "Are consultations free?",
      answer:
        "Most initial consultations are free or low-cost. Advisors clearly indicate any fees before you confirm an appointment.",
    },
    {
      question: "Is my information secure?",
      answer:
        "Your information is encrypted and only shared with the advisor you choose to contact. Soradin never sells your personal details.",
    },
  ];

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A5C36] text-sm font-semibold text-white">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight">Soradin</span>
          </div>

          {/* Nav */}
          <nav className="hidden items-center gap-6 text-sm text-gray-700 md:flex">
            <button className="hover:text-[#0A5C36]">How it works</button>
            <button className="hover:text-[#0A5C36]">Services</button>
            <button className="hover:text-[#0A5C36]">FAQ</button>
            <button className="hover:text-[#0A5C36]">For advisors</button>

            <div className="ml-4 flex items-center gap-3">
              <button className="text-gray-700 hover:text-[#0A5C36]">Log in</button>
              <button className="rounded-full bg-[#0A5C36] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#084328]">
                Get started
              </button>
            </div>
          </nav>

          {/* Mobile menu placeholder */}
          <button className="md:hidden" aria-label="Open menu">
            <span className="block h-0.5 w-5 bg-gray-800" />
            <span className="mt-1 block h-0.5 w-5 bg-gray-800" />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="border-b border-gray-100 bg-[#F7F7F7]">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:px-6 md:py-20 lg:flex-row lg:items-center">
          {/* Left: text + search */}
          <div className="max-w-xl">
            <h1 className="text-3xl font-bold tracking-tight text-[#111111] sm:text-4xl lg:text-5xl">
              Book trusted pre-need advisors near you.
            </h1>
            <p className="mt-4 text-base text-gray-700 sm:text-lg">
              Plan ahead with licensed funeral and pre-need specialists in Calgary and Edmonton. Compare options,
              understand costs, and book a time that works for you.
            </p>

            {/* Search bar */}
            <div className="mt-8 rounded-2xl bg-white p-3 shadow-md">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                {/* Service type */}
                <div className="flex-1 border-b border-gray-200 pb-3 md:border-b-0 md:border-r md:pb-0 md:pr-3">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Service type
                  </label>
                  <select className="mt-1 w-full border-none bg-transparent text-sm text-[#111111] outline-none focus:ring-0">
                    <option>Pre-need consultation</option>
                    <option>Funeral home</option>
                    <option>Cremation services</option>
                    <option>Cemetery planning</option>
                    <option>Pre-need insurance</option>
                  </select>
                </div>

                {/* Location */}
                <div className="flex-1 border-b border-gray-200 pb-3 md:border-b-0 md:border-r md:pb-0 md:px-3">
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Location
                  </label>
                  <select className="mt-1 w-full border-none bg-transparent text-sm text-[#111111] outline-none focus:ring-0">
                    <option>Calgary, AB</option>
                    <option>Edmonton, AB</option>
                  </select>
                </div>

                {/* Button */}
                <div className="pt-2 md:pl-3 md:pt-0">
                  <button className="w-full rounded-full bg-[#0A5C36] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#084328] md:w-auto">
                    Find advisors
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                No obligation. Your details are only shared with the advisor you choose.
              </p>
            </div>
          </div>

          {/* Right: simple "trust / reassurance" panel */}
          <div className="flex-1">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">
                Why plan ahead with Soradin?
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li>• Compare multiple trusted providers in Calgary & Edmonton.</li>
                <li>• Understand pricing and options before you&apos;re in crisis.</li>
                <li>• Book a time to talk that fits your schedule.</li>
                <li>• Make decisions with clarity and less pressure on your family.</li>
              </ul>
              <div className="mt-6 rounded-2xl bg-[#F7F7F7] p-4 text-xs text-gray-600">
                "We created Soradin so families could plan ahead with confidence, instead of trying to make every
                decision in a single, stressful moment."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SERVICES */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[#111111]">
              Popular services
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Start with the type of planning that matters most to you.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Funeral homes",
                desc: "Meet with licensed funeral directors to discuss full-service arrangements.",
              },
              {
                title: "Cemeteries",
                desc: "Plan burial plots, mausoleums, and memorial options in advance.",
              },
              {
                title: "Cremation services",
                desc: "Explore direct cremation and memorial service options.",
              },
              {
                title: "Pre-need insurance",
                desc: "Lock in today's prices and protect your family from surprise costs.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-gray-100 bg-[#FDFDFD] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 h-9 w-9 rounded-full bg-[#E5F4ED]" />
                <h3 className="text-sm font-semibold text-[#111111]">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-gray-100 bg-[#F7F7F7]">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[#111111]">
              How Soradin works
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              A simple, calm process to help you plan ahead on your terms.
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Tell us what you need",
                desc: "Share whether you're planning for yourself, a partner, or a family member, and what type of service you're considering.",
              },
              {
                step: "2",
                title: "Compare trusted advisors",
                desc: "Browse licensed advisors in Calgary and Edmonton, see their services, and understand the basics of pricing.",
              },
              {
                step: "3",
                title: "Book a calm conversation",
                desc: "Choose a time that works for you to talk through options, ask questions, and make a plan that feels right.",
              },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0A5C36] text-xs font-semibold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-[#111111]">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED ADVISORS */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#111111]">
                Featured advisors
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Example profiles to show how Soradin will help you compare options.
              </p>
            </div>
            <button className="text-sm font-semibold text-[#0A5C36] hover:text-[#084328]">
              View all advisors
            </button>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {advisors.map((advisor) => (
              <div
                key={advisor.name}
                className="flex flex-col rounded-2xl border border-gray-100 bg-[#FDFDFD] p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#E5F4ED]" />
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">{advisor.name}</p>
                    <p className="text-xs text-gray-600">{advisor.title}</p>
                    <p className="text-xs text-gray-500">{advisor.location}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                  <span>⭐ {advisor.rating} rating</span>
                  <span>Licensed provider</span>
                </div>
                <button className="mt-4 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-[#0A5C36] hover:border-[#0A5C36]">
                  View profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section className="border-b border-gray-100 bg-[#F7F7F7]">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[#111111]">
              Planning resources
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Short guides to help you understand your options before you speak to anyone.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.title}
                className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm"
              >
                <div className="h-28 rounded-xl bg-[#E5F4ED]" />
                <h3 className="mt-4 text-sm font-semibold text-[#111111]">{article.title}</h3>
                <p className="mt-2 flex-1 text-sm text-gray-600">{article.summary}</p>
                <button className="mt-3 text-xs font-semibold text-[#0A5C36] hover:text-[#084328]">
                  Read more →
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[#111111]">
                Common questions
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Pre-need planning can feel unfamiliar. Here are answers to some of the most common
                questions families ask.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-gray-100 bg-[#FDFDFD] p-4"
                >
                  <p className="text-sm font-semibold text-[#111111]">{faq.question}</p>
                  <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0A5C36]">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center text-white md:px-6 md:py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Start planning with confidence.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#E4F3EB]">
            Take one small step today. Share a few details, compare advisors, and choose a calm time
            to talk through your options.
          </p>
          <button className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0A5C36] shadow-sm hover:bg-[#F6F6F6]">
            Get started with Soradin
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-[#111111]">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-300 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A5C36] text-xs font-semibold text-white">
                  S
                </div>
                <span className="text-base font-semibold text-white">Soradin</span>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                Helping families in Calgary and Edmonton plan ahead with clarity, calm, and care.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Soradin
              </p>
              <ul className="mt-3 space-y-1 text-xs text-gray-300">
                <li>About</li>
                <li>Contact</li>
                <li>For advisors</li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Services
              </p>
              <ul className="mt-3 space-y-1 text-xs text-gray-300">
                <li>Funeral homes</li>
                <li>Cemeteries</li>
                <li>Cremation services</li>
                <li>Pre-need planning</li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Legal
              </p>
              <ul className="mt-3 space-y-1 text-xs text-gray-300">
                <li>Terms</li>
                <li>Privacy</li>
                <li>Security</li>
              </ul>
            </div>
          </div>

          <p className="mt-8 text-xs text-gray-500">
            © {new Date().getFullYear()} Soradin. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
