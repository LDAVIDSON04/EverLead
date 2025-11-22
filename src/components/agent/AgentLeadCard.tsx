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

  // Note preview - show 2-3 lines, truncated with ellipsis
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

      // Redirect to Stripe checkout (will redirect back to /agent/dashboard after)
      window.location.href = body.url;
    } catch (err) {
      console.error('Buy Now error:', err);
      setError('Could not start checkout. Please try again.');
      setBuying(false);
    }
  };

  return (
    <article className="rounded-lg border border-[#ded3c2] bg-white p-6 shadow-sm">
      <div className="flex items-start gap-6">
        {/* LEFT/MAIN COLUMN */}
        <div className="flex-1 min-w-0">
          {/* Urgency pill at top */}
          <div className="mb-3">
            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
              {urgencyLabel(lead.urgency)}
            </span>
          </div>

          {/* City, Province, Service type line */}
          <div className="mb-3 text-sm text-[#6b6b6b]">
            {lead.city && (
              <span>
                {lead.city}
                {lead.province ? `, ${lead.province}` : ''}
              </span>
            )}
            {lead.city && lead.service_type && <span className="mx-2">•</span>}
            <span>{getServiceTypeLabel(lead.service_type)}</span>
          </div>

          {/* Multi-line note preview (2-3 lines, truncated) */}
          <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-[#4a4a4a]">
            {notePreview}
          </p>

          {/* Helper text */}
          <p className="mb-4 text-xs text-[#6b6b6b]">
            Purchase to reveal full name, phone, and email.
          </p>

          {/* Full-width black Buy now button */}
          {error && (
            <p className="mb-2 text-xs text-red-600">{error}</p>
          )}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={buying}
            className="w-full rounded-full bg-[#2a2a2a] px-6 py-3 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
          >
            {buying ? 'Starting checkout…' : 'Buy now'}
          </button>
        </div>

        {/* RIGHT COLUMN - PRICE */}
        <div className="flex flex-shrink-0 flex-col items-end text-right">
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#6b6b6b]">
            BUY NOW
          </span>
          <span className="mt-2 text-xl font-semibold text-[#2a2a2a]">
            ${price.toFixed(2)}
          </span>
        </div>
      </div>
    </article>
  );
}

