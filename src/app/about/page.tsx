import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Logo and Home Button */}
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="Soradin Logo" 
              width={40} 
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="text-2xl font-medium text-[#1A1A1A]">Soradin</span>
          </Link>
          
          <Link 
            href="/"
            className="px-4 py-2 text-[#1A1A1A] hover:text-[#0C6F3C] transition-colors font-medium"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="mb-6 text-5xl font-semibold text-[#1a3a2e]">About Soradin</h1>
          <p className="text-xl text-[#4a4a4a] max-w-2xl mx-auto leading-relaxed">
            It started with seeing the process firsthand
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        {/* Section 1 */}
        <section className="mb-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <Image
                src="/about-us-1.png"
                alt="Two people in conversation"
                width={600}
                height={400}
                className="w-full h-[400px] object-contain rounded-lg"
              />
            </div>
            <div className="order-1 md:order-2">
              <p className="text-lg leading-relaxed mb-4">
                Soradin was created after seeing, up close, how confusing and overwhelming end of life and future planning can be for families. These are not decisions people make often, and when they do, they are usually navigating unfamiliar information during emotional moments.
              </p>
              <p className="text-lg leading-relaxed text-[#4a4a4a]">
                Through firsthand exposure to the industry and countless conversations with families, it became clear that most people weren&apos;t looking to be sold something. They were looking for clarity, guidance, and someone they could trust to help them make informed decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-24">
          <div className="bg-[#f8f9fa] p-12 rounded-lg">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="mb-6 text-3xl font-semibold text-[#1a3a2e]">Planning should feel supportive, not transactional</h2>
                <p className="text-lg leading-relaxed mb-4">
                  Too often, families are forced to jump between websites, professionals, and sales conversations without a clear starting point. Important planning decisions become fragmented, rushed, or delayed simply because the process feels overwhelming.
                </p>
                <p className="text-lg leading-relaxed mb-4">
                  Soradin was built to change that experience.
                </p>
                <p className="text-lg leading-relaxed text-[#4a4a4a]">
                  Instead of pushing families down a sales funnel, Soradin creates space for education, discovery, and thoughtful conversations. Families can learn, explore options, and connect with qualified professionals when they&apos;re ready, not when they&apos;re pressured.
                </p>
              </div>
              <div>
                <Image
                  src="/about-us-3.png"
                  alt="Professional guiding client through planning"
                  width={600}
                  height={350}
                  className="w-full h-[350px] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="/about-us-2.png"
                alt="Professional and client in conversation"
                width={600}
                height={500}
                className="w-full h-[500px] object-contain rounded-lg"
              />
            </div>
            <div>
              <h2 className="mb-6 text-3xl font-semibold text-[#1a3a2e]">Built with deep industry understanding</h2>
              <p className="text-lg leading-relaxed mb-4">
                Soradin is informed by real experience in advanced planning and funeral preneed services. Growing up around this work meant seeing both sides: the professionals who genuinely care about serving families, and the families who just want to make the right choices without feeling rushed or confused.
              </p>
              <p className="text-lg leading-relaxed mb-4">
                That perspective shaped every part of the platform, from how professionals are presented, to how appointments are booked, to how conversations begin.
              </p>
              <p className="text-lg leading-relaxed text-[#4a4a4a]">
                The goal has always been simple: help families feel confident in their decisions, and help professionals build meaningful, long term relationships.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 - Closing */}
        <section className="text-center max-w-3xl mx-auto py-12">
          <h2 className="mb-6 text-3xl font-semibold text-[#1a3a2e]">A platform built on trust</h2>
          <p className="text-lg leading-relaxed mb-4">
            At its core, Soradin is about trust, trust in information, trust in professionals, and trust in the process itself.
          </p>
          <p className="text-lg leading-relaxed text-[#4a4a4a]">
            By focusing on transparency, education, and respectful connection, Soradin aims to set a new standard for how families and professionals come together around life&apos;s most important planning decisions.
          </p>
        </section>
      </div>
    </div>
  );
}
