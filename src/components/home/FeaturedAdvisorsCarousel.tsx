"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, MapPin, Star } from "lucide-react";
import { getAgentAvatarUrl } from "@/lib/utils";

type FeaturedAgent = {
  id: string;
  full_name: string | null;
  job_title: string | null;
  specialty: string | null;
  profile_picture_url: string | null;
  funeral_home: string | null;
  agent_city: string | null;
  agent_province: string | null;
};

type AvailabilityDay = { date: string; slots: unknown[]; timezone?: string };

function formatLocation(agent: FeaturedAgent): string {
  const city = (agent.agent_city || "").trim();
  const prov = (agent.agent_province || "").trim();
  if (city && prov) return `${city}, ${prov}`;
  if (city) return city;
  if (prov) return prov;
  return "Canada";
}

function roleLine(agent: FeaturedAgent): string {
  const j = (agent.job_title || "").trim();
  if (j) return j;
  const s = (agent.specialty || "").trim();
  if (s) return s;
  return "Estate planning specialist";
}

async function fetchNextAvailableLabel(agentId: string): Promise<string> {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const startDate = start.toISOString().slice(0, 10);
    const end = new Date(start.getTime() + 21 * 24 * 60 * 60 * 1000);
    const endDate = end.toISOString().slice(0, 10);

    const res = await fetch(
      `/api/agents/availability?agentId=${encodeURIComponent(agentId)}&startDate=${startDate}&endDate=${endDate}`
    );
    if (!res.ok) return "See calendar for availability";

    const days: AvailabilityDay[] = await res.json();
    const first = days.find((d) => d.slots && d.slots.length > 0);
    if (!first) return "No openings in the next few weeks";

    const d = new Date(first.date + "T12:00:00");
    const formatted = d.toLocaleDateString("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `Next available ${formatted}`;
  } catch {
    return "See calendar for availability";
  }
}

type Props = {
  viewAllHref: string;
  /** Home "location" when set; otherwise Book online uses each agent's city/province for search. */
  bookOnlineLocation?: string;
};

function videoMarketplaceHref(agent: FeaturedAgent, bookOnlineLocation: string | undefined): string {
  const loc = (bookOnlineLocation?.trim() || formatLocation(agent) || "Canada").trim();
  const params = new URLSearchParams();
  params.set("location", loc);
  params.set("mode", "video");
  params.set("featuredAgent", agent.id);
  return `/search?${params.toString()}`;
}

export function FeaturedAdvisorsCarousel({ viewAllHref, bookOnlineLocation }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [agents, setAgents] = useState<FeaturedAgent[]>([]);
  const [nextById, setNextById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/agents/featured");
        if (!res.ok) throw new Error("Failed to load specialists");
        const data = await res.json();
        if (cancelled) return;
        const list: FeaturedAgent[] = data.agents || [];
        setAgents(list);

        const labels = await Promise.all(
          list.map(async (a) => {
            const label = await fetchNextAvailableLabel(a.id);
            return [a.id, label] as const;
          })
        );
        if (cancelled) return;
        setNextById(Object.fromEntries(labels));
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load specialists");
          setAgents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollBy = (delta: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="mb-6 md:mb-8 w-full">
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h2 className="text-2xl md:text-3xl lg:text-[2rem] font-bold text-[#1A1A1A] tracking-tight">
            Trusted Professionals Across BC
          </h2>
          <span className="text-sm text-[#1A1A1A]/50">Loading specialists…</span>
        </div>
        <div className="flex gap-5 md:gap-6 overflow-hidden pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[min(100%,340px)] w-[340px] md:w-[380px] flex-shrink-0 rounded-2xl border border-neutral-200 bg-neutral-100 p-6 md:p-7 animate-pulse h-[300px] md:h-[320px]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (loadError || agents.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 md:mb-8 w-full">
      <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl md:text-3xl lg:text-[2rem] font-bold text-[#1A1A1A] tracking-tight pr-4">
          Trusted Professionals Across BC
        </h2>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end shrink-0">
          <Link
            href={viewAllHref}
            className="text-base font-medium text-[#1A1A1A] hover:underline underline-offset-2"
          >
            View all
          </Link>
          <button
            type="button"
            onClick={() => scrollBy(400)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-white text-[#1A1A1A] shadow-sm hover:bg-neutral-50"
            aria-label="Scroll specialists"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>

      {/* Negative margin does not widen children: w-full stays column width. Expand the scrollport to the viewport right edge (centered column math) so the next card can peek. */}
      <div className="w-full min-w-0 overflow-x-visible">
        <div
          ref={scrollRef}
          className="flex min-w-0 max-w-none gap-6 md:gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ width: "calc(100% + (100vw - 100%) / 2)" }}
        >
        {agents.map((agent) => (
          <article
            key={agent.id}
            className="snap-start w-[min(82vw,300px)] min-w-[min(82vw,300px)] sm:w-[370px] sm:min-w-[370px] md:w-[378px] md:min-w-[378px] lg:w-[384px] lg:min-w-[384px] flex-shrink-0 rounded-2xl border border-neutral-200 bg-white p-6 md:p-7 shadow-sm flex flex-col"
          >
            <div className="flex gap-4 mb-4">
              <div className="relative h-24 w-24 md:h-28 md:w-28 flex-shrink-0 overflow-hidden rounded-full border border-neutral-200">
                <Image
                  src={getAgentAvatarUrl(agent.profile_picture_url)}
                  alt={agent.full_name ? `Photo of ${agent.full_name}` : "Specialist"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 96px, 112px"
                />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="font-semibold text-[#1A1A1A] text-base md:text-lg leading-snug line-clamp-3">
                  {agent.full_name || "Specialist"}
                </h3>
                <p className="text-sm md:text-[0.9375rem] text-[#1A1A1A]/70 mt-1.5 line-clamp-2 leading-snug">
                  {roleLine(agent)}
                </p>
              </div>
            </div>

            {(agent.funeral_home || "").trim() ? (
              <p className="text-sm text-[#1A1A1A]/60 line-clamp-2 mb-2 leading-snug">{agent.funeral_home}</p>
            ) : null}
            <p className="flex items-start gap-2 text-sm text-[#1A1A1A]/65 mb-3">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[#1A1A1A]/45" aria-hidden />
              <span>{formatLocation(agent)}</span>
            </p>

            <p className="text-sm md:text-[0.9375rem] text-[#1A1A1A]/80 mb-3 leading-relaxed">
              {nextById[agent.id] || "Checking availability…"}
            </p>

            <Link
              href={videoMarketplaceHref(agent, bookOnlineLocation)}
              className="w-full text-center rounded-xl bg-[#1A1A1A] text-white text-base font-semibold py-3.5 px-4 hover:bg-[#1A1A1A]/90 transition-colors shadow-sm"
            >
              Book online
            </Link>
          </article>
        ))}

          <article
            className="snap-start w-[min(82vw,300px)] min-w-[min(82vw,300px)] sm:w-[370px] sm:min-w-[370px] md:w-[378px] md:min-w-[378px] lg:w-[384px] lg:min-w-[384px] flex-shrink-0 rounded-2xl border border-neutral-200 bg-white p-6 md:p-7 shadow-sm flex flex-col items-center justify-center text-center min-h-[280px] md:min-h-[300px]"
            aria-label="More professionals"
          >
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600"
              aria-hidden
              role="presentation"
            >
              <Star className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-[#1A1A1A] mb-2">There&apos;s more!</h3>
            <p className="text-sm text-[#1A1A1A]/65 mb-6 max-w-[240px] leading-snug">
              See more verified estate planning professionals on Soradin.
            </p>
            <Link
              href={viewAllHref}
              className="inline-flex items-center justify-center rounded-xl border-2 border-[#1A1A1A] bg-white px-6 py-3 text-base font-semibold text-[#1A1A1A] hover:bg-[#FAF9F6] transition-colors"
            >
              See more
            </Link>
          </article>

        <div className="w-6 shrink-0 md:w-10" aria-hidden />
        </div>
      </div>
    </div>
  );
}
