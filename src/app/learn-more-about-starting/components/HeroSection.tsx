"use client";

import Link from "next/link";
import Image from "next/image";
import { AppointmentCard } from "./AppointmentCard";
import { AgentProfileCard } from "./AgentProfileCard";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  // Agent profiles for desktop view - scattered cards with varied colors
  const agentProfiles = [
    { name: "Phillip Harvey", role: "Funeral Planning", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces", rotation: -3, size: "medium" as const, bgColor: "light" as const },
    { name: "Robert Williams", role: "Funeral Director", imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces", rotation: 2, size: "large" as const, featured: true },
    { name: "Ashley Townsend", role: "Estate Planning", imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces", rotation: -2, size: "small" as const, bgColor: "dark" as const },
    { name: "Michael Chen", role: "Funeral Services", imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces", rotation: 4, size: "medium" as const, bgColor: "light" as const },
    { name: "Sarah Johnson", role: "Pre-needs Sales", imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces", rotation: -1, size: "medium" as const, bgColor: "dark" as const },
    { name: "David Martinez", role: "Funeral Assistant", imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces", rotation: 3, size: "small" as const, bgColor: "light" as const },
    { name: "Emily Davis", role: "Funeral Planning", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces", rotation: -4, size: "medium" as const, bgColor: "dark" as const },
    { name: "James Wilson", role: "Funeral Director", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces", rotation: 1, size: "small" as const, bgColor: "light" as const },
    { name: "Kyle Parker", role: "Estate Planning", imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces", rotation: -2, size: "small" as const, bgColor: "light" as const },
  ];

  return (
    <section className="bg-[#FFF9F0] py-8 md:py-20 relative overflow-hidden min-h-[700px]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content - Desktop view */}
          <div className="z-10 hidden md:flex flex-col items-start text-left">
            <h1 className="text-5xl md:text-6xl text-black mb-8 max-w-lg font-semibold">
              Join the leading scheduling platform
            </h1>
            <Link href="/create-account">
              <button className="bg-white hover:bg-gray-50 text-black border-4 border-black px-8 py-3 rounded-lg transition-colors shadow-lg font-medium">
                Learn more
              </button>
            </Link>
          </div>

          {/* Mobile content - keep original */}
          <div className="z-10 md:hidden flex flex-col items-center text-center">
            <h1 className="text-4xl text-black mb-4 max-w-lg">
              Client growth you can count on
            </h1>
            <p className="text-lg text-gray-700 mb-6 max-w-md">
              Reach more clients, simplify scheduling, and get a clear view into your performance data, all with one platform.
            </p>
            <Link href="/create-account" className="mb-0">
              <Button className="bg-[#0D5C3D] hover:bg-[#0A4A30] text-white px-8 py-6">
                Get started
              </Button>
            </Link>
            {/* Mobile Appointment Cards - shows only on mobile */}
            <div className="relative h-[400px] w-full md:hidden mt-1 flex items-center justify-center">
              {/* FEATURED: Funeral Director - center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" style={{ transform: 'translate(-50%, -50%) scale(0.7)' }}>
                <AppointmentCard
                  name="Michael Davis"
                  date="Pre-Need Sales Consultant"
                  status="Funeral Director"
                  imageUrl="/6cf5ec63f87cc57ba7775f9fb59e1fd68aa5998b.png"
                  featured
                />
              </div>

              {/* Client Card 1 - top (0 degrees) */}
              <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) translateY(-110px) rotate(-2deg) scale(0.55)' }}>
                <AppointmentCard
                  name="James Miller"
                  date="Mon, April 14 at 3:00 PM EST"
                  status="Booked"
                  imageUrl="/ca3d03ea2df40f93620bf476ca4d13a99c120a0d.png"
                />
              </div>

              {/* Client Card 2 - top right (45 degrees) */}
              <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) translate(-78px, -78px) rotate(2deg) scale(0.55)' }}>
                <AppointmentCard
                  name="Sarah Johnson"
                  date="Fri, April 18 at 2:00 PM EST"
                  status="Booked"
                  imageUrl="https://images.unsplash.com/photo-1747302653727-275b259eef46?w=150&h=150&fit=crop&crop=faces"
                />
              </div>

              {/* Client Card 3 - right (90 degrees) */}
              <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) translateX(110px) rotate(1deg) scale(0.55)' }}>
                <AppointmentCard
                  name="Jessica Brown"
                  date="Sat, April 19 at 1:00 PM EST"
                  status="Booked"
                  imageUrl="https://images.unsplash.com/photo-1763259405593-d30c6b820a3d?w=150&h=150&fit=crop&crop=faces"
                />
              </div>

              {/* Client Card 4 - bottom right (135 degrees) */}
              <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) translate(78px, 78px) rotate(-2deg) scale(0.55)' }}>
                <AppointmentCard
                  name="Lisa Anderson"
                  date="Mon, April 21 at 10:30 AM EST"
                  status="Booked"
                  imageUrl="https://images.unsplash.com/photo-1643717347866-f213892b736b?w=150&h=150&fit=crop&crop=faces"
                />
              </div>

              {/* Client Card 5 - bottom (180 degrees) */}
              <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) translateY(110px) rotate(2deg) scale(0.55)' }}>
                <AppointmentCard
                  name="Robert Taylor"
                  date="Sun, April 20 at 10:00 AM EST"
                  status="Booked"
                  imageUrl="https://images.unsplash.com/photo-1758600432307-2f5ea934be75?w=150&h=150&fit=crop&crop=faces"
                />
              </div>

              {/* Client Card 6 - bottom left (225 degrees) */}
              <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) translate(-78px, 78px) rotate(-1deg) scale(0.55)' }}>
                <AppointmentCard
                  name="Amy Chen"
                  date="Thu, April 17 at 4:00 PM EST"
                  status="Booked"
                  imageUrl="https://images.unsplash.com/photo-1658767119017-3a2a362e65c0?w=150&h=150&fit=crop&crop=faces"
                />
              </div>

              {/* Client Card 7 - left (270 degrees) */}
              <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) translateX(-110px) rotate(1deg) scale(0.55)' }}>
                <AppointmentCard
                  name="David Chen"
                  date="Tue, April 15 at 11:00 AM EST"
                  status="Booked"
                  imageUrl="/a16d084325d7eb62b3170f963475f05b750a383d.png"
                />
              </div>

              {/* Client Card 8 - top left (315 degrees) */}
              <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) translate(78px, -78px) rotate(-2deg) scale(0.55)' }}>
                <AppointmentCard
                  name="William White"
                  date="Wed, April 16 at 9:00 AM EST"
                  status="Booked"
                  imageUrl="/56636ec270d99f4a4d6ae68e014f42a3fc84e7c3.png"
                />
              </div>
            </div>
          </div>

          {/* Right content - Desktop: scattered agent profile cards */}
          <div className="relative h-[700px] hidden md:flex items-center justify-center overflow-visible">
            {/* Scattered agent profile cards with varying positions and rotations */}
            <div className="absolute top-8 left-8">
              <AgentProfileCard {...agentProfiles[0]} />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <AgentProfileCard {...agentProfiles[1]} />
            </div>
            <div className="absolute top-12 right-16">
              <AgentProfileCard {...agentProfiles[2]} />
            </div>
            <div className="absolute top-32 right-8">
              <AgentProfileCard {...agentProfiles[3]} />
            </div>
            <div className="absolute top-1/2 right-4 -translate-y-1/2">
              <AgentProfileCard {...agentProfiles[4]} />
            </div>
            <div className="absolute bottom-24 right-12">
              <AgentProfileCard {...agentProfiles[5]} />
            </div>
            <div className="absolute bottom-16 left-12">
              <AgentProfileCard {...agentProfiles[6]} />
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <AgentProfileCard {...agentProfiles[7]} />
            </div>
            <div className="absolute top-20 left-1/4">
              <AgentProfileCard {...agentProfiles[8]} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

