import BookForm from './BookForm';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type Props = {
  params: { leadId: string };
};

export default async function BookPage({ params }: Props) {
  if (!supabaseAdmin) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-sm text-gray-600">
          Database configuration error. Please try again later.
        </p>
      </div>
    );
  }

  const { data: lead, error } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('id', params.leadId)
    .single();

  if (error || !lead) {
    return (
      <div className="max-w-xl mx-auto py-10">
        <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-sm text-gray-600">
          We couldn&apos;t find your request. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-4">
        Choose a time for your planning call
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        We&apos;ll connect you with a licensed pre-need specialist in the Okanagan at
        your chosen time. This call is free and no-obligation.
      </p>
      <BookForm leadId={lead.id} />
    </div>
  );
}

