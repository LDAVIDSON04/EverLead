'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useRequireRole } from '@/lib/hooks/useRequireRole';

type Lead = {
  id: string;
  city: string | null;
  province: string | null;
  urgency_level: string | null;
  service_type: string | null;
  lead_price: number | null;
  assigned_agent_id: string | null;
};

export default function BuyLeadPage() {
  useRequireRole('agent');
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const leadId = params.id;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    async function loadLead() {
      if (!leadId) {
        setError('Invalid lead ID');
        setLoading(false);
        return;
      }

      try {
        const { data, error: leadError } = await supabaseClient
          .from('leads')
          .select('id, city, province, urgency_level, service_type, lead_price, assigned_agent_id')
          .eq('id', leadId)
          .single();

        if (leadError || !data) {
          setError('Lead not found');
          setLoading(false);
          return;
        }

        if (data.assigned_agent_id) {
          setError('This lead is no longer available');
          setLoading(false);
          return;
        }

        setLead(data);
      } catch (err) {
        console.error('Error loading lead:', err);
        setError('Failed to load lead');
      } finally {
        setLoading(false);
      }
    }

    loadLead();
  }, [leadId]);

  const handleBackToDashboard = () => {
    router.push('/agent/dashboard');
  };

  const handleBuyNow = async () => {
    if (!leadId) return;
    setBuying(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });

      const body = await res.json();

      if (!res.ok || !body?.url) {
        console.error('Checkout create error:', body);
        setError(body?.error || 'Could not start checkout. Please try again.');
        setBuying(false);
        return;
      }

      // Redirect to Stripe checkout
      window.location.href = body.url;
    } catch (err) {
      console.error('Buy Now error:', err);
      setError('Could not start checkout. Please try again.');
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl">
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="w-full max-w-2xl">
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="mb-4 inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
        >
          ← Back to dashboard
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return null;
  }

  const price = lead.lead_price ? lead.lead_price : 
    (lead.urgency_level?.toLowerCase() === 'hot' ? 35 :
     lead.urgency_level?.toLowerCase() === 'warm' ? 20 : 10);

  return (
    <div className="w-full max-w-2xl">
      <button
        type="button"
        onClick={handleBackToDashboard}
        className="mb-4 inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900"
      >
        ← Back to dashboard
      </button>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold text-neutral-900">
          Purchase Lead
        </h1>

        <div className="mb-6 space-y-2">
          <p className="text-sm text-neutral-600">
            <span className="font-medium">Location:</span>{' '}
            {lead.city || 'Unknown'}
            {lead.province && `, ${lead.province}`}
          </p>
          <p className="text-sm text-neutral-600">
            <span className="font-medium">Service type:</span>{' '}
            {lead.service_type || 'Not specified'}
          </p>
          <p className="text-sm text-neutral-600">
            <span className="font-medium">Price:</span> ${price.toFixed(2)}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={buying}
            className="rounded-full bg-black px-6 py-2 text-sm font-medium text-white hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {buying ? 'Starting checkout…' : `Buy now for $${price.toFixed(2)}`}
          </button>
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="rounded-full border border-neutral-300 bg-white px-6 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

