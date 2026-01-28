'use client';

import { useState } from 'react';
import Link from 'next/link';

type Urgency = 'hot' | 'warm' | 'cold';

export type AgentLead = {
  id: string;
  urgency: Urgency;
  city: string | null;
  province: string | null;
  service_type: string | null;
  lead_price: number; // Price in dollars from database
  additional_details: string | null; // Maps to additional_notes in DB
  planning_for?: string | null; // Who they are planning for
  latitude?: number | null; // For distance calculations
  longitude?: number | null; // For distance calculations
};

type Props = {
  lead: AgentLead;
  firstFreeAvailable?: boolean;
  onClaimFree?: (leadId: string) => Promise<void>;
  agentId?: string | null;
};

function urgencyLabel(urgency: Urgency) {
  if (urgency === 'hot') return 'HOT LEAD';
  if (urgency === 'warm') return 'WARM LEAD';
  return 'COLD LEAD';
}

function badgeClassForUrgency(urgency?: string) {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold';
  switch (urgency) {
    case 'hot':
      return base + ' bg-amber-100 text-amber-800';
    case 'warm':
      return base + ' bg-yellow-100 text-yellow-800';
    case 'cold':
    default:
      return base + ' bg-slate-100 text-slate-700';
  }
}

function getServiceTypeLabel(serviceType: string | null): string {
  if (!serviceType) return 'pre-need enquiry';
  const lower = serviceType.toLowerCase();
  if (lower === 'cremation') return 'cremation pre-need enquiry';
  if (lower === 'burial') return 'burial pre-need enquiry';
  return `${serviceType} pre-need enquiry`;
}

export default function AgentLeadCard({ lead, firstFreeAvailable = false, onClaimFree, agentId }: Props) {
  const [buying, setBuying] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = lead.lead_price ?? 0;

  // Note snippet - 1-2 lines, truncated to ~180 characters
  const noteSnippet = lead.additional_details 
    ? lead.additional_details.trim().length > 180
      ? lead.additional_details.trim().substring(0, 180) + '…'
      : lead.additional_details.trim()
    : null;

  const handleClaimFree = async () => {
    if (!onClaimFree) return;
    
    setClaiming(true);
    setError(null);

    try {
      await onClaimFree(lead.id);
      // onClaimFree will handle success/error and refresh
    } catch (err) {
      console.error('Claim free error:', err);
      setError('Could not claim free lead. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const handleBuyNow = async () => {
    // If free is available, use that instead
    if (firstFreeAvailable && onClaimFree) {
      await handleClaimFree();
      return;
    }

    setBuying(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, agentId: agentId }),
      });

      const body = await res.json();

      if (!res.ok || !body?.url) {
        console.error('Checkout create error:', body);
        setError(body?.error || 'Could not start checkout. Please try again.');
        setBuying(false);
        return;
      }

      // Redirect to Stripe checkout (will redirect back to /agent/dashboard after)
      window.location.href = body.url;
    } catch (err) {
      console.error('Buy Now error:', err);
      setError('Could not start checkout. Please try again.');
      setBuying(false);
    }
  };

  return (
    <article className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            {/* Urgency badge */}
            <div className="mb-3">
              <span className={badgeClassForUrgency(lead.urgency)}>
                {urgencyLabel(lead.urgency)}
              </span>
            </div>

            {/* City + province */}
            <div className="text-base text-gray-700 font-medium mb-1">
              {lead.city && (
                <>
                  {lead.city}
                  {lead.province ? `, ${lead.province}` : ''}
                </>
              )}
            </div>

            {/* Service type */}
            <div className="text-sm text-gray-600 mb-3">
              {getServiceTypeLabel(lead.service_type)}
            </div>

            {/* Note preview */}
            {noteSnippet && (
              <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
                {noteSnippet}
              </p>
            )}

            {/* Disclosure line */}
            <p className="text-xs text-gray-400 mb-4">
              Purchase to reveal full name, phone, and email.
            </p>

            {/* Green pill Buy now / Claim free button and View details link */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={firstFreeAvailable ? handleClaimFree : handleBuyNow}
                disabled={buying || claiming}
                className="inline-flex items-center justify-center rounded-full bg-neutral-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-600 transition-all disabled:cursor-not-allowed disabled:opacity-70"
              >
                {claiming 
                  ? 'Claiming free lead…' 
                  : buying 
                  ? 'Starting checkout…' 
                  : firstFreeAvailable 
                  ? 'Claim free lead ✨' 
                  : `Buy now for $${price.toFixed(2)}`}
              </button>

              {/* View details link - navigates to detail page */}
              <Link
                href={`/agent/leads/${lead.id}`}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                View details →
              </Link>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-600">{error}</p>
            )}
          </div>

          {/* Price summary on the right */}
          <div className="text-right min-w-[120px] flex-shrink-0">
            <div className="text-xs tracking-wide text-gray-500 uppercase font-medium mb-1">
              BUY NOW
            </div>
            <div className="text-xl font-semibold text-gray-900">
              ${price.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

