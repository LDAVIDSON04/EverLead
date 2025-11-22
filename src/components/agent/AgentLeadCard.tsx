'use client';

import { useState } from 'react';

type Urgency = 'hot' | 'warm' | 'cold';

export type AgentLead = {
  id: string;
  urgency: Urgency;
  city: string | null;
  province: string | null;
  service_type: string | null;
  lead_price: number; // Price in dollars from database
  additional_details: string | null; // Maps to additional_notes in DB
};

type Props = {
  lead: AgentLead;
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

export default function AgentLeadCard({ lead }: Props) {
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = lead.lead_price ?? 0;

  // Note snippet - 1-2 lines, truncated
  const noteSnippet = lead.additional_details 
    ? lead.additional_details.trim()
    : null;

  const handleBuyNow = async () => {
    setBuying(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
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
    <article className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-start justify-between gap-8 p-8">
        <div className="flex-1">
          {/* Urgency badge */}
          <div className="mt-1 mb-4">
            <span className={badgeClassForUrgency(lead.urgency)}>
              {urgencyLabel(lead.urgency)}
            </span>
          </div>

          {/* City + service type */}
          <div className="text-base text-gray-700 font-medium leading-relaxed mb-3">
            {lead.city && (
              <>
                {lead.city}
                {lead.province ? `, ${lead.province}` : ''}
              </>
            )}
            {lead.city && <span className="text-gray-400 mx-1">•</span>}
            <span className="text-gray-600">
              {getServiceTypeLabel(lead.service_type)}
            </span>
          </div>

          {/* Note snippet */}
          <p className="text-base text-gray-600 line-clamp-2 leading-relaxed mb-3">
            {noteSnippet ||
              "This family has shared some details about what they're looking for. Purchase the lead to review their full note."}
          </p>

          {/* Disclosure line */}
          <p className="text-xs text-gray-400 font-medium">
            Purchase to reveal full name, phone, and email.
          </p>
        </div>

        {/* Price summary on the right */}
        <div className="text-right min-w-[140px] pr-2">
          <div className="text-xs tracking-wide text-gray-500 uppercase font-medium mb-2">
            Buy now
          </div>
          <div className="text-xl font-semibold text-gray-900">
            ${price.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Bottom buy button */}
      <div className="border-t border-gray-100 bg-gray-50 px-8 py-4">
        {error && (
          <p className="mb-3 text-xs text-red-600">{error}</p>
        )}
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={buying}
          className="w-full inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 hover:shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-70"
        >
          {buying ? 'Starting checkout…' : 'Buy now'}
        </button>
      </div>
    </article>
  );
}

