'use client';

import { useState } from 'react';

export default function BookForm({ leadId }: { leadId: string }) {
  const [date, setDate] = useState('');
  const [windowSlot, setWindowSlot] = useState<'morning' | 'afternoon' | 'evening' | ''>('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !windowSlot) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          requestedDate: date,
          requestedWindow: windowSlot,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to schedule appointment');
      }

      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-3">
        <p className="text-lg font-semibold">You&apos;re all set.</p>
        <p className="text-sm text-gray-600">
          We&apos;ve recorded your request and a specialist will contact you at your chosen time.
        </p>
      </div>
    );
  }

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Choose a day</label>
        <input
          type="date"
          value={date}
          min={today}
          onChange={e => setDate(e.target.value)}
          required
          className="border rounded px-3 py-2 w-full text-sm"
        />
      </div>

      <div>
        <p className="block text-sm font-medium mb-2">
          What time of day works best?
        </p>
        <div className="flex gap-3">
          {(['morning', 'afternoon', 'evening'] as const).map(slot => (
            <button
              key={slot}
              type="button"
              onClick={() => setWindowSlot(slot)}
              className={[
                'flex-1 border rounded px-3 py-2 text-sm capitalize transition-colors',
                windowSlot === slot ? 'bg-black text-white' : 'bg-white hover:bg-gray-50',
              ].join(' ')}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !date || !windowSlot}
        className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        {loading ? 'Booking…' : 'Confirm my call'}
      </button>
    </form>
  );
}

