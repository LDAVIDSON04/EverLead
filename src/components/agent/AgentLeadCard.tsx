'use client';

import { useRouter } from 'next/navigation';

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
  if (urgency === 'hot') return 'HOT LEAD';
  if (urgency === 'warm') return 'WARM LEAD';
  return 'COLD LEAD';
}

export default function AgentLeadCard({ lead }: Props) {
  const router = useRouter();

  const price = (lead.lead_price_cents ?? 0) / 100;

  const notePreview =
    lead.additional_details && lead.additional_details.length > 0
      ? lead.additional_details.length > 140
        ? lead.additional_details.slice(0, 137) + '…'
        : lead.additional_details
      : 'No extra details provided yet.';

  const handleBuyNow = () => {
    router.push(`/agent/leads/${lead.id}/buy`);
  };

  return (
    <article className="flex items-stretch justify-between rounded-xl border border-neutral-200 bg-white px-6 py-5 shadow-sm">
      {/* LEFT SIDE */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            {urgencyLabel(lead.urgency)}
          </span>
          {lead.city && (
            <p className="text-sm text-neutral-500">
              {lead.city}
              {lead.province ? `, ${lead.province}` : ''}
            </p>
          )}
        </div>

        <p className="text-sm font-medium text-neutral-900">
          {lead.service_type ? `${lead.service_type} pre-need enquiry` : 'Pre-need enquiry'}
        </p>

        <p className="mt-1 max-w-xl text-sm leading-relaxed text-neutral-600">
          {notePreview}
        </p>

        <p className="mt-2 text-xs text-neutral-500">
          Purchase to reveal full name, phone, and email.
        </p>

        <button
          type="button"
          onClick={handleBuyNow}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-900"
        >
          Buy now
        </button>
      </div>

      {/* RIGHT SIDE – PRICE */}
      <div className="flex flex-col items-end justify-center text-right text-sm">
        <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
          Buy now
        </span>
        <span className="text-lg font-semibold text-neutral-900">
          ${price.toFixed(2)}
        </span>
      </div>
    </article>
  );
}

