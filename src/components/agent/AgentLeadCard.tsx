'use client';

import { useState } from 'react';

type Urgency = 'hot' | 'warm' | 'cold';

export type AgentLead = {
  id: string;
  urgency: Urgency;
  city: string | null;
  province: string | null;
  service_type: string | null;
  lead_price_cents: number;
  additional_details: string | null; // Maps to additional_notes in DB
};

type Props = {
  lead: AgentLead;
};

function urgencyLabel(urgency: Urgency) {
  if (urgency === 'hot') return 'HOT';
  if (urgency === 'warm') return 'WARM';
  return 'COLD';
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

  const price = (lead.lead_price_cents ?? 0) / 100;

  // Note preview - truncate to 2 lines max
  const notePreview = lead.additional_details && lead.additional_details.length > 0
    ? lead.additional_details
    : 'No extra details provided yet.';

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

      // Open Stripe checkout in a new tab
      window.open(body.url, '_blank', 'noopener,noreferrer');
      setBuying(false);
    } catch (err) {
      console.error('Buy Now error:', err);
      setError('Could not start checkout. Please try again.');
      setBuying(false);
    }
  };

  return (
    <article className="rounded-lg border border-[#ded3c2] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        {/* LEFT SIDE */}
        <div className="flex-1 min-w-0">
          {/* Top row: Urgency badge, City + province, Service type */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
              {urgencyLabel(lead.urgency)}
            </span>
            {lead.city && (
              <span className="text-sm text-[#6b6b6b]">
                {lead.city}
                {lead.province ? `, ${lead.province}` : ''}
              </span>
            )}
            <span className="text-sm text-[#6b6b6b]">
              {getServiceTypeLabel(lead.service_type)}
            </span>
          </div>

          {/* Body: Note preview (1-2 lines, truncated) */}
          <p className="mb-2 line-clamp-2 text-sm leading-relaxed text-[#4a4a4a]">
            {notePreview}
          </p>

          {/* Helper text */}
          <p className="mb-3 text-xs text-[#6b6b6b]">
            Purchase to reveal full name, phone, and email.
          </p>

          {/* Buy button - normal sized, on left side */}
          {error && (
            <p className="mb-2 text-xs text-red-600">{error}</p>
          )}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={buying}
            className="inline-flex items-center justify-center rounded-full bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
          >
            {buying ? 'Starting checkout…' : 'Buy now'}
          </button>
        </div>

        {/* RIGHT SIDE – PRICE (aligned to same row as Buy button) */}
        <div className="flex flex-shrink-0 flex-col items-end justify-end text-right">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#6b6b6b]">
            BUY NOW
          </span>
          <span className="mt-1 text-lg font-semibold text-[#2a2a2a]">
            ${price.toFixed(2)}
          </span>
        </div>
      </div>
    </article>
  );
}

